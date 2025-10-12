import type {APIRoute} from 'astro';
import {z} from 'zod';
import type {GenerateFlashcardsCommand, GenerateFlashcardsResponseDTO} from '@/types';
import {AiGenerationService} from '@/lib/services/ai-generation.service';
import {DEFAULT_USER_ID} from '@/db/supabase.client';

// Disable prerendering for this API route (SSR only)
export const prerender = false;

/**
 * Zod validation schema for flashcard generation request
 */
const GenerateFlashcardsSchema = z.object({
    text: z
        .string()
        .min(1000, 'Text must be at least 1000 characters')
        .max(10000, 'Text must not exceed 10000 characters')
        .trim()
        .refine((val) => val.length > 0, 'Text cannot be empty'),
    model: z.string().optional(),
});

/**
 * POST /api/ai/generate
 * Generate flashcard suggestions from user-provided text using AI
 */
export const POST: APIRoute = async ({request}) => {
    const userId = DEFAULT_USER_ID;

    try {
        // 1. Parse and validate request body
        let body: unknown;
        try {
            body = await request.json();
        } catch (parseError) {
            return new Response(
                JSON.stringify({
                    error: 'Validation failed',
                    message: 'Invalid JSON in request body',
                }),
                {status: 400, headers: {'Content-Type': 'application/json'}}
            );
        }

        // 2. Validate input with Zod schema
        const validation = GenerateFlashcardsSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));

            return new Response(
                JSON.stringify({
                    error: 'Validation failed',
                    details: errors,
                }),
                {status: 400, headers: {'Content-Type': 'application/json'}}
            );
        }

        const command: GenerateFlashcardsCommand = validation.data;

        // 3. Call AI Generation Service
        const aiService = new AiGenerationService();
        const result: GenerateFlashcardsResponseDTO = await aiService.generateFlashcards(
            command.text,
            command.model,
            userId
        );

        // 4. Return success response
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        });
    } catch (error) {
        // Check for specific error types from service
        if (error instanceof Error) {
            // Handle timeout errors
            if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
                return new Response(
                    JSON.stringify({
                        error: 'Gateway timeout',
                        message: 'AI service timeout. Please try again.',
                    }),
                    {status: 502, headers: {'Content-Type': 'application/json'}}
                );
            }

            // Handle LLM API errors
            if (error.name === 'GatewayError') {
                return new Response(
                    JSON.stringify({
                        error: 'Bad Gateway',
                        message: 'AI generation service returned an error. Please try again.',
                    }),
                    {status: 502, headers: {'Content-Type': 'application/json'}}
                );
            }

            // Handle service unavailable
            if (error.name === 'ServiceUnavailableError') {
                return new Response(
                    JSON.stringify({
                        error: 'Service unavailable',
                        message: 'AI generation service temporarily unavailable',
                        retry_after: 60,
                    }),
                    {status: 503, headers: {'Content-Type': 'application/json'}}
                );
            }

            // Handle no suggestions error
            if (error.name === 'NoSuggestionsError') {
                return new Response(
                    JSON.stringify({
                        error: 'No suggestions generated',
                        message: 'Could not generate valid flashcards from the provided text. Please try different text.',
                    }),
                    {status: 500, headers: {'Content-Type': 'application/json'}}
                );
            }
        }

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: 'An unexpected error occurred during flashcard generation',
            }),
            {status: 500, headers: {'Content-Type': 'application/json'}}
        );
    }
};
