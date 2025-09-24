const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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

  // Billing breakdown
  subtotal: { type: Number, default: 0 }, // before GST, service charge, discount
  discount: { type: Number, default: 0 },     // % or absolute depending on your logic
  serviceCharge: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }, // final total after everything

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

module.exports = mongoose.model('Order', orderSchema);
