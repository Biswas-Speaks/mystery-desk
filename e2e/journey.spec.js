import { test, expect } from '@playwright/test';
import { fixture } from '../server/tests/fixture.js';
test('create, discover, hint, accuse, result and restart', async ({ page }) => {
  const generated = fixture('medium'),
    id = '507f1f77bcf86cd799439011';
  let discovered = [],
    hints = [],
    completed = false;
  const publicCase = () => ({
    id,
    title: generated.title,
    story: generated.story,
    suspects: generated.suspects,
    status: completed ? 'completed' : 'active',
    difficulty: 'medium',
    clues: generated.clues.map((c) => ({
      ...c,
      relevance: undefined,
      discovered: discovered.includes(c.id),
    })),
    revealedHints: hints,
    progress: { discoveredClueIds: discovered, usedHintCount: hints.length, hintLimit: 3 },
  });
  const result = () => ({
    ...generated.solution,
    correct: true,
    accusedSuspectId: 's1',
    accusedSuspectName: 'Avery',
    culpritName: 'Avery',
    score: 145,
    scoreBreakdown: { base: 150, clueBonus: 5, hintPenalty: 10, total: 145 },
    supportingClues: generated.clues.slice(0, 2),
  });
  await page.route('**/api/cases**', async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    let body;
    if (path === '/api/cases') body = { caseAccessToken: 'a'.repeat(64), case: publicCase() };
    else if (path.endsWith('/discover')) {
      discovered = ['c1'];
      body = {
        clueId: 'c1',
        discovered: true,
        alreadyDiscovered: false,
        progress: { discoveredClueIds: discovered, usedHintCount: hints.length, hintLimit: 3 },
      };
    } else if (path.endsWith('/hints')) {
      hints = [generated.hints[0]];
      body = { hint: hints[0], usedHintCount: hints.length, remainingHints: 3 - hints.length };
    } else if (path.endsWith('/accuse')) {
      completed = true;
      body = { status: 'completed', result: result() };
    } else if (path.endsWith('/result'))
      body = {
        result: result(),
      };
    else body = { case: publicCase() };
    await route.fulfill({ json: body });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Start investigation', exact: true }).click();
  await page.getByLabel('What happened?').fill('An antique atlas vanished from a locked archive.');
  await page.getByRole('button', { name: 'Generate case' }).click();
  await expect(page.getByRole('heading', { name: 'The vanished atlas' })).toBeVisible();
  await page.getByRole('button', { name: /EVIDENCE 01/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: /EVIDENCE 01/ }).click();
  await page.getByRole('button', { name: 'Discover clue', exact: true }).click();
  await expect(page.getByText('1 of 7 clues collected')).toBeVisible();
  await page.getByRole('button', { name: 'Reveal next hint' }).click();
  await expect(page.getByText('Hint 1', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 of 7 clues collected')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Make an accusation' }).click();
  await page.getByRole('radio').first().check();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirm accusation' }).click();
  await expect(page.getByRole('heading', { name: 'A sharp deduction.' })).toBeVisible();
  await expect(page.getByText('145', { exact: true }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Play again' }).click();
  await expect(page.getByLabel('What happened?')).toBeVisible();
});
test('validation and recoverable network errors', async ({ page }) => {
  await page.goto('/create');
  await page.getByRole('button', { name: 'Generate case' }).click();
  await expect(page.getByRole('alert')).toContainText('20 and 1,000');
  await page.getByLabel('What happened?').fill('A fictional locked room with a vanished atlas.');
  await page.route('**/api/cases', (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'The case generator is busy. Please try again shortly.',
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Generate case' }).click();
  await expect(page.getByRole('alert')).toContainText('busy');
});
