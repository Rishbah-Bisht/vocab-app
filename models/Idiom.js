const mongoose = require('mongoose');

const idiomSchema = new mongoose.Schema({
  idiom: String,
  meaning: String,
  example: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Idiom', idiomSchema);
