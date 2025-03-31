const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json() // Converts logs to JSON format for easy parsing
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: "logs/exceptions.log" }),
  ],
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

module.exports = logger;
