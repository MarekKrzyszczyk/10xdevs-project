import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

const registerSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const body = await request.json();

		// Validate input
		const validationResult = registerSchema.safeParse(body);
		if (!validationResult.success) {
			return new Response(
				JSON.stringify({
					error: validationResult.error.errors[0].message
				}),
				{ status: 400 }
			);
		}

		const { email, password } = validationResult.data;

		// Create Supabase SSR client
		const supabase = createSupabaseServerInstance({
			cookies,
			headers: request.headers
		});

		// Sign up with email and password
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			// Handle specific Supabase errors
			if (error.message.includes('already registered')) {
				return new Response(
					JSON.stringify({
						error: 'Email already in use'
					}),
					{ status: 400 }
				);
			}

			return new Response(
				JSON.stringify({
					error: error.message
				}),
				{ status: 400 }
			);
		}

		return new Response(
			JSON.stringify({
				user: {
					id: data.user?.id,
					email: data.user?.email,
				}
			}),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Registration error:', error);
		return new Response(
			JSON.stringify({
				error: 'An error occurred during registration'
			}),
			{ status: 500 }
		);
	}
};
