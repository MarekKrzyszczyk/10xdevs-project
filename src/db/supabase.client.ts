import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

import type { Database } from './database.type.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '###' || supabaseAnonKey === '###') {
	throw new Error(
		'Supabase environment variables are not configured. Please set SUPABASE_URL and SUPABASE_KEY in your .env file.'
	);
}

/**
 * Default user ID for development/testing
 * Used when authentication is disabled
 */
export const DEFAULT_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// For local development, use service role to bypass RLS
// This allows us to work with DEFAULT_USER_ID without complex auth setup
const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
const serviceRoleKey = isLocal ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' : supabaseAnonKey;

export const supabaseClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

/**
 * Cookie options for Supabase SSR
 */
export const cookieOptions: CookieOptionsWithName = {
	path: '/',
	secure: true,
	httpOnly: true,
	sameSite: 'lax',
};

/**
 * Parse cookie header into array of name-value pairs
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
	return cookieHeader.split(';').map((cookie) => {
		const [name, ...rest] = cookie.trim().split('=');
		return { name, value: rest.join('=') };
	});
}

/**
 * Create Supabase server client with SSR support for authentication
 * Use this in middleware and API routes that need authentication
 */
export const createSupabaseServerInstance = (context: {
	headers: Headers;
	cookies: AstroCookies;
}) => {
	const supabase = createServerClient<Database>(
		supabaseUrl,
		supabaseAnonKey,
		{
			cookieOptions,
			cookies: {
				getAll() {
					return parseCookieHeader(context.headers.get('Cookie') ?? '');
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) =>
						context.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	return supabase;
};
