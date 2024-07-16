const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileLength: {
    type: String,
    required: true
  },
  fileUploadDate: {
    type: String,
    required: true
  },
  data: { type: Buffer, required: true }

});

module.exports = mongoose.model('File', FileSchema);
