const transporter = require('../utils/mailer');

const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Secure Auth" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <h3>OTP Verification</h3>
      <p>Your OTP code is: <b>${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
};

module.exports = sendOTPEmail;
