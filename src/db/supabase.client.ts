import {createClient} from '@supabase/supabase-js';

import type {Database} from './database.type.ts';

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
