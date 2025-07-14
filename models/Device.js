const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  browser: String,
  os: String,
  ip: String,
  lastUsed: Date
});

module.exports = mongoose.model('Device', deviceSchema);
