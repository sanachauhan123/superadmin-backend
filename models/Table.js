const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: { type: String, required: true },
  capacity: { type: Number, required: true },
  restaurantId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Table', tableSchema);
