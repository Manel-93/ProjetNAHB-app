const mongoose = require('mongoose');

const storyContentSchema = new mongoose.Schema({
  story_id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StoryContent', storyContentSchema);

