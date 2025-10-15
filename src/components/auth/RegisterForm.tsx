import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterFormProps {
	onSubmit?: (email: string, password: string) => Promise<void>;
}

interface FormErrors {
	email?: string;
	password?: string;
	confirmPassword?: string;
	general?: string;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);

	const validateEmail = (email: string): string | undefined => {
		if (!email) {
			return 'Email is required';
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return 'Please enter a valid email address';
		}
		return undefined;
	};

	const validatePassword = (password: string): string | undefined => {
		if (!password) {
			return 'Password is required';
		}
		if (password.length < 8) {
			return 'Password must be at least 8 characters';
		}
		if (!/[A-Z]/.test(password)) {
			return 'Password must contain at least one uppercase letter';
		}
		if (!/[a-z]/.test(password)) {
			return 'Password must contain at least one lowercase letter';
		}
		if (!/[0-9]/.test(password)) {
			return 'Password must contain at least one number';
		}
		return undefined;
	};

	const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
		if (!confirmPassword) {
			return 'Please confirm your password';
		}
		if (password !== confirmPassword) {
			return 'Passwords do not match';
		}
		return undefined;
	};

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();

		// Clear previous errors
		setErrors({});

		// Validate fields
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);
		const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

		if (emailError || passwordError || confirmPasswordError) {
			setErrors({
				email: emailError,
				password: passwordError,
				confirmPassword: confirmPasswordError,
			});
			return;
		}

		setIsLoading(true);

		try {
			// Call custom onSubmit if provided, otherwise use default API call
			if (onSubmit) {
				await onSubmit(email, password);
			} else {
				// Default behavior: call API endpoint
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email, password }),
				});

				const data = await response.json();

				if (!response.ok) {
					setErrors({
						general: data.error || 'An error occurred during registration',
					});
					return;
				}

				// Redirect to /generate on successful registration
				window.location.href = '/generate';
			}
		} catch (error) {
			setErrors({
				general: error instanceof Error ? error.message : 'An error occurred during registration',
			});
		} finally {
			setIsLoading(false);
		}
	}, [email, password, confirmPassword, onSubmit]);

	return (
		<div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8 flex items-center justify-center">
			<div className="relative max-w-md w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-8 border border-white/10">
				<div className="space-y-6">
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text drop-shadow-lg">
							Create an account
						</h1>
						<p className="text-blue-100/90 drop-shadow-md">
							Enter your email and password to create your account
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{errors.general && (
							<div className="p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100 text-sm backdrop-blur-sm">
								{errors.general}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="email" className="text-blue-100 drop-shadow-md">
								Email
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="your@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isLoading}
								aria-invalid={!!errors.email}
								aria-describedby={errors.email ? 'email-error' : undefined}
								className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
							/>
							{errors.email && (
								<p id="email-error" className="text-sm text-red-300">
									{errors.email}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-blue-100 drop-shadow-md">
								Password
							</Label>
							<Input
								id="password"
								type="password"
								placeholder="Create a password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
								aria-invalid={!!errors.password}
								aria-describedby={errors.password ? 'password-error password-requirements' : 'password-requirements'}
								className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
							/>
							<p id="password-requirements" className="text-xs text-blue-200/80">
								Must be at least 8 characters with uppercase, lowercase, and number
							</p>
							{errors.password && (
								<p id="password-error" className="text-sm text-red-300">
									{errors.password}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword" className="text-blue-100 drop-shadow-md">
								Confirm Password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								placeholder="Confirm your password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								disabled={isLoading}
								aria-invalid={!!errors.confirmPassword}
								aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
								className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/40"
							/>
							{errors.confirmPassword && (
								<p id="confirm-password-error" className="text-sm text-red-300">
									{errors.confirmPassword}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
							size="lg"
							disabled={isLoading}
						>
							{isLoading ? 'Creating account...' : 'Create account'}
						</Button>

						<p className="text-sm text-center text-blue-100/90">
							Already have an account?{' '}
							<a href="/login" className="text-blue-200 hover:text-blue-100 hover:underline font-medium transition-colors">
								Login
							</a>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
