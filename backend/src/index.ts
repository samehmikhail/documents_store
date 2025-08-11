import app from './app';
import { Config } from './config';
import { dataSeedService } from './modules/data-seed';

const PORT = Config.PORT;

async function startServer() {
  try {
    // Initialize pre-configured test data
    await dataSeedService.seedData();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔧 Environment: ${Config.NODE_ENV}`);
      console.log(`🌐 Supported locales: ${Config.SUPPORTED_LOCALES.join(', ')}`);
    });

    // Graceful shutdown handlers
    const shutdown = () => {
      console.log('🔴 Shutdown signal received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Process terminated');
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();