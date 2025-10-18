import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Login page
 * Provides methods and locators for interacting with the login form
 */
export class LoginPage {
	readonly page: Page;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly submitButton: Locator;
	readonly loginForm: Locator;
	readonly generalError: Locator;

	constructor(page: Page) {
		this.page = page;
		this.emailInput = page.locator('#email');
		this.passwordInput = page.locator('#password');
		this.submitButton = page.getByTestId('login-submit-button');
		this.loginForm = page.getByTestId('login-form');
		this.generalError = page.getByTestId('login-error-general');
	}

	/**
	 * Navigate to the login page
	 */
	async goto() {
		await this.page.goto('/login', { waitUntil: 'networkidle' });
		// Wait for React to hydrate the form
		await this.loginForm.waitFor({ state: 'visible' });
		await this.page.waitForTimeout(500);
	}

	/**
	 * Fill in email field
	 */
	async fillEmail(email: string) {
		await this.emailInput.waitFor({ state: 'visible' });
		await this.emailInput.click();
		await this.emailInput.fill(email);
	}

	/**
	 * Fill in password field
	 */
	async fillPassword(password: string) {
		await this.passwordInput.waitFor({ state: 'visible' });
		await this.passwordInput.click();
		await this.passwordInput.fill(password);
	}

	/**
	 * Click the submit button
	 */
	async submit() {
		await this.submitButton.waitFor({ state: 'visible' });
		await this.submitButton.waitFor({ state: 'attached' });

		// Use Promise.race to handle both success and error cases
		await this.submitButton.click();

		// Wait for either navigation or error message
		await Promise.race([
			this.page.waitForURL(/\/(generate|flashcards)/, { timeout: 5000 }).catch(() => {}),
			this.generalError.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
			this.page.waitForTimeout(5000)
		]);
	}

	/**
	 * Perform login with email and password
	 */
	async login(email: string, password: string) {
		await this.fillEmail(email);
		await this.fillPassword(password);
		await this.submit();
	}

	/**
	 * Check if general error message is visible
	 */
	async isGeneralErrorVisible() {
		return await this.generalError.isVisible();
	}

	/**
	 * Get general error message text
	 */
	async getGeneralErrorText() {
		return await this.generalError.textContent();
	}

	/**
	 * Wait for navigation after successful login
	 */
	async waitForNavigation() {
		await this.page.waitForURL(/\/(generate|flashcards)/);
	}
}
