import http from 'http';
import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { log, logError } from './utils/logger.js';
import { verifyS3Connection } from './config/s3.js';
import { checkUnreadMessages } from './utils/messageReminderJob.js';

dotenv.config();

const PORT_HTTP = 80;
const PORT_HTTPS = process.env.PORT || 443;
const MONGODB_URI = process.env.MONGODB_URI;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  key: fs.readFileSync(path.join(__dirname, '../server.key')),
  cert: fs.readFileSync(path.join(__dirname, '../server.cert'))
};

log('Connecting to MongoDB...');

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    log('MongoDB connected');
    await verifyS3Connection();
    setInterval(() => {
      checkUnreadMessages();
    }, 10 * 60 * 1000);
  })
  .catch((err) => {
    logError(`Failed to connect to MongoDB: ${err}`);
    process.exit(1);
  });

http.createServer((req, res) => {
  log(`HTTP request redirected to HTTPS: ${req.url}`);
  res.writeHead(301, { Location: 'https://' + req.headers.host + req.url });
  res.end();
}).listen(PORT_HTTP, () => {
  log(`HTTP (${PORT_HTTP}) redirecting to HTTPS (${PORT_HTTPS})`);
});

https.createServer(options, app).listen(PORT_HTTPS, () => {
  log(`Server is running on https://localhost:${PORT_HTTPS}`);
});

