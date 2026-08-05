import { expect, type Locator, type Page } from '@playwright/test';
import { APP_URL, CREDENTIALS } from '../config/environment';

/**
 * The demo app's sign-in screen.
 *
 * Note: the brief labels the first credential "Email", but the application
 * renders a field labelled "Username" and compares the value literally against
 * "admin". Locating by the visible label keeps the test honest about what the
 * UI actually presents.
 */
export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Project Board Login' });
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByText('Invalid username or password');
  }

  async goto(): Promise<void> {
    await this.page.goto(APP_URL);
    await expect(this.heading).toBeVisible();
  }

  async login(
    username: string = CREDENTIALS.username,
    password: string = CREDENTIALS.password,
  ): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
