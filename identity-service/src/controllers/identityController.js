const logger = require('../utils/logger');
const User = require('../models/userModel');
const { validateRegistration, validateLogin } = require('../utils/validation');
const generateTokens = require('../utils/generateToken');
//register user
const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit..');

  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, username, password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn('User already exists');
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create and save the user
    user = new User({ username, email, password });
    await user.save();
    logger.info(`User saved successfully: ${JSON.stringify(user)}`);

    // Validate the saved user object
    if (!user || !user._id || !user.username) {
      logger.error('Invalid user object after saving:', { user });
      throw new Error('Invalid user object after saving');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration error occur', { error: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

//login user
const loginUser = async (req, res) => {
  logger.info('Login endpoint hit..');

  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn(`Login Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Invalid User`);
      return res.status(400).json({
        success: false,
        message: 'invalid credentails',
      });
    }

    //valid password or not
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn(`Invalid Password`);
      return res.status(400).json({
        success: false,
        message: 'invalid Password',
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error('Login error occur', { error: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
