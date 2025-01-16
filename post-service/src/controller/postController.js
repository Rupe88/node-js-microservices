const Post = require('../models/postModel');
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');
const { validateCreatePost } = require('../utils/validation');

async function InvalidatePostCache(req, input) {
  try {
    const keys = await req.redisClient.keys('posts:*');
    if (keys.length > 0) {
      await req.redisClient.del(keys);
    }
  } catch (error) {
    logger.error(`Error invalidating post cache: ${error.message}`);
  }
}

//create post
const createPost = async (req, res) => {
  logger.info('Create Post Endpoint hit..');
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;

    const post = await Post.findOne({ content });
    if (post) {
      logger.warn('Post already exists');

      return res.status(400).json({
        success: false,
        message: 'Post Already Exists in Database',
      });
    }

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    await InvalidatePostCache(req, newlyCreatedPost._id.toString());
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}`;
    const cachePosts = await req.redisClient.get(cacheKey);
    if (cachePosts) {
      return res.json(JSON.stringify(cachePosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    const totalNumberPosts = await Post.countDocuments();
    const result = {
      posts,
      currentPage: page,
      totalPage: Math.ceil(totalNumberPosts / limit),
      totalPosts: totalNumberPosts,
    };

    //save your post in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    res.json(result);
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
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;

    // Check if the post is in the cache
    const cachedPost = await req.redisClient.get(cacheKey);
    if (cachedPost) {
      logger.info(`Post with ID ${postId} served from cache.`);
      return res.json(JSON.parse(cachedPost));
    }

    // If not in cache, fetch from the database
    const singlePostDetailsById = await Post.findById(postId);
    if (!singlePostDetailsById) {
      logger.warn(`Post with ID ${postId} not found.`);
      return res.status(404).json({
        success: false,
        message: 'Post not Found',
      });
    }

    // Store the fetched post in the cache with a TTL of 1 hour (3600 seconds)
    await req.redisClient.setex(
      cacheKey, // Use the cacheKey for setting the value
      3600, // TTL in seconds
      JSON.stringify(singlePostDetailsById)
    );

    logger.info(`Post with ID ${postId} fetched from database and cached.`);
    res.json(singlePostDetailsById);
  } catch (error) {
    logger.error(`Error Fetching Post: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error Fetching Post by Id',
    });
  }
};

//delete post
const deletePost = async (req, res) => {
  logger.warn('Delete Post Endpoint hit..');
  try {
    const { id } = req.params;

    // Check if the post exists in the database
    const post = await Post.findById(id);
    if (!post) {
      logger.warn(`Post with ID ${id} not found.`);
      return res.status(404).json({
        success: false,
        message: 'Post not Found',
      });
    }

//publish post delete method
await publishEvent('post.deleted', {
  postId:post._id.toString(),
  userId:req.user.userId,
  mediaIds:post.mediaIds
})

    // Delete the post from the database
    await Post.findByIdAndDelete(id);

    // Invalidate the cache for the specific post
    const cacheKey = `post:${id}`;
    await req.redisClient.del(cacheKey);
    logger.info(`Cache invalidated for post with ID ${id}.`);

    // Optional: Invalidate cache for all posts (e.g., paginated lists)
    const keys = await req.redisClient.keys('posts:*');
    if (keys.length > 0) {
      await req.redisClient.del(keys);
      logger.info(`Cache invalidated for all posts.`);
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
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
