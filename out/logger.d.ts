/**
 * Minimal structured logger for roblox-css.
 *
 * Provides a `createLogger(source)` function that returns a logger object
 * with `debug`, `info`, `warn`, `error`, and `fatal` methods.
 *
 * Each method accepts: (code: string, message: string, data?: object)
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}
export declare function setLogLevel(level: LogLevel): void;
export declare function createLogger(source: string): {
    debug(code: string, message: string, data?: object): void;
    info(code: string, message: string, data?: object): void;
    warn(code: string, message: string, data?: object): void;
    error(code: string, message: string, data?: object): void;
    fatal(code: string, message: string, data?: object): void;
};
