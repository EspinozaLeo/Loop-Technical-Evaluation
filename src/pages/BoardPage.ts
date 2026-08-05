import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The Kanban project board shown after a successful login.
 *
 * The application ships no `data-testid` attributes, so locators are built from
 * ARIA roles and document structure rather than styling classes — role and
 * heading text survive a restyle, Tailwind class names do not.
 */
export class BoardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly board: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.getByRole('navigation');
    this.header = page.getByRole('banner');
    this.board = page.getByRole('main');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
  }

  /** Resolves once the board has rendered — i.e. login actually succeeded. */
  async waitForLoaded(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
    await expect(this.board).toBeVisible();
  }

  /**
   * Opens a project from the sidebar and waits for the header to reflect it.
   *
   * The sidebar button's accessible name is the project name plus its
   * description ("Web Application Main web application development"), so this
   * matches on the name as a substring and then asserts the exact header title.
   */
  async openProject(projectName: string): Promise<void> {
    await this.sidebar.getByRole('button', { name: projectName }).click();
    await expect(
      this.header.getByRole('heading', { level: 1, name: projectName, exact: true }),
    ).toBeVisible();
  }

  /**
   * A board column, located via its `<h2>` heading.
   *
   * The heading text carries a task count — "To Do (2)", not "To Do" — so an
   * exact string match finds nothing. The obvious alternative, a substring
   * match, is too loose in the other direction: it would also select a column
   * named "To Do Later" or "To Dos", quietly making the locator ambiguous.
   *
   * So the name is matched by an anchored pattern instead: the column name in
   * full, with the count tolerated but optional, and nothing after it. A
   * renamed column then fails loudly rather than matching by accident.
   *
   * The heading's parent element is the column container holding the cards.
   */
  column(columnName: string): Locator {
    const headingName = new RegExp(`^${escapeRegExp(columnName)}\\s*(\\(\\d+\\))?$`);

    return this.board
      .getByRole('heading', { level: 2, name: headingName })
      .locator('xpath=..');
  }

  /**
   * A task card, scoped to a single column.
   *
   * Scoping to the column is what proves the task is in the *right* column: an
   * identically titled card in a different column will not satisfy this locator.
   */
  taskCard(columnName: string, taskTitle: string): Locator {
    return this.column(columnName)
      .getByRole('heading', { level: 3, name: taskTitle, exact: true })
      .locator('xpath=..');
  }

  /**
   * The tag pills on a card.
   *
   * Tags render as unlabelled `<span>` elements in the first `<div>` of the
   * card, ahead of the assignee/due-date row. Anchoring to that first `<div>`
   * keeps assignee names and dates — also plain spans — out of the result.
   */
  tagPills(columnName: string, taskTitle: string): Locator {
    return this.taskCard(columnName, taskTitle).locator('xpath=./div[1]/span');
  }

  /**
   * Asserts the card carries exactly the expected tags — no more, no fewer.
   *
   * The count assertion catches unexpected extra tags; the per-tag assertion
   * catches missing ones. Matching each tag individually keeps the check
   * independent of the order the pills happen to render in.
   */
  async expectTags(
    columnName: string,
    taskTitle: string,
    expectedTags: string[],
  ): Promise<void> {
    const pills = this.tagPills(columnName, taskTitle);

    await expect(pills).toHaveCount(expectedTags.length);

    for (const tag of expectedTags) {
      await expect(
        pills.filter({ hasText: exactText(tag) }),
        `expected exactly one "${tag}" tag on "${taskTitle}"`,
      ).toHaveCount(1);
    }
  }
}

/** Escapes regex metacharacters so a plain string can be embedded in a pattern. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Builds an anchored regex so `hasText` matches a whole pill, not a substring. */
function exactText(value: string): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`);
}
