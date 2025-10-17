const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyRestaurant } = require('../middleware/auth');

// Absolute path to public_html/uploads
const uploadDir = path.join(__dirname, '../public_html/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

// POST /api/upload
router.post('/', verifyRestaurant, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Return the public URL
  const imageUrl = `https://stridedge.tech/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

module.exports = router;
