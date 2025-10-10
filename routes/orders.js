const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { verifyRestaurant } = require('../middleware/auth');

// Get all orders (for Super Admin)
router.get('/', verifyRestaurant, async (req, res) => {
  try {
    // Fetch only orders for the logged-in restaurant
    const orders = await Order.find({ restaurantId: req.restaurantId })
                              .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Create order
// Create order
router.post('/', verifyRestaurant, async (req, res) => {
  try {
    const { tableId, items } = req.body;
    console.log("Received order payload:", req.body);

    // Add status to each item, but do NOT merge duplicates
    const itemsWithStatus = items.map((item) => ({
      ...item,
      status: 'pending', // every new addition starts as pending
    }));

    const totalAmount = itemsWithStatus.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = new Order({
      tableId,
      restaurantId: req.restaurantId,
      items: itemsWithStatus,
      totalAmount,
    });

    await order.save();

    res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add items to an existing order (new entries)
router.post('/:id/add-items', verifyRestaurant, async (req, res) => {
  try {
    const { items } = req.body;
    const order = await Order.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Add new items as separate entries with pending status
    const itemsWithStatus = items.map((item) => ({
      ...item,
      status: 'pending'
    }));

    // Push new items into order.items array
    order.items.push(...itemsWithStatus);

    // Recalculate totalAmount
    const totalAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    order.totalAmount = totalAmount;

    await order.save();

    res.json({ success: true, message: 'Items added to order', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update specific item status
router.put('/:orderId/items/:itemId/status', verifyRestaurant, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findOne({ _id: req.params.orderId, restaurantId: req.restaurantId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Find the item and update its status
    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.status = status;

    await order.save();

    res.json({ success: true, message: 'Item status updated', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:id', verifyRestaurant, async (req, res) => {
  try {
    const updates = req.body;

    const result = await Order.findOneAndUpdate(
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

// Update status
router.put('/:id/status', verifyRestaurant, async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { status }
    );
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id/items/:menuid', verifyRestaurant, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Remove the item by menuId
    order.items = order.items.filter(item => item.menuId !== req.params.menuid);

    await order.save();

    res.json({ success: true, message: 'Item deleted successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyRestaurant, async (req, res) => {
  try {
    await Order.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Invoice
router.get('/:id/invoice', verifyRestaurant, async (req, res) => {
  try {
    const order = await Order.findOne({
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
