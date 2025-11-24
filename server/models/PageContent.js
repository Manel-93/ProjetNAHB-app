const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  page_id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  text: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PageContent', pageContentSchema);

