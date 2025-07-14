const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  code: String,
  expiresAt: Date
}, { _id: false });

const resetTokenSchema = new mongoose.Schema({
  token: String, 
  expiresAt: Date
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },

  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  loginAttemptsTimestamps: [Date],
  lockUntil: Date,

  otp: otpSchema,
  resetPasswordToken: resetTokenSchema
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
