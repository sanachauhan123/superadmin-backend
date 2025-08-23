const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true, unique: true },

  restaurantName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  gstin: { type: String },

  gstType: { 
    type: String, 
    enum: ['intra-state', 'inter-state', 'none'], 
    default: 'intra-state' 
  },
  gstPercent: { type: Number, default: 0 }, 
  cgstPercent: { type: Number, default: 0 }, 
  sgstPercent: { type: Number, default: 0 },

  currency: { type: String, default: '₹' },
  printerPaperSize: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
  printerName: { type: String, default: '' },
  billFooter: { type: String, default: 'Thank you! Visit Again.' },
  serviceChargePercent: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('RestaurantSetting', settingSchema);
