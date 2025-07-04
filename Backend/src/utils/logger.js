import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "logs");

const logFilePath = path.join(logDir, "server.log");
const errorLogPath = path.join(logDir, "error.log");
const securityLogPath = path.join(logDir, "security.log");

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const writeLog = (filePath, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    console.log(logMessage);

    fs.appendFile(filePath, logMessage, (err) => {
        if (err) console.error(`Error writing log: ${err}`);
    });
};

export const logError = (error) => writeLog(errorLogPath, `ERROR: ${error.stack || error}`);
export const log = (message) => writeLog(logFilePath, `INFO: ${message}`);
export const logSecurity = (message) => writeLog(securityLogPath, `SECURITY: ${message}`);
