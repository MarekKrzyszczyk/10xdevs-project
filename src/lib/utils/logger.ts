/**
 * Simple logger utility for structured logging
 */
export interface Logger {
	info(message: string, context?: Record<string, any>): void;
	warn(message: string, context?: Record<string, any>, error?: Error): void;
	error(message: string, context?: Record<string, any>, error?: Error): void;
}

class ConsoleLogger implements Logger {
	constructor(private readonly service: string) {}

	info(message: string, context?: Record<string, any>): void {
		console.log(
			JSON.stringify({
				timestamp: new Date().toISOString(),
				level: 'INFO',
				service: this.service,
				message,
				...context,
			})
		);
	}

	warn(message: string, context?: Record<string, any>, error?: Error): void {
		console.warn(
			JSON.stringify({
				timestamp: new Date().toISOString(),
				level: 'WARN',
				service: this.service,
				message,
				error: error?.message,
				...context,
			})
		);
	}

	error(message: string, context?: Record<string, any>, error?: Error): void {
		console.error(
			JSON.stringify({
				timestamp: new Date().toISOString(),
				level: 'ERROR',
				service: this.service,
				message,
				error: error?.message,
				stack: error?.stack,
				...context,
			})
		);
	}
}

export function createLogger(service: string): Logger {
	return new ConsoleLogger(service);
}
