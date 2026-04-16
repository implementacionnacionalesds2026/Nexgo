const logger = require('../utils/logger');

/**
 * Configura los eventos de Socket.io para tracking en tiempo real
 * @param {import('socket.io').Server} io
 */
const configureSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket conectado: ${socket.id}`);

    // El cliente se une a una sala según su rol
    socket.on('join:role', (data) => {
      const { role, userId } = data;
      if (role === 'ADMIN') {
        socket.join('admins');
        logger.debug(`Admin ${userId} unido a sala 'admins'`);
      }
      if (role === 'CLIENTE') {
        socket.join(`client:${userId}`);
      }
      if (role === 'REPARTIDOR') {
        socket.join(`driver:${userId}`);
      }
    });

    // Suscribirse a un envío específico
    socket.on('subscribe:shipment', (shipmentId) => {
      socket.join(`shipment:${shipmentId}`);
      logger.debug(`Socket ${socket.id} suscrito a envío ${shipmentId}`);
    });

    // Desuscribirse de un envío
    socket.on('unsubscribe:shipment', (shipmentId) => {
      socket.leave(`shipment:${shipmentId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket desconectado: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.io configurado');
};

module.exports = { configureSocket };
