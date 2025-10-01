const express = require('express');
const router = express.Router();
const { verifyRestaurant } = require('../middleware/auth');
const Pastorder = require('../models/Pastorder');

router.get('/', verifyRestaurant, async (req, res) => {
  try {
    const restaurantId = req.restaurantId;

    // --- Calculate dates in IST ---
   const now = new Date();

// Start of today (UTC)
const startOfToday = new Date(Date.UTC(
  now.getUTCFullYear(),
  now.getUTCMonth(),
  now.getUTCDate(), 0, 0, 0, 0
));

// Start of tomorrow
const startOfTomorrow = new Date(startOfToday);
startOfTomorrow.setUTCDate(startOfToday.getUTCDate() + 1);

// Start of week (Sunday)
const startOfWeek = new Date(startOfToday);
startOfWeek.setUTCDate(startOfToday.getUTCDate() - startOfToday.getUTCDay());

// Start of month
const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // --- Aggregations ---
    const [salesToday] = await Pastorder.aggregate([
      {
        $match: {
          restaurantId,
          status: 'Paid',
          createdAt: { $gte: startOfToday, $lt: startOfTomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalSalesToday = salesToday?.total || 0;

    const [salesWeek] = await Pastorder.aggregate([
      { $match: { restaurantId, status: 'Paid', createdAt: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalSalesWeek = salesWeek?.total || 0;

    const [salesMonth] = await Pastorder.aggregate([
      { $match: { restaurantId, status: 'Paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalSalesMonth = salesMonth?.total || 0;

    // Total orders
    const totalOrders = await Pastorder.countDocuments({ restaurantId });

    // Unpaid orders
    const unpaidOrders = await Pastorder.countDocuments({ restaurantId, status: 'pending' });

    // Top 5 items
    const topItems = await Pastorder.aggregate([
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
