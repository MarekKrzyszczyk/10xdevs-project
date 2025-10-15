import { defineMiddleware } from 'astro:middleware';

import { supabaseClient, createSupabaseServerInstance } from '../db/supabase.client.ts';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
	// Public pages
	'/',
	'/login',
	'/register',
	'/forgot-password',
	// Auth API endpoints
	'/api/auth/login',
	'/api/auth/register',
	'/api/auth/logout',
	'/api/auth/forgot-password',
];

// Protected paths that require authentication
const PROTECTED_PATHS = [
	'/generate',
	'/flashcards',
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
	// Keep backward compatibility with existing supabase client
	locals.supabase = supabaseClient;

	// Skip auth check for public paths
	if (PUBLIC_PATHS.includes(url.pathname)) {
		locals.user = null;
		return next();
	}

	// Create SSR Supabase client for authentication
	const supabaseAuth = createSupabaseServerInstance({
		cookies,
		headers: request.headers,
	});

	// Get user session
	const {
		data: { user },
	} = await supabaseAuth.auth.getUser();

	if (user) {
		locals.user = {
			email: user.email,
			id: user.id,
		};
	} else {
		locals.user = null;
	}

	// Redirect to login for protected routes if not authenticated
	if (PROTECTED_PATHS.includes(url.pathname) && !user) {
		return redirect('/login');
	}

	return next();
});
