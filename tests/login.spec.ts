import { test, expect } from '../src/fixtures/test';
import { CREDENTIALS } from '../src/config/environment';

/**
 * Login automation.
 *
 * The board suite drives the happy path as step 1 of every scenario; these
 * cover the login screen's own behaviour, including the negative path that the
 * board tests never reach.
 */
test.describe('Login', () => {
  test('signs in with valid credentials and lands on the board', async ({
    loginPage,
    board,
  }) => {
    await loginPage.goto();
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);

    await board.waitForLoaded();
    await expect(board.logoutButton).toBeVisible();
    await expect(loginPage.heading).toBeHidden();
  });

  test('rejects invalid credentials and stays on the login screen', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'wrong-password');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.heading).toBeVisible();
  });
});
