const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/refreshToken');
require('dotenv').config();

const generateTokens = async (user) => {
  // Validate user object
  if (!user || !user._id || !user.username) {
    throw new Error('Invalid user object passed to generateTokens');
  }

  // Generate access token
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: '60m' }
  );

  // Generate refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token expires in 7 days

  // Store refresh token in the database
  try {
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });
  } catch (error) {
    throw new Error(`Failed to store refresh token: ${error.message}`);
  }

  // Return tokens
  return { accessToken, refreshToken };
};

module.exports = generateTokens;
