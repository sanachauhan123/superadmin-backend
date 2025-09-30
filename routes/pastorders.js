const express = require('express');
const router = express.Router();
const Pastorder = require('../models/Pastorder');
const { verifyRestaurant } = require('../middleware/auth');

// Get all orders (for Super Admin)
router.get('/',verifyRestaurant, async (req, res) => {
  try {
    const orders = await Pastorder.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order
router.post('/', verifyRestaurant, async (req, res) => {
  try {
    const { tableId, items, status, _id } = req.body;
    console.log("Received order payload:", req.body);

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Pastorder({
      _id,
      tableId,
      restaurantId: req.restaurantId,
      items,
      status, 
      totalAmount
    });

    await order.save();

    res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyRestaurant, async (req, res) => {
  try {
    const updates = req.body;

    const result = await Pastorder.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      updates,
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order updated', data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete order
router.delete('/:id', verifyRestaurant, async (req, res) => {
  try {
    await Pastorder.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Invoice
router.get('/:id/invoice', verifyRestaurant, async (req, res) => {
  try {
    const order = await Pastorder.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const Setting = require('../models/Setting');
    const settings = await Setting.findOne({ restaurantId: req.restaurantId });

    const gstType = settings?.gstType || 'none';
    const gstPercent = settings?.gstPercent || 0;
    const serviceCharge = settings?.serviceCharge || 0;
    const currency = settings?.currency || '₹';

    const subtotal = order.totalAmount;

    let cgst = 0, sgst = 0, igst = 0;
    if (gstType === 'cgst_sgst') {
      cgst = (subtotal * gstPercent) / 200;
      sgst = (subtotal * gstPercent) / 200;
    } else if (gstType === 'igst') {
      igst = (subtotal * gstPercent) / 100;
    }

    const serviceChargeAmount = (subtotal * serviceCharge) / 100;

    const total = subtotal + cgst + sgst + igst + serviceChargeAmount;

    const billing = {
      subtotal,
      cgst,
      sgst,
      igst,
      serviceCharge: serviceChargeAmount,
      total,
      currency,
      billFooter: settings?.billFooter || 'Thank you for visiting!'
    };

    res.json({ order, billing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
