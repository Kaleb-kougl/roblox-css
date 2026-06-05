/**
 * Minimal structured logger for roblox-css.
 *
 * Provides a `createLogger(source)` function that returns a logger object
 * with `debug`, `info`, `warn`, `error`, and `fatal` methods.
 *
 * Each method accepts: (code: string, message: string, data?: object)
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4,
}

let currentLogLevel = LogLevel.WARN;

export function setLogLevel(level: LogLevel): void {
	currentLogLevel = level;
}

function formatLogLine(level: string, source: string, code: string, message: string, data?: object): string {
	let line = `[${level}][${source}] ${code}: ${message}`;
	if (data) {
		for (const [k, v] of pairs(data as unknown as Map<string, unknown>)) {
			line += ` ${k}=${tostring(v)}`;
		}
	}
	return line;
}

export function createLogger(source: string) {
	return {
		debug(code: string, message: string, data?: object) {
			if (currentLogLevel <= LogLevel.DEBUG) {
				print(formatLogLine("DEBUG", source, code, message, data));
			}
		},
		info(code: string, message: string, data?: object) {
			if (currentLogLevel <= LogLevel.INFO) {
				print(formatLogLine("INFO", source, code, message, data));
			}
		},
		warn(code: string, message: string, data?: object) {
			if (currentLogLevel <= LogLevel.WARN) {
				warn(formatLogLine("WARN", source, code, message, data));
			}
		},
		error(code: string, message: string, data?: object) {
			if (currentLogLevel <= LogLevel.ERROR) {
				warn(formatLogLine("ERROR", source, code, message, data));
			}
		},
		fatal(code: string, message: string, data?: object) {
			warn(formatLogLine("FATAL", source, code, message, data));
		},
	};
}
