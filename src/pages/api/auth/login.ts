import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const body = await request.json();

		// Validate input
		const validationResult = loginSchema.safeParse(body);
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

		// Sign in with email and password
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return new Response(
				JSON.stringify({
					error: 'Invalid email or password'
				}),
				{ status: 401 }
			);
		}

		return new Response(
			JSON.stringify({
				user: {
					id: data.user.id,
					email: data.user.email,
				}
			}),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Login error:', error);
		return new Response(
			JSON.stringify({
				error: 'An error occurred during login'
			}),
			{ status: 500 }
		);
	}
};
