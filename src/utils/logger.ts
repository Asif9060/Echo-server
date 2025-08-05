interface Logger {
   info: (message: string, ...args: any[]) => void;
   error: (message: string, ...args: any[]) => void;
   warn: (message: string, ...args: any[]) => void;
   debug: (message: string, ...args: any[]) => void;
}

class SimpleLogger implements Logger {
   private log(level: string, message: string, ...args: any[]): void {
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

   info(message: string, ...args: any[]): void {
      this.log("info", message, ...args);
   }

   error(message: string, ...args: any[]): void {
      this.log("error", message, ...args);
   }

   warn(message: string, ...args: any[]): void {
      this.log("warn", message, ...args);
   }

   debug(message: string, ...args: any[]): void {
      if (process.env.NODE_ENV === "development") {
         this.log("debug", message, ...args);
      }
   }
}

export const logger = new SimpleLogger();
