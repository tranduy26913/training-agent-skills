import winston from 'winston';
import path from 'path';
import { appConfig } from '@config';

const logsDir = path.join(__dirname, '../../logs');
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

if (appConfig.env === 'production') {
  transports.push(new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    level: 'info',
  }));
}

export const logger = winston.createLogger({
  level: appConfig.env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
});
