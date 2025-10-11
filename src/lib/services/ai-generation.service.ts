import type {GenerateFlashcardsResponseDTO, FlashcardSuggestionDTO} from '@/types';
import {createLogger} from '@/lib/utils/logger';

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
 * OpenRouter API response types
 */
interface OpenRouterMessage {
	role: string;
	content: string;
}

interface OpenRouterChoice {
	message: OpenRouterMessage;
	finish_reason: string;
}

interface OpenRouterUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

interface OpenRouterResponse {
	id: string;
	model: string;
	choices: OpenRouterChoice[];
	usage: OpenRouterUsage;
}

/**
 * AI Generation Service
 * Handles communication with OpenRouter.ai API for flashcard generation
 */
export class AiGenerationService {
	private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
	private readonly defaultModel = 'anthropic/claude-3-haiku';
	private readonly timeout = 30000; // 30 seconds
	private readonly logger = createLogger('AiGenerationService');

	/**
	 * Generate flashcard suggestions from text using AI (MOCK IMPLEMENTATION)
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

		this.logger.info('Generating flashcards (MOCK)', {
			userId,
			model: selectedModel,
			textLength: text.length,
		});

		// Simulate API delay (500-1500ms)
		const delay = Math.floor(Math.random() * 1000) + 500;
		await new Promise((resolve) => setTimeout(resolve, delay));

		// Mock response - generate flashcards based on text length
		const mockContent = this.generateMockResponse(text);

		// Parse and validate suggestions
		const suggestions = this.parseSuggestions(mockContent);
		const validSuggestions = this.validateSuggestions(suggestions);

		if (validSuggestions.length === 0) {
			this.logger.warn('No valid suggestions generated (MOCK)', {
				userId,
				textLength: text.length,
				model: selectedModel,
			});
			throw new NoSuggestionsError('Could not generate valid flashcards from text');
		}

		// Mock token usage (approximate based on text length)
		const mockTokens = Math.floor(text.length / 4) + Math.floor(Math.random() * 100);

		// Log success
		this.logger.info('Successfully generated flashcards (MOCK)', {
			userId,
			model: selectedModel,
			suggestionsCount: validSuggestions.length,
			tokensUsed: mockTokens,
		});

		return {
			suggestions: validSuggestions,
			model_used: selectedModel,
			tokens_used: mockTokens,
		};
	}

	/**
	 * Generate mock response for testing
	 * @param text - Input text
	 * @returns Mock JSON response string
	 */
	private generateMockResponse(text: string): string {
		// Generate 5-8 mock flashcards
		const count = Math.floor(Math.random() * 4) + 5;
		const flashcards = [];

		for (let i = 0; i < count; i++) {
			flashcards.push({
				front: `Question ${i + 1}: What is a key concept from the provided text?`,
				back: `Answer ${i + 1}: This is a mock answer generated from the text content. The text discusses important topics related to the subject matter.`,
			});
		}

		return JSON.stringify({ flashcards });
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
	 * Parse JSON response and extract suggestions
	 */
	private parseSuggestions(content: string): FlashcardSuggestionDTO[] {
		try {
			const parsed = JSON.parse(content);

			// Check if response has flashcards array
			if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
				this.logger.error('Invalid response structure', {parsed});
				return [];
			}

			return parsed.flashcards;
		} catch (error) {
			this.logger.error(
				'Failed to parse LLM response',
				{content},
				error instanceof Error ? error : new Error(String(error))
			);
			return [];
		}
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
