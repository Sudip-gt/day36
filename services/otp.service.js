const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

exports.hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

exports.verifyOTP = async (plainOTP, hashedOTP) => {
  return await bcrypt.compare(plainOTP, hashedOTP);
};
