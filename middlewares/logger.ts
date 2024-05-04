
import winston from 'winston';  // logger trackers

const options = {    //array of object to store the logs in app.log file after every activity taking place in the servers
  file: {
    level: 'info',
    filename: './logs/app.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {  // console what is going on it the logger
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};


// create the logger for dumping the logs
const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false
})

export default logger;  