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
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const routes = require('./routes/identityRoutes');
const errorHandler = require('./middleware/errorHandler');
//database connection
mongoose
  .connect(process.env.DB_URI)
  .then(() => logger.info('connected to mongodb'))
  .catch((e) => logger.warn('error in db connection', e));

//redis connection
const redisClient = new Redis(process.env.REDIS_URL);
const PORT = process.env.PORT || 3001;
//Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

//DDOS protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,
  duration: 1,
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip); // Consume 1 point
    next(); // Allow the request to proceed
  } catch (rateLimiterRes) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  }
});

//IP BASED RATE LIMITING FOR SENSITIVE ENDPOINTS
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
  handler: (req, res, next) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP:${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// apply this sensitiveEndPoints limitter to our routes

app.use('/api/auth/register', sensitiveEndpointsLimiter);

//Routes
app.use('/api/auth', routes);

//errror handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity service is Running on http://localhost:${PORT}`);
});

//unhandled promise rejection
process.on('unhandleRejection', (reason, promise) => {
  logger.error('Unhandle Rejection at', promise, 'reason:', reason);
});
