const cloudinary = require('cloudinary').v2;
const logger = require('./logger');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          logger.error('Error While uploading media to cloudinary');
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};
const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('Media Deleted SuccessFully from Cloud Storage', publicId);
    return result;
  } catch (error) {
    logger.error('Error Deleting from Coludinary', error);
    throw error;
  }
};

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary };