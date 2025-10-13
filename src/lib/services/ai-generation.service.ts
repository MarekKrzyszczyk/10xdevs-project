import type {GenerateFlashcardsResponseDTO, FlashcardSuggestionDTO} from '@/types';
import {createLogger} from '@/lib/utils/logger';
import {getChatCompletion, type ResponseFormat} from '@/lib/openrouter/openrouter.service';

/**
 * Custom error types for AI generation service
 */
export class TimeoutError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TimeoutError';
	}
}

export class GatewayError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'GatewayError';
	}
}

export class ServiceUnavailableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ServiceUnavailableError';
	}
}

export class NoSuggestionsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NoSuggestionsError';
	}
}

/**
 * AI Generation Service
 * Handles communication with OpenRouter.ai API for flashcard generation
 */
export class AiGenerationService {
	private readonly defaultModel = 'openai/gpt-4o-mini';
	private readonly timeout = 30000; // 30 seconds
	private readonly logger = createLogger('AiGenerationService');

	/**
	 * Generate flashcard suggestions from text using AI
	 * @param text - User-provided text (1000-10000 characters)
	 * @param model - Optional model selection
	 * @param userId - Authenticated user ID for logging
	 * @returns Flashcard suggestions with metadata
	 */
	async generateFlashcards(
		text: string,
		model: string | undefined,
		userId: string
	): Promise<GenerateFlashcardsResponseDTO & {model_used: string; tokens_used: number}> {
		const selectedModel = model || this.defaultModel;

		this.logger.info('Generating flashcards with OpenRouter', {
			userId,
			model: selectedModel,
			textLength: text.length,
		});

		// Create abort controller for timeout
		const abortController = new AbortController();
		const timeoutId = setTimeout(() => abortController.abort(), this.timeout);

		try {
			// Get API key from environment
			const apiKey = import.meta.env.OPENROUTER_API_KEY;

			if (!apiKey) {
				this.logger.error('OPENROUTER_API_KEY not found in environment', {userId, model: selectedModel});
				throw new GatewayError('AI service configuration error: OPENROUTER_API_KEY not configured');
			}

			// Call OpenRouter API with JSON schema response format
			type FlashcardsResponse = { flashcards: FlashcardSuggestionDTO[] };

			const result = await getChatCompletion<FlashcardsResponse>({
				userMessage: this.buildUserMessage(text),
				systemMessage: this.buildSystemPrompt(),
				model: selectedModel,
				responseFormat: this.getFlashcardResponseFormat(),
				parameters: {
					temperature: 0.7,
					max_tokens: 4000,
				},
				signal: abortController.signal,
				apiKey: apiKey,
			});

			clearTimeout(timeoutId);

			// Handle API errors
			if (!result.success || !result.data) {
				this.logger.error('OpenRouter API error', {
					userId,
					model: selectedModel,
					error: result.error,
				});

				// Check for specific error patterns
				if (result.error?.includes('timeout') || result.error?.includes('aborted')) {
					throw new TimeoutError('Request to AI service timed out');
				}
				if (result.error?.includes('status 503')) {
					throw new ServiceUnavailableError('AI service is temporarily unavailable');
				}
				if (result.error?.includes('OPENROUTER_API_KEY')) {
					throw new GatewayError('AI service configuration error');
				}

				throw new GatewayError(result.error || 'Failed to generate flashcards');
			}

			// Extract and validate flashcards from response
			const flashcards = result.data.flashcards || [];
			const validSuggestions = this.validateSuggestions(flashcards);

			if (validSuggestions.length === 0) {
				this.logger.warn('No valid suggestions generated', {
					userId,
					textLength: text.length,
					model: selectedModel,
					rawCount: flashcards.length,
				});
				throw new NoSuggestionsError('Could not generate valid flashcards from text');
			}

			// Estimate token usage (4 chars per token is a rough approximation)
			// In production, you might want to use the OpenRouter usage stats if available
			const estimatedTokens = Math.floor((text.length + JSON.stringify(result.data).length) / 4);

			// Log success
			this.logger.info('Successfully generated flashcards', {
				userId,
				model: selectedModel,
				suggestionsCount: validSuggestions.length,
				tokensUsed: estimatedTokens,
			});

			return {
				suggestions: validSuggestions,
				model_used: selectedModel,
				tokens_used: estimatedTokens,
			};
		} catch (error) {
			clearTimeout(timeoutId);

			// Re-throw known error types
			if (
				error instanceof TimeoutError ||
				error instanceof GatewayError ||
				error instanceof ServiceUnavailableError ||
				error instanceof NoSuggestionsError
			) {
				throw error;
			}

			// Handle abort errors
			if (error instanceof Error && error.name === 'AbortError') {
				this.logger.error('Request aborted', {userId, model: selectedModel}, error);
				throw new TimeoutError('Request to AI service was aborted');
			}

			// Log and wrap unexpected errors
			this.logger.error(
				'Unexpected error during flashcard generation',
				{userId, model: selectedModel},
				error instanceof Error ? error : new Error(String(error))
			);

			throw new GatewayError('An unexpected error occurred while generating flashcards');
		}
	}

