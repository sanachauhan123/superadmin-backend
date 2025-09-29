import express from 'express';
import multer from 'multer';
import { verifyRestaurant } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

const router = express.Router();

// Use multer in memory (no local storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/upload
router.post('/', verifyRestaurant, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload buffer to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'restaurantApp' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Upload failed' });
        }
        res.json({ success: true, imageUrl: result.secure_url });
      }
    );

    // Convert buffer to stream
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    bufferStream.pipe(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
