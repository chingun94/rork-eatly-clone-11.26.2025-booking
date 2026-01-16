type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any[];
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private listeners: Set<() => void> = new Set();
  private originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  constructor() {
    this.interceptConsole();
  }

  private interceptConsole() {
    console.log = (...args: any[]) => {
      this.addLog('log', args);
      this.originalConsole.log(...args);
    };

    console.info = (...args: any[]) => {
      this.addLog('info', args);
      this.originalConsole.info(...args);
    };

    console.warn = (...args: any[]) => {
      this.addLog('warn', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
      this.addLog('error', args);
      this.originalConsole.error(...args);
    };
  }

  private addLog(level: LogLevel, data: any[]) {
    const message = data.map(item => {
      if (typeof item === 'string') return item;
      if (item instanceof Error) return `${item.name}: ${item.message}`;
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    }).join(' ');

    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
      data,
    };

    this.logs.push(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.notifyListeners();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const logger = new Logger();
export type { LogEntry, LogLevel };