	/**
	 * Get JSON schema response format for flashcard generation
	 */
	private getFlashcardResponseFormat(): ResponseFormat {
		return {
			type: 'json_schema',
			json_schema: {
				name: 'flashcard_generation',
				strict: true,
				schema: {
					type: 'object',
					properties: {
						flashcards: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									front: {
										type: 'string',
										description: 'The question or prompt for the flashcard (1-1000 characters)'
									},
									back: {
										type: 'string',
										description: 'The answer or explanation for the flashcard (1-1000 characters)'
									}
								},
								required: ['front', 'back'],
								additionalProperties: false
							},
							minItems: 5,
							maxItems: 15
						}
					},
					required: ['flashcards'],
					additionalProperties: false
				}
			}
		};
	}

	/**
	 * Build system prompt for LLM
	 */
	private buildSystemPrompt(): string {
		return `You are a flashcard generation assistant. Your task is to generate educational flashcards from the provided text.

Instructions:
1. Analyze the text and identify key concepts, facts, definitions, and important information.
2. Create flashcards that help users learn and remember the material.
3. Generate 5-15 flashcards covering the most important points.
4. Each flashcard must have a "front" (question/prompt) and "back" (answer/explanation).
5. Keep each field between 1 and 1000 characters.
6. Make questions clear and specific.
7. Provide concise but complete answers.
8. Return your response as a JSON object with a "flashcards" array.

Output format (JSON):
{
  "flashcards": [
    {
      "front": "Question or prompt here",
      "back": "Answer or explanation here"
    }
  ]
}

Important: Return ONLY valid JSON. Do not include any additional text or explanations.`;
	}

	/**
	 * Build user message with text content
	 */
	private buildUserMessage(text: string): string {
		return `Generate flashcards from the following text:\n\n${text}`;
	}

	/**
	 * Validate and filter flashcard suggestions
	 */
	private validateSuggestions(suggestions: any[]): FlashcardSuggestionDTO[] {
		const validated: FlashcardSuggestionDTO[] = [];
		const seen = new Set<string>();

		for (const suggestion of suggestions) {
			// Validate structure
			if (!suggestion || typeof suggestion !== 'object') {
				continue;
			}

			const { front, back } = suggestion;

			// Validate front field
			if (typeof front !== 'string' || front.trim().length === 0 || front.length > 1000) {
				continue;
			}

			// Validate back field
			if (typeof back !== 'string' || back.trim().length === 0 || back.length > 1000) {
				continue;
			}

			const trimmedFront = front.trim();
			const trimmedBack = back.trim();

			// Check for duplicates (based on front text)
			const key = trimmedFront.toLowerCase();
			if (seen.has(key)) {
				continue;
			}

			seen.add(key);
			validated.push({
				front: trimmedFront,
				back: trimmedBack,
			});
		}

		return validated;
	}
}
