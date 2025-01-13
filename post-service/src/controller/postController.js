const Post = require('../models/postModel');
const logger = require('../utils/logger');
const createPost = async (req, res) => {
  logger.warn('Create Post Endpoint hit..');
  try {
    
    const { content, mediaIds } = req.body;

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    logger.info('Post Created SuccessFully !');
    res.status(201).json({
      success: true,
      message: 'Post created Successfully',
    });
  } catch (error) {
    logger.error(`Error Creating Post`, error);
    res.status(500).json({
      success: false,
      message: 'Error Creating Post`',
    });
  }
};
//get all post

const getAllPost = async (req, res) => {
  logger.warn('Get All Post Post Endpoint hit..');
  try {
  } catch (error) {
    logger.error(`Error Fetching Posts`, error);
    res.status(500).json({
      success: false,
      message: 'Error Fetching Posts`',
    });
  }
};
//get post by id
const getPost = async (req, res) => {
  logger.warn('Get Post Endpoint hit..');
  try {
  } catch (error) {
    logger.error(`Error Fetching Post`, error);
    res.status(500).json({
      success: false,
      message: 'Error Fetching Post by Id`',
    });
  }
};

//delete post
const deletePost = async (req, res) => {
  logger.warn('Delete Post Endpoint hit..');
  try {
  } catch (error) {
    logger.error(`Error Deleting Post`, error);
    res.status(500).json({
      success: false,
      message: 'Error Deleting Post `',
    });
  }
};

module.exports = {
  createPost,
  getPost,
  deletePost,
  getAllPost,
};
