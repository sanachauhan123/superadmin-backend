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
// Create or update order
router.post('/', verifyRestaurant, async (req, res) => {
  try {
    const { tableId, items } = req.body;
    console.log("Received order payload:", req.body);

    // Check if there's already an active order for the same table
    let order = await Order.findOne({
      tableId,
      restaurantId: req.restaurantId,
      status: { $in: ["pending", "in-kitchen"] }, // active order
    });

    if (order) {
      // If order exists → merge items smartly
      items.forEach((newItem) => {
        const existingItem = order.items.find(
          (item) =>
            item.menuId === newItem.menuId &&
            (item.status === "pending" || item.status === "in-kitchen")
        );

        if (existingItem) {
          // If same item is still pending/in-kitchen, increase qty
          existingItem.quantity += newItem.quantity;
        } else {
          // Else add as a new separate pending item
          order.items.push({
            ...newItem,
            status: "pending",
          });
        }
      });

      // Recalculate total
      order.totalAmount = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await order.save();
      return res.json({
        success: true,
        message: "Order updated with new items",
        data: order,
      });
    } else {
      // If no active order, create new
      const itemsWithStatus = items.map((item) => ({
        ...item,
        status: "pending",
      }));

      const totalAmount = itemsWithStatus.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const newOrder = new Order({
        tableId,
        restaurantId: req.restaurantId,
        items: itemsWithStatus,
        totalAmount,
      });

      await newOrder.save();
      return res
        .status(201)
        .json({ success: true, message: "New order created", data: newOrder });
    }
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
