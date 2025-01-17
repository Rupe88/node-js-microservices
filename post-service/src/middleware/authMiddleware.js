const logger = require('../utils/logger');

const authenticateRequest = async (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    logger.warn(`Access attempted without user Id`);
    return res.status(401).json({
      success: false,
      message: 'Authentication is Required Please Login',
    });
  }

  req.user = { userId };
  next();
};

module.exports = authenticateRequest;
