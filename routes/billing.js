const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const RestaurantSetting = require('../models/RestaurantSetting');
const { verifyRestaurant } = require('../middleware/auth');

// ✅ Generate Invoice with GST, Service Charge, Total
router.get('/:id', verifyRestaurant, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
    });


    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const settings = await RestaurantSetting.findOne({ restaurantId: req.restaurantId });

    if (!settings) {
       console.log('❌ No settings found for this restaurant.');
      return res.status(400).json({ error: 'Settings not found for this restaurant.' });
    }

    console.log('Settings:', settings);

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const gstType = settings.gstType || 'none';
    const serviceChargePercent = settings.serviceChargePercent || 0;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let serviceCharge = 0;

    if (gstType === 'intra-state') {
      cgst = (subtotal * (settings.cgstPercent || 0)) / 100;
      sgst = (subtotal * (settings.sgstPercent || 0)) / 100;
    } else if (gstType === 'inter-state') {
      igst = (subtotal * (settings.gstPercent || 0)) / 100;
    }

    serviceCharge = (subtotal * serviceChargePercent) / 100;

    const total = subtotal + cgst + sgst + igst + serviceCharge;

    const billing = {
      subtotal,
      cgst,
      sgst,
      igst,
      serviceCharge,
      total,
      currency: settings.currency || '₹',
      billFooter: settings.billFooter || '',
    };

    res.json({
      success: true,
      order,
      billing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mark Order as Paid
router.put('/:id/pay', verifyRestaurant, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { status: 'Paid' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order marked as paid', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
