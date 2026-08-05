import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BoardPage } from '../pages/BoardPage';

interface Fixtures {
  loginPage: LoginPage;
  /**
   * The project board.
   *
   * Deliberately NOT pre-authenticated. Every acceptance-criteria scenario
   * begins with "Login to Demo App", so each test performs that login as its
   * own visible, reported step rather than having it happen invisibly in
   * fixture setup. The code still lives in one place — the loop in
   * `board.spec.ts` writes it once and runs it for all six scenarios.
   */
  board: BoardPage;
}

export const test = base.extend<Fixtures>({
  // Keep the third-party Bolt attribution badge out of every run: it is not
  // part of the application under test, and an external script that can change
  // without notice is a source of flake.
  page: async ({ page }, use) => {
    await page.route('**://bolt.new/**', (route) => route.abort());
    await use(page);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  board: async ({ page }, use) => {
    await use(new BoardPage(page));
  },
});

export { expect };
