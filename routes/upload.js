const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyRestaurant } = require('../middleware/auth');

// ✅ Storage setup (Uploads to /uploads folder)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

// ✅ POST /api/upload
router.post('/', verifyRestaurant, upload.single('image'), async(req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

module.exports = router;
