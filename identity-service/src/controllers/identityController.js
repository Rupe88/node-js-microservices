const logger = require('../utils/logger');
const User = require('../models/userModel');
const { validateRegistration } = require('../utils/validation');
const generateTokens = require('../utils/generateToken');
//user register
const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit..');

  try {
    //validate schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn(`validation error`, error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn(`user already exists`);
      return res.status(400).json({
        success: false,
        message: 'user already exists',
      });
    }

    user = new User({ username, email, password });
    await user.save();

    logger.warn('user saved successfully', user._id);

    const { accessToken, refreshToken } = await generateTokens();
    res.status(201).json({
      success: true,
      message: 'user Register successfully',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration error occur', error);
    res.status(500).json({
      success: false,
      message: 'internal server error',
    });
  }
};
//user login

//refresh token

//user logout

module.exports = {
  registerUser,
};
