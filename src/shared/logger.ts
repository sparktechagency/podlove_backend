import path from "path";
import { createLogger, format, transports } from "winston";

const DailyRotateFile = require("winston-daily-rotate-file");

const { combine, timestamp, label, printf, colorize } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  const date = new Date(timestamp as string);
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  return `${date.toDateString()} ${h}:${m}:${s} [${label}] ${level}: ${message}`;
});

const logDir = path.join(process.cwd(), "logs", "winston");

export const logger = createLogger({
  level: "info",
  format: combine(label({ label: "Podlove" }), timestamp(), colorize(), myFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), myFormat),
    }),

    new transports.File({
      level: "info",
      filename: path.join(logDir, "successes", "um-success.log"),
    }),

    new DailyRotateFile({
      level: "info",
      filename: path.join(logDir, "successes", "um-%DATE%-success.log"),
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

export const errorLogger = createLogger({
  level: "error",
  format: combine(label({ label: "Podlove" }), timestamp(), colorize(), myFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), myFormat),
    }),

    new DailyRotateFile({
      level: "error",
      filename: path.join(logDir, "errors", "um-%DATE%-error.log"),
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});
