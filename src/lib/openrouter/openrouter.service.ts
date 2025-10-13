const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_SYSTEM_MESSAGE = 'You are a helpful assistant.';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export type ModelParameters = {
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
};

export type JsonSchemaResponseFormat = {
	type: 'json_schema';
	json_schema: {
		name: string;
		schema: Record<string, unknown>;
		strict?: boolean;
	};
};

export type TextResponseFormat = {
	type: 'text';
};

export type ResponseFormat = JsonSchemaResponseFormat | TextResponseFormat;

export type ChatCompletionOptions = {
	userMessage: string;
	systemMessage?: string;
	model?: string;
	responseFormat?: ResponseFormat;
	parameters?: ModelParameters;
	signal?: AbortSignal;
	apiKey?: string;
};

export type ChatCompletionResponse<T> = {
	success: boolean;
	data: T | null;
	error: string | null;
};

class ConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigurationError';
	}
}

export async function getChatCompletion<T = string>(
	options: ChatCompletionOptions
): Promise<ChatCompletionResponse<T>> {
	try {
		validateOptions(options);
		const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;

		if (!apiKey) {
			throw new ConfigurationError('OPENROUTER_API_KEY is not configured.');
		}

		const requestBody = buildRequestBody(options);
		const response = await sendRequest(requestBody, apiKey, options.signal);

		if (!response.ok) {
			const errorPayload = await safeJson(response);
			return handleApiError(errorPayload, response.status);
		}

		const payload = await safeJson(response);
		return parseResponse<T>(payload, options.responseFormat);
	} catch (error) {
		return handleApiError<T>(error);
	}
}

function validateOptions(options: ChatCompletionOptions) {
	if (!options.userMessage || typeof options.userMessage !== 'string') {
		throw new Error('`userMessage` must be a non-empty string.');
	}
}

function buildRequestBody(options: ChatCompletionOptions) {
	const { userMessage, systemMessage, model, responseFormat, parameters } = options;

	const messages = [
		{ role: 'system', content: systemMessage ?? DEFAULT_SYSTEM_MESSAGE },
		{ role: 'user', content: userMessage }
	];

	const body: Record<string, unknown> = {
		model: model ?? DEFAULT_MODEL,
		messages
	};

	if (responseFormat) {
		body.response_format = mapResponseFormat(responseFormat);
	}

	if (parameters) {
		Object.assign(body, sanitizeParameters(parameters));
	}

	return body;
}

function mapResponseFormat(responseFormat: ResponseFormat) {
	if (responseFormat.type === 'json_schema') {
		return {
			type: 'json_schema',
			json_schema: {
				name: responseFormat.json_schema.name,
				strict: responseFormat.json_schema.strict ?? true,
				schema: responseFormat.json_schema.schema
			}
		};
	}

	return { type: 'text' };
}

function sanitizeParameters(parameters: ModelParameters) {
	const allowedKeys: (keyof ModelParameters)[] = [
		'temperature',
		'max_tokens',
		'top_p',
		'frequency_penalty',
		'presence_penalty'
	];

	return allowedKeys.reduce<Record<string, unknown>>((acc, key) => {
		const value = parameters[key];
		if (typeof value === 'number') {
			acc[key] = value;
		}
		return acc;
	}, {});
}

async function sendRequest(body: Record<string, unknown>, apiKey: string, signal?: AbortSignal) {
	const requestInit: RequestInit = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body),
		signal
	};

	return fetch(OPENROUTER_ENDPOINT, requestInit);
}

async function safeJson(response: Response) {
	try {
		return await response.json();
	} catch (error) {
		console.error('Failed to parse JSON response from OpenRouter:', error);
		return null;
	}
}


function parseResponse<T>(payload: any, responseFormat?: ResponseFormat): ChatCompletionResponse<T> {
	if (!payload) {
		return {
			success: false,
			data: null,
			error: 'Received an empty response from the AI service.'
		};
	}

	const content = payload?.choices?.[0]?.message?.content;

	if (!content) {
		return {
			success: false,
			data: null,
			error: 'No content received from the AI service.'
		};
	}

	if (responseFormat?.type === 'json_schema') {
		try {
			const parsed = JSON.parse(content) as T;
			return { success: true, data: parsed, error: null };
		} catch (error) {
			console.error('Failed to parse JSON content from OpenRouter:', error);
			return {
				success: false,
				data: null,
				error: 'The AI response was not valid JSON.'
			};
		}
	}

	return {
		success: true,
		data: content as unknown as T,
		error: null
	};
}

function handleApiError<T>(error: unknown, status?: number): ChatCompletionResponse<T> {
	if (error instanceof ConfigurationError) {
		return {
			success: false,
			data: null,
			error: error.message
		};
	}

	if (error instanceof Error) {
		console.error('OpenRouter API Error:', error);
		return {
			success: false,
			data: null,
			error: error.message
		};
	}

	if (typeof error === 'object' && error !== null) {
		console.error('OpenRouter API Error Response:', error);
		const message =
			(error as { error?: { message?: string }; message?: string }).error?.message ||
			(error as { message?: string }).message ||
			'An unexpected error occurred with the AI service.';

		return {
			success: false,
			data: null,
			error: status ? `${message} (status ${status})` : message
		};
	}

	console.error('OpenRouter API Unknown Error:', error);
	return {
		success: false,
		data: null,
		error: 'An unexpected error occurred with the AI service.'
	};
}
