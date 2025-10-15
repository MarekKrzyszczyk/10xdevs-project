import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForgotPasswordFormProps {
	onSubmit?: (email: string) => Promise<void>;
}

interface FormErrors {
	email?: string;
	general?: string;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
	const [email, setEmail] = useState('');
	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

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

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();

		// Clear previous errors
		setErrors({});
		setIsSuccess(false);

		// Validate email
		const emailError = validateEmail(email);

		if (emailError) {
			setErrors({ email: emailError });
			return;
		}

		setIsLoading(true);

		try {
			// Call custom onSubmit if provided, otherwise use default API call
			if (onSubmit) {
				await onSubmit(email);
				setIsSuccess(true);
				setEmail('');
			} else {
				// Default behavior: call API endpoint
				const response = await fetch('/api/auth/forgot-password', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email }),
				});

				const data = await response.json();

				if (!response.ok) {
					setErrors({
						general: data.error || 'An error occurred. Please try again.',
					});
					return;
				}

				setIsSuccess(true);
				setEmail('');
			}
		} catch (error) {
			setErrors({
				general: error instanceof Error ? error.message : 'An error occurred. Please try again.',
			});
		} finally {
			setIsLoading(false);
		}
	}, [email, onSubmit]);

	return (
		<div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8 flex items-center justify-center">
			<div className="relative max-w-md w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-8 border border-white/10">
				<div className="space-y-6">
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text drop-shadow-lg">
							Reset password
						</h1>
						<p className="text-blue-100/90 drop-shadow-md">
							Enter your email address and we'll send you a link to reset your password
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{errors.general && (
							<div className="p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100 text-sm backdrop-blur-sm">
								{errors.general}
							</div>
						)}

						{isSuccess && (
							<div className="p-3 bg-green-500/20 border border-green-400/50 rounded-lg text-green-100 text-sm backdrop-blur-sm">
								Password reset link has been sent to your email. Please check your inbox.
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

						<Button
							type="submit"
							className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
							size="lg"
							disabled={isLoading}
						>
							{isLoading ? 'Sending...' : 'Send reset link'}
						</Button>

						<p className="text-sm text-center text-blue-100/90">
							Remember your password?{' '}
							<a href="/login" className="text-blue-200 hover:text-blue-100 hover:underline font-medium transition-colors">
								Back to login
							</a>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
