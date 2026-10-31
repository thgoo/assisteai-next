import {
  expect, test, type BrowserContext, type Page,
} from '@playwright/test';

// What each filter keeps follows the fixtures in e2e/mock-api.ts: series are ids divisible by 3, comedies the odd ids,
// averages are "Muito Bom" for ids 1–20, "Legal" 21–24 and "Muito Ruim" 25–27, Carla rated every 5th id, the signed-in
// user every 4th.

const signIn = (context: BrowserContext) => context.addCookies([
  {
    name: 'session', value: 'e2e', domain: 'localhost', path: '/',
  },
]);

const cards = (page: Page) => page.locator('a[href^="/movies/"]');
const ids = async (page: Page) => (await cards(page).evaluateAll(links => links.map(a => a.getAttribute('href'))))
  .map(href => Number(href!.split('/')[2].split('-')[0]));
const sortSelect = (page: Page) => page.getByLabel('Ordenar').filter({ visible: true });
const search = (page: Page) => page.getByRole('searchbox', { name: 'Buscar filme ou série' });

test('the search finds titles regardless of accents', async ({ page }) => {
  await page.goto('/');
  await search(page).fill('acao');

  await expect(cards(page)).toHaveCount(1);
  expect(await ids(page)).toEqual([7]);
  await expect(page).toHaveURL('/?q=acao');
});

test('each filter narrows the list and goes in the URL', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Séries' }).click();
  await expect(cards(page)).toHaveCount(9);
  expect((await ids(page)).every(id => id % 3 === 0)).toBe(true);
  await expect(page).toHaveURL('/?category=series');

  await page.getByRole('button', { name: 'Todos' }).click();
  await page.getByLabel('Gênero').selectOption({ label: 'Comédia' });
  await expect(cards(page)).toHaveCount(14);
  expect((await ids(page)).every(id => id % 2 === 1)).toBe(true);

  await page.getByLabel('Gênero').selectOption({ label: 'Todos os gêneros' });
  await page.getByRole('button', { name: /^Avaliação/ }).click();
  await page.getByLabel('Muito Bom', { exact: true }).check();
  await expect(cards(page)).toHaveCount(20);
  await expect(page).toHaveURL('/?average=VERY_GOOD');
  // Any of the checked averages
  await page.getByLabel('Muito Ruim', { exact: true }).check();
  await expect(cards(page)).toHaveCount(23);
  await expect(page).toHaveURL('/?average=VERY_GOOD,VERY_BAD');
  await expect(page.getByRole('button', { name: /^Avaliação/ })).toHaveText('Avaliação (2)');

  await page.getByLabel('Muito Bom', { exact: true }).uncheck();
  await page.getByLabel('Muito Ruim', { exact: true }).uncheck();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /^Avaliação/ })).toHaveText('Qualquer avaliação');
  await page.getByLabel('Quem avaliou').selectOption({ label: 'Avaliados por Carla' });
  await expect(cards(page)).toHaveCount(5);
  expect(await ids(page)).toEqual([5, 10, 15, 20, 25]);
});

test('filters combine, and clearing them brings the whole list back', async ({ page }) => {
  await page.goto('/?category=series&genre=Comedy');

  await expect(cards(page)).toHaveCount(5);
  expect((await ids(page)).every(id => id % 3 === 0 && id % 2 === 1)).toBe(true);

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(cards(page)).toHaveCount(24);
  await expect(page).toHaveURL('/');
});

test('the sort orders the list', async ({ page }) => {
  await page.goto('/');
  await sortSelect(page).selectOption({ label: 'Mais avaliados' });

  // id 20: Ana, Bruno, Carla and the signed-in user
  await expect(cards(page).first()).toHaveAttribute('href', '/movies/20-movie-20');
  await expect(page).toHaveURL('/?sort=popular');
});

test('"only the ones I haven\'t rated" is for signed-in users', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Só os que não avaliei' })).toBeHidden();

  await signIn(context);
  await page.reload();
  await page.getByRole('button', { name: 'Só os que não avaliei' }).click();
  await expect(page.getByRole('button', { name: 'Só os que não avaliei' })).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(21);
  expect((await ids(page)).some(id => id % 4 === 0)).toBe(false);
});

test('nothing found offers to clear the filters', async ({ page }) => {
  await page.goto('/');
  await search(page).fill('zzz');

  await expect(page.getByText('Nenhum filme encontrado com esses filtros.')).toBeVisible();
  await page.getByText('Nenhum filme encontrado com esses filtros.').getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(cards(page)).toHaveCount(24);
  await expect(search(page)).toHaveValue('');
});

test('the back button undoes a filter', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Séries' }).click();
  await expect(cards(page)).toHaveCount(9);
  await page.getByLabel('Quem avaliou').selectOption({ label: 'Avaliados por Carla' });
  await expect(cards(page)).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL('/?category=series');
  await expect(cards(page)).toHaveCount(9);
  await expect(page.getByLabel('Quem avaliou')).toHaveValue('');
});

test('coming back from a movie keeps the filters', async ({ page }) => {
  await page.goto('/?category=series');
  await expect(cards(page)).toHaveCount(9);

  await page.locator('a[href="/movies/9-movie-9"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 9');
  await page.goBack();

  await expect(page).toHaveURL('/?category=series');
  await expect(cards(page)).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Séries' })).toHaveAttribute('aria-pressed', 'true');
});

test('on phones the filters fold behind a button that counts the active ones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?category=series&genre=Comedy');

  const toggle = page.getByRole('button', { name: /Filtros/ });
  await expect(toggle).toContainText('2');
  await expect(page.getByRole('button', { name: 'Séries' })).toBeHidden();

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Séries' })).toBeVisible();
});

