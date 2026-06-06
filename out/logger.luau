-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Minimal structured logger for roblox-css.
	 *
	 * Provides a `createLogger(source)` function that returns a logger object
	 * with `debug`, `info`, `warn`, `error`, and `fatal` methods.
	 *
	 * Each method accepts: (code: string, message: string, data?: object)
	 
]]
local LogLevel
do
	local _inverse = {}
	LogLevel = setmetatable({}, {
		__index = _inverse,
	})
	LogLevel.DEBUG = 0
	_inverse[0] = "DEBUG"
	LogLevel.INFO = 1
	_inverse[1] = "INFO"
	LogLevel.WARN = 2
	_inverse[2] = "WARN"
	LogLevel.ERROR = 3
	_inverse[3] = "ERROR"
	LogLevel.FATAL = 4
	_inverse[4] = "FATAL"
end
local currentLogLevel = LogLevel.WARN
local function setLogLevel(level)
	currentLogLevel = level
end
local function formatLogLine(level, source, code, message, data)
	local line = `[{level}][{source}] {code}: {message}`
	if data then
		for k, v in pairs(data) do
			line ..= ` {k}={tostring(v)}`
		end
	end
	return line
end
local function createLogger(source)
	return {
		debug = function(self, code, message, data)
			if currentLogLevel <= LogLevel.DEBUG then
				print(formatLogLine("DEBUG", source, code, message, data))
			end
		end,
		info = function(self, code, message, data)
			if currentLogLevel <= LogLevel.INFO then
				print(formatLogLine("INFO", source, code, message, data))
			end
		end,
		warn = function(self, code, message, data)
			if currentLogLevel <= LogLevel.WARN then
				warn(formatLogLine("WARN", source, code, message, data))
			end
		end,
		error = function(self, code, message, data)
			if currentLogLevel <= LogLevel.ERROR then
				warn(formatLogLine("ERROR", source, code, message, data))
			end
		end,
		fatal = function(self, code, message, data)
			warn(formatLogLine("FATAL", source, code, message, data))
		end,
	}
end
return {
	setLogLevel = setLogLevel,
	createLogger = createLogger,
	LogLevel = LogLevel,
}
