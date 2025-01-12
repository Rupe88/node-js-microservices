// mongo db connection
require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const app = express();
const cors = require('cors');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

//database connection
mongoose
  .connect(process.env.DB_URI)
  .then(() => logger.info('connected to mongodb'))
  .catch((e) => logger.warn('error in db connection', e));

//redis connection
const redisClient = new Redis(process.env.REDIS_URL);

//Middleware
app.use(helmet);
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body} request to ${req.body}`);
  next();
});

//DDOS protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((e) => logger.warn(`Rate limit exceeded for IP:${req.ip}`, e));
  res.status(429).json({
    success: false,
    message: 'Too many requests',
  });
});
