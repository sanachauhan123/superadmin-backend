const express = require('express');
const router = express.Router();
const { verifyRestaurant } = require('../middleware/auth');
const Order = require('../models/Order');

router.get('/', async (req, res) => {
  try {
    const restaurantId = req.restaurantId;

   const today = new Date();
today.setUTCHours(0, 0, 0, 0);

// Get start of the week in UTC
const startOfWeek = new Date(today);
startOfWeek.setUTCDate(today.getUTCDate() - today.getUTCDay());

// Get start of the month in UTC
const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

   const [salesToday] = await Order.aggregate([
  { $match: { restaurantId, status: 'served', createdAt: { $gte: today } } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
]);
const totalSalesToday = salesToday?.total || 0;

const [salesWeek] = await Order.aggregate([
  { $match: { restaurantId, status: 'served', createdAt: { $gte: startOfWeek } } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
]);
const totalSalesWeek = salesWeek?.total || 0;

const [salesMonth] = await Order.aggregate([
  { $match: { restaurantId, status: 'served', createdAt: { $gte: startOfMonth } } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
]);
const totalSalesMonth = salesMonth?.total || 0;


    const totalOrders = await Order.countDocuments({ restaurantId });
    const unpaidOrders = await Order.countDocuments({ restaurantId, status: 'pending' });

    const topItems = await Order.aggregate([
      { $match: { restaurantId } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
          totalSalesToday,
          totalSalesWeek,
          totalSalesMonth,
          totalOrders,
          unpaidOrders,
          topItems,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
