require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const postRoutes = require('./routes/postRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const app = express();

const PORT = process.env.PORT || 3002;

//database connection
mongoose
  .connect(process.env.DB_URI)
  .then(() => logger.info('connected to mongodb'))
  .catch((e) => logger.warn('error in db connection', e));

const redisClient = new Redis(process.env.REDIS_URL);
//Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

//*** - implement Ip based rate limiting for sensitive endpoints */

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

app.use('/api/posts/create-post', sensitiveEndpointsLimiter);
//routes -> pass redis client
app.use(
  '/api/posts',
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Post service is Running on http://localhost:${PORT}`);
});

//unhandled promise rejection
process.on('unhandleRejection', (reason, promise) => {
  logger.error('Unhandle Rejection at', promise, 'reason:', reason);
});
