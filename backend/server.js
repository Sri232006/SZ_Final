const app = require('./src/app');
const sequelize = require('./src/config/database');
const config = require('./src/config/env');

const PORT = config.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Sync database (use migrations in production)
    /* if (config.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synced');
    } */

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
      });
    });

    // Catch unhandled promises
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();