import dotenv from 'dotenv';
import http from 'http';
import { createApp } from './src/app.js';
import { connectDB } from './src/config/db.js';
import { setupSocket } from './src/socket/index.js';

dotenv.config();

const app = createApp();
const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 5000;

await connectDB();

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});