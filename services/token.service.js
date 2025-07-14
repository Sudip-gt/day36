const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex'); // send to user
  return {
    rawToken,
    hashedToken: bcrypt.hashSync(rawToken, 10) // store in DB
  };
};
exports.verifyResetToken = (token, hashedToken) => {
  return bcrypt.compare(token, hashedToken);
};
