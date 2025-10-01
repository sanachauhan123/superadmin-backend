const express = require('express');
const router = express.Router();
const { verifyRestaurant } = require('../middleware/auth');
const Pastorder = require('../models/Pastorder');

router.get('/', verifyRestaurant, async (req, res) => {
  try {
    const restaurantId = req.restaurantId;

    // --- Calculate dates in IST ---
    const now = new Date();
    const IST_OFFSET = 330; // 5:30 hours in minutes

    // Helper to convert UTC date to IST
    function getISTDate(date) {
      return new Date(date.getTime() + IST_OFFSET * 60000);
    }

    // Start of today IST
    const nowIST = getISTDate(now);
    const startOfToday = new Date(
      nowIST.getFullYear(),
      nowIST.getMonth(),
      nowIST.getDate(),
      0, 0, 0, 0
    );

    // Start of tomorrow IST
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfToday.getDate() + 1);

    // Start of week IST (Sunday)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    // Start of month IST
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    // Convert back to UTC for MongoDB query
    function toUTC(date) {
      return new Date(date.getTime() - IST_OFFSET * 60000);
    }

    const startOfTodayUTC = toUTC(startOfToday);
    const startOfTomorrowUTC = toUTC(startOfTomorrow);
    const startOfWeekUTC = toUTC(startOfWeek);
    const startOfMonthUTC = toUTC(startOfMonth);

    // --- Aggregations ---

    // Total Sales Today
    const [salesToday] = await Pastorder.aggregate([
      {
        $match: {
          restaurantId,
          status: 'Paid',
          createdAt: { $gte: startOfTodayUTC, $lt: startOfTomorrowUTC },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalSalesToday = salesToday?.total || 0;

    // Total Sales This Week
    const [salesWeek] = await Pastorder.aggregate([
      {
        $match: {
          restaurantId,
          status: 'Paid',
          createdAt: { $gte: startOfWeekUTC },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalSalesWeek = salesWeek?.total || 0;

    // Total Sales This Month
    const [salesMonth] = await Pastorder.aggregate([
      {
        $match: {
          restaurantId,
          status: 'Paid',
          createdAt: { $gte: startOfMonthUTC },
        },
      },
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

    // --- Response ---
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
