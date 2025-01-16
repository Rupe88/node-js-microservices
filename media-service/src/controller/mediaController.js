const Media = require('../models/mediaModel');
const uploadMediaToCloudinary = require('../utils/cloudinary');
const logger = require('../utils/logger');
const uploadMedia = async (req, res) => {
  try {
    // Debug: Log incoming file details
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);

    // Check if file is present
    if (!req.file) {
      logger.error('No file found in the request');
      return res.status(400).json({
        success: false,
        message: 'No file found. Ensure the field name is "file".',
      });
    }

    // File processing (Cloudinary upload, DB save, etc.)
    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    const newMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newMedia._id,
      url: newMedia.url,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    logger.error('Error uploading media:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading media',
    });
  }
};

//get all medias

const getAllMedias=async(req, res)=>{
  try {
    const results=await Media.find({});
    res.json({results});

  } catch (error) {
    logger.error('Error Fetching Media ', error);
    res.status(500).json({
      success: false,
      message: 'Error Fetching Media ',
    });
    
  }
}



module.exports = { uploadMedia ,getAllMedias};
