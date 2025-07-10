const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  word: String,
  meaning: String,
  sentence: String, // ✅ New field
  date: {
    type: Date,
    default: Date.now // ✅ Automatically sets current date when document is created
  }
});

module.exports = mongoose.model('Word', wordSchema);
