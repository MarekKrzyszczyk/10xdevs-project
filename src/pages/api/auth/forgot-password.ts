import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

const forgotPasswordSchema = z.object({
	email: z.string().email('Invalid email address'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const body = await request.json();

		// Validate input
		const validationResult = forgotPasswordSchema.safeParse(body);
		if (!validationResult.success) {
			return new Response(
				JSON.stringify({
					error: validationResult.error.errors[0].message
				}),
				{ status: 400 }
			);
		}

		const { email } = validationResult.data;

		// Create Supabase SSR client
		const supabase = createSupabaseServerInstance({
			cookies,
			headers: request.headers
		});

		// Send password reset email
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${new URL(request.url).origin}/reset-password`,
		});

		if (error) {
			return new Response(
				JSON.stringify({
					error: error.message
				}),
				{ status: 400 }
			);
		}

		// Always return success to prevent email enumeration
		return new Response(
			JSON.stringify({
				message: 'Password reset email sent'
			}),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Forgot password error:', error);
		return new Response(
			JSON.stringify({
				error: 'An error occurred. Please try again.'
			}),
			{ status: 500 }
		);
	}
};
