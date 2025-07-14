const User = require('../models/User');
const Device = require('../models/Device');
const bcrypt = require('bcryptjs');
const uaParser = require('ua-parser-js');
const { validatePasswordComplexity } = require('../utils/passwordUtils');
const { sendLoginAlertEmail } = require('../services/mail.service');
const otpService = require('../services/otp.service');
const tokenService = require('../services/token.service');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validatePasswordComplexity(password)) {
      return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = new User({ email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ message: 'Account locked temporarily. Try again later.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      user.loginAttemptsTimestamps.push(new Date());

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.isLocked = true;
      }

      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.loginAttemptsTimestamps = [];
    user.lockUntil = null;
    user.isLocked = false;
    await user.save();

    const userAgent = uaParser(req.headers['user-agent']);
    const deviceData = {
      userId: user._id,
      browser: userAgent.browser.name,
      os: userAgent.os.name,
      ip: req.ip,
      lastUsed: new Date()
    };

    const existingDevice = await Device.findOne({
      userId: user._id,
      browser: deviceData.browser,
      os: deviceData.os,
      ip: deviceData.ip
    });

    if (!existingDevice) {
      await Device.create(deviceData);
      await sendLoginAlertEmail(user.email, deviceData);
    }

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = otpService.generateOTP();
    const hashedOTP = await otpService.hashOTP(otp);

    user.otp = {
      code: hashedOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };

    await user.save();

    console.log('Generated OTP:', otp);
console.log('User found:', user.email);

    console.log(`OTP for ${email}: ${otp}`);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const isValid = await otpService.verifyOTP(otp, user.otp.code);
    if (!isValid) return res.status(400).json({ message: 'Incorrect OTP' });

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { rawToken, hashedToken } = tokenService.generateResetToken();

    user.resetPasswordToken = {
      token: hashedToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    };

    await user.save();

    const resetLink = `http://localhost:4000/api/auth/reset-password/${rawToken}`;
    console.log(`Password reset link for ${email}: ${resetLink}`);

    res.json({ message: 'Reset password link sent to email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!validatePasswordComplexity(password)) {
      return res.status(400).json({ message: 'Password does not meet complexity requirements' });
    }

    const user = await User.findOne({
      'resetPasswordToken.expiresAt': { $gt: Date.now() }
    });

    if (!user || !user.resetPasswordToken.token) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const isValid = await tokenService.verifyResetToken(token, user.resetPasswordToken.token);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

