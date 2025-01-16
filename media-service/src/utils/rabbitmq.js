const amqp = require('amqplib');
const logger = require('./logger');

require('dotenv').config();

// Declare variables for connection and channel
let connection = null;
let channel = null; // Change from const to let for reassignment
const EXCHANGE_NAME = 'facebook_events';

async function connectRabbitMQ() {
  try {
    // Create a connection to RabbitMQ
    connection = await amqp.connect(process.env.RABBIT_MQ_URL);

    // Create a channel
    channel = await connection.createChannel();

    // Assert an exchange
    await channel.assertExchange(EXCHANGE_NAME, 'topic', {
      durable: false,
    });

    logger.info('Connected to RabbitMQ');
  } catch (error) {
    logger.error('Error Connecting to RabbitMQ', error);
  }
}

async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectRabbitMQ();
  }

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`Event Published: ${routingKey}`);
}

async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectRabbitMQ();
  }

  const q = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });
  logger.info(`Subscribed to Event: ${routingKey} `);
}

module.exports = { connectRabbitMQ, publishEvent };
