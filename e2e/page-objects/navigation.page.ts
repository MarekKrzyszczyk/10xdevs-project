import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the main navigation
 * Available on authenticated pages
 */
export class NavigationPage {
	readonly page: Page;
	readonly mainNavigation: Locator;
	readonly generateLink: Locator;
	readonly flashcardsLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.mainNavigation = page.getByTestId('main-navigation');
		this.generateLink = page.getByTestId('nav-generate-link');
		this.flashcardsLink = page.getByTestId('nav-flashcards-link');
	}

	/**
	 * Check if the main navigation is visible
	 */
	async isNavigationVisible() {
		return await this.mainNavigation.isVisible();
	}

	/**
	 * Check if Generate link is visible
	 */
	async isGenerateLinkVisible() {
		return await this.generateLink.isVisible();
	}

	/**
	 * Check if Flashcards link is visible
	 */
	async isFlashcardsLinkVisible() {
		return await this.flashcardsLink.isVisible();
	}

	/**
	 * Click on the Generate link
	 */
	async clickGenerateLink() {
		await this.generateLink.click();
	}

	/**
	 * Click on the Flashcards link
	 */
	async clickFlashcardsLink() {
		await this.flashcardsLink.click();
	}

	/**
	 * Get Generate link text
	 */
	async getGenerateLinkText() {
		return await this.generateLink.textContent();
	}

	/**
	 * Get Flashcards link text
	 */
	async getFlashcardsLinkText() {
		return await this.flashcardsLink.textContent();
	}
}
