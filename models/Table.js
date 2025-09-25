const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: { type: String, required: true },
  capacity: { type: Number, required: true },
  restaurantId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-kitchen', 'served', 'completed', 'cancelled', 'Available'],
    default: 'Available'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Table', tableSchema);
