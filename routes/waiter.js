const express = require("express");
const router = express.Router();
const Waiter = require("../models/Waiter");
const Restaurant = require("../models/Restaurant");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// CREATE waiter
router.post('/', async (req, res) => {
  console.log("Incoming request body:", req.body);

  try {
    const { name, email, password, restaurant, image  } = req.body;
    //console.log(restaurantId)

    const existing = await Waiter.findOne({ email });
    if (existing) {
    return res.status(400).json({ error: 'Email already in use' });
    }

    if (!name || !email || !password || !restaurant) {
      return res.status(400).json({ error: "All fields are required" });
    }

     const restaurantRecord = await Restaurant.findOne({ name: restaurant });
    if (!restaurantRecord) {
      return res.status(400).json({ error: "Restaurant not found" });
    }

    const restaurantId = restaurantRecord.restaurantId;
    console.log(restaurantId)

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save restaurant with hashed password
    const waiter = new Waiter({
      name,
      email,
      password: hashedPassword,
      restaurantId,
      restaurant,
      image,
    });

    await waiter.save();

    // ✅ Hide password before sending response
    const response = waiter.toObject();
    delete response.password;

    res.status(201).json({ success: true, data: response });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, error: err.message });

  }
});

// LIST all waiters
router.get("/", async (req, res) => {
  const waiters = await Waiter.find({});
  res.json({ success: true, data: waiters });
});

// UPDATE waiter
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, restaurant, image } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (restaurant) updateData.restaurant = restaurant;
    if (image) updateData.image = image; // already hosted Cloudinary URL

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const exists = await Waiter.findOne({ email, _id: { $ne: req.params.id } });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const waiter = await Waiter.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");

    if (!waiter) return res.status(404).json({ error: "Waiter not found" });

    res.json({ success: true, data: waiter });
  } catch (err) {
    console.error("PUT /waiters/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// DELETE waiter
router.delete("/:id", async (req, res) => {
  try {
    const waiter = await Waiter.findByIdAndDelete(req.params.id);
    if (!waiter) return res.status(404).json({ error: "Waiter not found" });

    res.json({ success: true, message: "Waiter deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// LOGIN waiter
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const waiter = await Waiter.findOne({ email });
    if (!waiter) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, waiter.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ waiterId: waiter._id, restaurantId: waiter.restaurantId }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      waiter: {
        id: waiter._id,
        name: waiter.name,
        email: waiter.email,
        restaurantId: waiter.restaurantId,
        restaurant: waiter.restaurant,
        image: waiter.image || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
