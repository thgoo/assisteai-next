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

async function loadSecondPage(page: Page) {
  await page.goto('/');
  await page.mouse.wheel(0, 100_000);
  await expect(card(page, 25)).toBeAttached();
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

for (const way of ['back button', 'logo'] as const) {
  test(`coming back with the ${way} to a movie of a scrolled page returns to the same place`, async ({ page }) => {
    const release = servePosters(page, 'hold');
    release();
    await loadSecondPage(page);
    await expect(card(page, 26)).toBeVisible();
    await card(page, 26).scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    // Where the card sits on the screen: what the visitor sees (the scroll offset itself can change with the content
    // above it, like the backdrop)
    const cardTop = () => card(page, 26).evaluate(el => Math.round(el.getBoundingClientRect().top));
    const before = await cardTop();

    await card(page, 26).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 26');

    if (way === 'logo') await page.getByRole('link', { name: 'Logo' }).click();
    else await page.goBack();

    await expect(card(page, 26)).toBeInViewport();
    await expect.poll(cardTop).toBe(before);
  });
}

/** Filters to "Muito Ruim", ids 25–27: all with posters */
async function filterVeryBad(page: Page) {
  await page.getByRole('button', { name: /^Avaliação/ }).click();
  await page.getByLabel('Muito Ruim', { exact: true }).check();
}

test('new filters swap the results in one go, posters included, without dimming a quick answer', async ({ page }) => {
  servePosters(page, 'hold')();
  await page.goto('/');
  await expect(card(page, 1)).toBeVisible();
  // Whether the list was ever dimmed, or a card ever shimmered
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      if (document.querySelector('[class*="_isStale"]')) document.body.dataset.dimmed = 'true';
      if (document.querySelector('[class*="_isLoading"]')) document.body.dataset.shimmered = 'true';
    });
    observer.observe(document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class'],
    });
  });

  await filterVeryBad(page);
  await expect(card(page, 25)).toBeVisible();
  await expect(card(page, 1)).toHaveCount(0);
  // Already loaded on arrival: no shimmer, no fade
  expect(await naturalWidth(page, 25)).toBeGreaterThan(0);
  expect(await page.evaluate(() => ({ ...document.body.dataset }))).toEqual({});
});

test('new filters keep the previous results, dimmed, while their posters load, for 1 s at most', async ({ page }) => {
  servePosters(page, 'hold');
  await page.goto('/');
  await expect(card(page, 1)).toBeVisible();

  await filterVeryBad(page);
  await expect(page.locator('[class*="_isStale"]')).toBeVisible();
  await expect(card(page, 1)).toBeVisible();

  await expect(card(page, 25)).toBeVisible({ timeout: 3_000 });
  await expect(card(page, 1)).toHaveCount(0);
  await expect(page.locator('[class*="_isStale"]')).toHaveCount(0);
});

/** Records the view transitions started, with the posters taking part in each */
async function recordPosterTransitions(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { posterTransitions: string[][] };
    w.posterTransitions = [];
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((update: ViewTransitionUpdateCallback) => {
      const transition = start(update);
      transition.ready.then(() => w.posterTransitions.push(document.getAnimations()
        .map(animation => (animation.effect as KeyframeEffect).pseudoElement ?? '')
        .filter(name => name.startsWith('::view-transition-group(poster-'))), () => {});
      return transition;
    }) as typeof document.startViewTransition;
  });
  return () => page.evaluate(() => (window as unknown as { posterTransitions: string[][] }).posterTransitions);
}

test('the poster flies from its card to the movie page and back, to the same scroll', async ({ page }) => {
  servePosters(page, 'hold')();
  const transitions = await recordPosterTransitions(page);

  await loadSecondPage(page);
  await expect(card(page, 25)).toBeVisible();
  await card(page, 25).scrollIntoViewIfNeeded();
  const scrolled = await page.evaluate(() => window.scrollY);

  await card(page, 25).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 25');
  await expect.poll(transitions).toEqual([['::view-transition-group(poster-25)']]);

  await page.getByRole('link', { name: 'Logo' }).click();
  await expect(card(page, 25)).toBeInViewport();
  await expect.poll(transitions).toHaveLength(2);
  expect((await transitions())[1]).toEqual(['::view-transition-group(poster-25)']);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
});

test('"Voltar" flies the poster back to a filtered list', async ({ page }) => {
  servePosters(page, 'hold')();
  const transitions = await recordPosterTransitions(page);
  // Series are the ids divisible by 3; 27 has a poster
  await page.goto('/?category=series');
  await expect(card(page, 27)).toBeVisible();

  await card(page, 27).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 27');
  await page.getByRole('link', { name: 'Voltar' }).click();

  await expect(page).toHaveURL('/?category=series');
  await expect(card(page, 27)).toBeInViewport();
  await expect.poll(transitions).toEqual([['::view-transition-group(poster-27)'], ['::view-transition-group(poster-27)']]);
});
