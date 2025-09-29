const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Pastorder = require('../models/Pastorder');
const Completeorder = require('../models/Completeorder');
const RestaurantSetting = require('../models/RestaurantSetting');
const { verifyRestaurant } = require('../middleware/auth');

// ✅ Generate Invoice with GST, Service Charge, Total
router.get('/:id', verifyRestaurant, async (req, res) => {
  try {
    console.log('resId',req.restaurantId);
    console.log('ID', req.params.id)
    // 1️⃣ Fetch order & settings
    let order = await Order.findOne({ _id: req.params.id, restaurantId: req.restaurantId});
console.log('Order', order);

if (!order) {
    order = await Pastorder.findOne({ _id: req.params.id});
    console.log('Pastorder', order);
}

if (!order) {
    order = await Completeorder.findOne({ _id: req.params.id });
    console.log('CompleteOrder', order);
}

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const settings = await RestaurantSetting.findOne({
      restaurantId: req.restaurantId,
    });
    if (!settings)
      return res.status(400).json({ error: 'Settings not found for this restaurant.' });

    // 2️⃣ Recalculate subtotal from items
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 3️⃣ Apply discount/service/taxes from settings
    const discount = order.discount || 0;

    const serviceCharge = settings.serviceChargePercent
      ? (subtotal * settings.serviceChargePercent) / 100
      : 0;

    const cgst = settings.cgstPercent ? (subtotal * settings.cgstPercent) / 100 : 0;
    const sgst = settings.sgstPercent ? (subtotal * settings.sgstPercent) / 100 : 0;
    const igst = settings.igstPercent ? (subtotal * settings.igstPercent) / 100 : 0;

    const totalAmount = subtotal - discount + serviceCharge + cgst + sgst + igst;

    // 4️⃣ Persist updated values back to the order
    order.subtotal = subtotal;
    order.discount = discount;
    order.serviceCharge = serviceCharge;
    order.cgst = cgst;
    order.sgst = sgst;
    order.igst = igst;
    order.totalAmount = totalAmount;
    await order.save();

    // 5️⃣ Prepare billing object for the invoice
    const billing = {
      subtotal,
      discount,
      discountPercent: settings.defaultDiscountPercent || 0,
      cgst,
      sgst,
      igst,
      serviceCharge,
      total: totalAmount,
      currency: settings.currency || '₹',
      billFooter: settings.billFooter || '',
    };

    res.json({ success: true, order, billing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mark Order as Paid
router.put('/:id/pay', verifyRestaurant, async (req, res) => {
  try {
    const { discountPercent = 0 } = req.body;

    let order = await Order.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!order) {
    order = await Completeorder.findOne({ _id: req.params.id});
}
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const settings = await RestaurantSetting.findOne({ restaurantId: req.restaurantId });
    if (!settings) return res.status(400).json({ error: 'Settings not found' });

    // Calculate billing
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceChargePercent = settings.serviceChargePercent || 0;
    const gstType = settings.gstType || 'none';

    let cgst = 0, sgst = 0, igst = 0;

    if (gstType === 'intra-state') {
      cgst = (subtotal * (settings.cgstPercent || 0)) / 100;
      sgst = (subtotal * (settings.sgstPercent || 0)) / 100;
    } else if (gstType === 'inter-state') {
      igst = (subtotal * (settings.gstPercent || 0)) / 100;
    }

    const serviceCharge = (subtotal * serviceChargePercent) / 100;
    const discountAmount = (subtotal * discountPercent) / 100;

    const totalAmount = subtotal + cgst + sgst + igst + serviceCharge - discountAmount;

    // Update order
    order.subtotal = subtotal;
    order.cgst = cgst;
    order.sgst = sgst;
    order.igst = igst;
    order.serviceCharge = serviceCharge;
    order.discount = discountAmount;
    order.totalAmount = totalAmount;
    order.status = 'Paid';

    await order.save();

    res.json({ success: true, message: 'Order marked as paid', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
