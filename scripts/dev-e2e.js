import { config } from 'dotenv';
import { spawn } from 'child_process';

// Load .env.test
config({ path: '.env.test' });

// Start Astro dev server with the loaded environment
const astro = spawn('npm', ['run', 'dev'], {
	stdio: 'inherit',
	shell: true,
	env: { ...process.env }
});

astro.on('close', (code) => {
	process.exit(code);
});
