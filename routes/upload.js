const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyRestaurant } = require('../middleware/auth');

// Temporary upload folder on Render
const tempUploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

// POST /api/upload
router.post('/', verifyRestaurant, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Return temp URL (for reference, frontend will use cPanel URL manually)
  const imageUrl = `${req.file.filename}`;
  res.json({ success: true, imageUrl, filename: req.file.filename });
});

module.exports = router;
