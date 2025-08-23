const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  gstType: { type: String, enum: ['none', 'cgst_sgst', 'igst'], default: 'none' },
  gstPercent: { type: Number, default: 0 },
  serviceChargePercent: { type: Number, default: 0 },
  currency: { type: String, default: '₹' },
  billFooter: { type: String, default: 'Thank you for visiting!' }
});

module.exports = mongoose.model('RestaurantSetting', settingSchema);
