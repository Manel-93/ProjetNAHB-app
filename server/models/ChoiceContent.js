const mongoose = require('mongoose');

const choiceContentSchema = new mongoose.Schema({
  choice_id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChoiceContent', choiceContentSchema);

