import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

// Posters of the second page (e2e/mock-api.ts) go through /_next/image; the browser gets a local image instead
const POSTER = readFileSync(path.join(__dirname, '../public/img/logo-square.png'));

/** Holds every poster until `release()`, or fails them all */
function servePosters(page: Page, outcome: 'hold' | 'fail') {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  page.route('**/_next/image**', async (route) => {
    if (outcome === 'fail') {
      await route.abort();
      return;
    }
    await released;
    await route.fulfill({ body: POSTER, contentType: 'image/png' }).catch(() => {});
  });

  return release;
}

const card = (page: Page, id: number) => page.locator(`a[href="/movies/${id}-movie-${id}"]`);
const spinner = (page: Page) => page.locator('[class*="_spinner"]');
const naturalWidth = (page: Page, id: number) => card(page, id).locator('img')
  .evaluate((img: HTMLImageElement) => img.naturalWidth);

/** Scrolls until the second page is in the DOM; the first scrolls can land before hydration */
async function loadSecondPage(page: Page) {
  await page.goto('/');
  await expect(async () => {
    await page.mouse.wheel(0, 100_000);
    await expect(card(page, 25)).toBeAttached({ timeout: 500 });
  }).toPass();
}

test('a scrolled page stays hidden until its posters load', async ({ page }) => {
  const release = servePosters(page, 'hold');
  await loadSecondPage(page);

  await expect(card(page, 25)).toBeHidden();
  await expect(spinner(page)).toBeVisible();

  release();
  await expect(card(page, 25)).toBeVisible();
  expect(await naturalWidth(page, 25)).toBeGreaterThan(0);
  await expect(spinner(page)).toBeHidden();
});

test('a scrolled page shows after 1 s with placeholders when its posters are slow', async ({ page }) => {
  servePosters(page, 'hold');
  await loadSecondPage(page);

  await expect(card(page, 25)).toBeVisible({ timeout: 3_000 });
  expect(await naturalWidth(page, 25)).toBe(0);
  await expect(card(page, 25).locator('[class*="_isLoading"]')).toBeVisible();
  await expect(spinner(page)).toBeHidden();
});

test('a poster that fails shows the fallback', async ({ page }) => {
  servePosters(page, 'fail');
  await loadSecondPage(page);

  await expect(card(page, 25)).toContainText('Imagem não disponível');
});
