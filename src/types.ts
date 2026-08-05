/**
 * Shape of a single scenario in `src/data/testCases.json`.
 *
 * Every test in the suite is generated from this contract, so adding coverage is
 * a data change rather than a code change.
 */
export interface BoardTestCase {
  /** Stable identifier used in the test title, e.g. "TC-01". */
  id: string;
  /** Project to open from the sidebar, e.g. "Web Application". */
  project: string;
  /** Board column the task is expected to live in, e.g. "To Do". */
  column: string;
  /** Exact task card title, e.g. "Implement user authentication". */
  task: string;
  /** Complete set of tag pills expected on the card. Order-independent. */
  tags: string[];
}
