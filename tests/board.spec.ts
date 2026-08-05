import { test, expect } from '../src/fixtures/test';
import type { BoardTestCase } from '../src/types';
import testCases from '../src/data/testCases.json';

/**
 * Data-driven board verification.
 *
 * All six acceptance-criteria scenarios differ only in their data, so a single
 * parameterised body is generated once per entry in `testCases.json`. Adding a
 * seventh scenario means adding a JSON object — no new test code.
 */

const scenarios = testCases as BoardTestCase[];

test.describe('Project board', () => {
  for (const scenario of scenarios) {
    const { id, project, column, task, tags } = scenario;

    test(`${id} – "${task}" is in "${column}" of "${project}" with tags [${tags.join(', ')}]`, async ({
      loginPage,
      board,
    }) => {
      await test.step('Login to Demo App', async () => {
        await loginPage.goto();
        await loginPage.login();
        await board.waitForLoaded();
      });

      await test.step(`Navigate to "${project}"`, async () => {
        await board.openProject(project);
      });

      await test.step(`Verify "${task}" is in the "${column}" column`, async () => {
        await expect(board.taskCard(column, task)).toBeVisible();
      });

      await test.step(`Confirm tags: ${tags.join(', ')}`, async () => {
        await board.expectTags(column, task, tags);
      });
    });
  }
});
