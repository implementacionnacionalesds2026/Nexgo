require('dotenv').config();

const http    = require('http');
const { Server } = require('socket.io');
const app     = require('./app');
const { testConnection } = require('./src/config/database');
const { configureSocket } = require('./src/socket/tracking.socket');
const logger  = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.endsWith('.up.railway.app') || origin === 'http://localhost:4200' || origin === 'https://nexgo.vercel.app' || origin === 'https://nexgo.delivery') {
        callback(null, true);
      } else {
        callback(new Error('CORS blocked'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Guardar referencia de io en Express para usarla en controllers
app.set('io', io);

// Configurar eventos de Socket.io
configureSocket(io);

// Iniciar servidor
const startServer = async () => {
  // Verificar conexión DB
  const dbOk = await testConnection();
  if (!dbOk) {
    logger.error('❌ No se puede conectar a la base de datos. Revisa DATABASE_URL en .env');
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info('');
    logger.info('═══════════════════════════════════════════════');
    logger.info('  🚀 NEXGO API — Nacionales Delivery Services  ');
    logger.info('═══════════════════════════════════════════════');
    logger.info(`  Entorno  : ${process.env.NODE_ENV || 'development'}`);
    logger.info(`  Puerto   : ${PORT}`);
    logger.info(`  API      : http://localhost:${PORT}/api`);
    logger.info(`  Health   : http://localhost:${PORT}/health`);
    logger.info('═══════════════════════════════════════════════');
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado.');
    process.exit(0);
  });
});
