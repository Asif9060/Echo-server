class SimpleLogger {
   log(level, message, ...args) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      if (level === "error") {
         console.error(logMessage, ...args);
      } else if (level === "warn") {
         console.warn(logMessage, ...args);
      } else {
         console.log(logMessage, ...args);
      }
   }

   info(message, ...args) {
      this.log("info", message, ...args);
   }

   error(message, ...args) {
      this.log("error", message, ...args);
   }

   warn(message, ...args) {
      this.log("warn", message, ...args);
   }

   debug(message, ...args) {
      if (process.env.NODE_ENV === "development") {
         this.log("debug", message, ...args);
      }
   }
}

export const logger = new SimpleLogger();
