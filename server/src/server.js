import dotenv from 'dotenv';
import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { setupSocket } from './socket/index.js';

dotenv.config();

const app = createApp();
const server = http.createServer(app);
setupSocket(server);

const port = process.env.PORT || 5000;

await connectDB();
server.listen(port, () => {
  console.log(`LoveChat server running on port ${port}`);
});