test('a next page that fails stops the loading instead of retrying it in a loop', async ({ page }) => {
  let nextPageRequests = 0;
  await page.route('**/movies?*cursor=*', (route) => {
    nextPageRequests++;
    return route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  });
  await page.goto('/');
  await expect(cards(page)).toHaveCount(24);

  await page.mouse.wheel(0, 100_000);
  await expect.poll(() => nextPageRequests).toBeGreaterThan(0);
  await page.waitForTimeout(3_000);

  // The first try, and at most SWR's own spaced-out retry
  expect(nextPageRequests).toBeLessThanOrEqual(2);
  await expect(cards(page)).toHaveCount(24);
});

test('while new filters load, the previous results stay, dimmed', async ({ page }) => {
  let answer = () => {};
  await page.route('**/movies?category=series*', async (route) => {
    await new Promise<void>((resolve) => {
      answer = resolve;
    });
    await route.continue();
  });
  await page.goto('/');
  await expect(cards(page)).toHaveCount(24);

  await page.getByRole('button', { name: 'Séries' }).click();
  // No collapse to "Carregando...": the 24 cards stay, marked busy
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  await expect(cards(page)).toHaveCount(24);
  await expect(page.getByText('Carregando...')).toBeHidden();

  answer();
  await expect(cards(page)).toHaveCount(9);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
});

test('while a search loads, the list on screen stays, not an older search', async ({ page }) => {
  await page.goto('/');
  await search(page).fill('acao');
  await expect(cards(page)).toHaveCount(1);
  await search(page).fill('');
  await expect(cards(page)).toHaveCount(24);

  let answer = () => {};
  await page.route('**/movies?q=filme*', async (route) => {
    await new Promise<void>((resolve) => {
      answer = resolve;
    });
    await route.continue();
  });
  await search(page).fill('filme');
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  await expect(cards(page)).toHaveCount(24);

  answer();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page).toHaveURL('/?q=filme');
  expect(await ids(page)).not.toContain(7);
});

test('"Voltar" on a movie returns to the list it came from, filters and scroll included', async ({ page }) => {
  await page.goto('/?category=series');
  await expect(cards(page)).toHaveCount(9);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(300);
  const scrolled = await page.evaluate(() => window.scrollY);

  await page.locator('a[href="/movies/9-movie-9"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 9');
  await page.getByRole('link', { name: 'Voltar' }).click();

  await expect(page).toHaveURL('/?category=series');
  await expect(cards(page)).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Séries' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
});

test('the logo starts the list over, without filters', async ({ page }) => {
  await page.goto('/?category=series');
  await page.locator('a[href="/movies/9-movie-9"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 9');
  await page.getByRole('link', { name: 'Logo' }).click();

  await expect(page).toHaveURL('/');
  await expect(cards(page)).toHaveCount(24);
});

test('"Voltar" on a movie opened from a link goes to the list\'s top', async ({ page }) => {
  await page.goto('/movies/9-movie-9');
  await page.getByRole('link', { name: 'Voltar' }).click();

  await expect(page).toHaveURL('/');
  await expect(cards(page)).toHaveCount(24);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('a person picked in the URL shows by name, and only the default label until the names load', async ({ page }) => {
  // The names arrive only when the test says so
  let sendNames = () => {};
  const namesSent = new Promise<void>((resolve) => {
    sendNames = resolve;
  });
  await page.route('**/users', async (route) => {
    await namesSent;
    await route.continue();
  });
  await page.goto('/?ratedBy=2');
  const select = page.getByLabel('Quem avaliou');

  await expect(select).toBeVisible();
  await expect(select.locator('option:checked')).toHaveText('Avaliados por todos');
  expect(await select.locator('option').allTextContents()).not.toContain('2');

  sendNames();
  await expect(select.locator('option:checked')).toHaveText('Avaliados por Bruno');
});

test('a page loaded with filters shows the bar as it starts, then as it ends, nothing in between', async ({ page, context }) => {
  await context.addCookies([{
    name: 'session', value: 'e2e', domain: 'localhost', path: '/',
  }]);
  // What the bar shows, on every frame from the start
  await page.addInitScript(() => {
    const w = window as unknown as { barStates: string[] };
    w.barStates = [];
    const record = () => {
      const bar = document.getElementById('movie-filters');
      if (bar) {
        const state = [...bar.querySelectorAll('button, select')].map(el => (el instanceof HTMLSelectElement
          ? `${el.selectedOptions[0]?.text}@${Math.round(el.getBoundingClientRect().width)}`
          : `${el.textContent}${el.getAttribute('aria-pressed') ?? ''}${el.className.includes('isActive') ? '*' : ''}`))
          .join(' | ');
        if (w.barStates.at(-1) !== state) w.barStates.push(state);
      }
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  // The genres, the people and the session each arrive at their own time
  for (const [path, delay] of [['**/genres', 300], ['**/users', 600], ['**/me', 900]] as const) {
    await page.route(path, async (route) => {
      await new Promise((resolve) => { setTimeout(resolve, delay); });
      await route.continue();
    });
  }

  await page.goto('/?genre=Drama&average=UNMISSABLE&ratedBy=2');
  await expect(page.getByLabel('Quem avaliou').locator('option:checked')).toHaveText('Avaliados por Bruno');
  await expect(page.getByRole('button', { name: 'Só os que não avaliei' })).toBeVisible();
  await page.waitForTimeout(300);

  const states = await page.evaluate(() => (window as unknown as { barStates: string[] }).barStates);
  expect(states, states.join('\n')).toHaveLength(2);
});
