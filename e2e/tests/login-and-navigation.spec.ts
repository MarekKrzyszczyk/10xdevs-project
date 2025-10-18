import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { NavigationPage } from '../page-objects/navigation.page';

test.describe('Login and Navigation', () => {
	let loginPage: LoginPage;
	let navigationPage: NavigationPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		navigationPage = new NavigationPage(page);

		// Listen to console messages for debugging
		page.on('console', msg => console.log('Browser console:', msg.text()));
		page.on('pageerror', error => console.log('Page error:', error.message));
	});

	test('should login successfully and verify navigation menu visibility', async ({ page }) => {
		// Arrange
		const email = process.env.E2E_USERNAME || '';
		const password = process.env.E2E_PASSWORD || '';

		// Assert credentials are available
		expect(email).toBeTruthy();
		expect(password).toBeTruthy();

		// Act - Navigate to login page
		await loginPage.goto();

		// Assert - Verify we're on the login page
		await expect(page).toHaveURL('/login');

		// Wait for the form to be visible
		await expect(loginPage.loginForm).toBeVisible();
		await expect(loginPage.emailInput).toBeVisible();
		await expect(loginPage.passwordInput).toBeVisible();

		// Act - Fill in login form and submit (waits for navigation)
		await loginPage.login(email, password);

		// Debug: Log current URL
		console.log('Current URL after submit:', page.url());

		// Assert - Check if there's an error message
		const hasError = await loginPage.generalError.isVisible().catch(() => false);
		if (hasError) {
			const errorText = await loginPage.getGeneralErrorText();
			throw new Error(`Login failed with error: ${errorText}`);
		}

		// Debug: Take screenshot before assertion
		await page.screenshot({ path: 'test-results/after-login.png' });

		// Assert - Verify we're on the generate page
		const currentUrl = page.url();
		console.log('Checking URL:', currentUrl);
		await expect(page).toHaveURL('/generate', { timeout: 10000 });

		// Assert - Verify main navigation is visible
		await expect(navigationPage.mainNavigation).toBeVisible();

		// Assert - Verify Generate link is visible
		await expect(navigationPage.generateLink).toBeVisible();

		// Assert - Verify Flashcards link is visible
		await expect(navigationPage.flashcardsLink).toBeVisible();

		// Assert - Verify link text
		expect(await navigationPage.getGenerateLinkText()).toContain('Generate');
		expect(await navigationPage.getFlashcardsLinkText()).toContain('Flashcards');
	});

	test('should navigate between Generate and Flashcards pages', async ({ page }) => {
		// Arrange
		const email = process.env.E2E_USERNAME || '';
		const password = process.env.E2E_PASSWORD || '';

		// Act - Login
		await loginPage.goto();
		await loginPage.login(email, password);

		// Assert - We're on the generate page
		await expect(page).toHaveURL('/generate');

		// Act - Click on Flashcards link
		await navigationPage.clickFlashcardsLink();

		// Assert - We're on the flashcards page
		await expect(page).toHaveURL('/flashcards');

		// Assert - Navigation menu is still visible
		await expect(navigationPage.mainNavigation).toBeVisible();

		// Act - Click on Generate link
		await navigationPage.clickGenerateLink();

		// Assert - We're back on the generate page
		await expect(page).toHaveURL('/generate');

		// Assert - Navigation menu is still visible
		await expect(navigationPage.mainNavigation).toBeVisible();
	});
});
