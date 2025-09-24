const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String, // phone or email
    required: true,
    trim: true
  },
  restaurantId: {
    type: String, // matches the restaurantId stored in restaurants collection
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
