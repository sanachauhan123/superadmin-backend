const mongoose = require('mongoose');

const pastorderSchema = new mongoose.Schema({
  tableId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  items: [
    {
      menuId: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-kitchen', 'served', 'completed', 'cancelled', 'Paid'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pastorder', pastorderSchema);
