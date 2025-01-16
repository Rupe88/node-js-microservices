const express = require('express');
const multer = require('multer');
const { uploadMedia, getAllMedias } = require('../controller/mediaController');
const authenticateRequest = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const router = express.Router();

// Upload file configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
}).single('file'); // Ensure the field name is 'file'

// Media upload route
router.post(
  '/upload',
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          logger.error('Unexpected field error:', err);
          return res.status(400).json({
            success: false,
            message: 'Unexpected field in the request. Check the field name.',
            error: err.message,
          });
        }
        logger.error('Multer error while uploading:', err);
        return res.status(400).json({
          success: false,
          message: 'Multer error while uploading',
          error: err.message,
        });
      } else if (err) {
        logger.error('Unknown error occurred while uploading:', err);
        return res.status(500).json({
          success: false,
          message: 'Unknown error occurred while uploading',
          error: err.message,
        });
      }

      if (!req.file) {
        logger.error('No file found in the request');
        return res.status(400).json({
          success: false,
          message: 'No file found in the request',
        });
      }

      // Proceed to next middleware if no errors
      next();
    });
  },
  uploadMedia
);

//get all the medias
router.get('/get-medias',authenticateRequest, getAllMedias);

module.exports = router;
