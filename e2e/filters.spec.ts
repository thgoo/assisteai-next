import {
  expect, test, type BrowserContext, type Page,
} from '@playwright/test';

// What each filter keeps follows the fixtures in e2e/mock-api.ts: series are ids divisible by 3, comedies the odd ids,
// "Muito Bom" average ids 1–20, Carla rated every 5th id, the signed-in user every 4th.

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
  await expect(page).toHaveURL('/?tipo=series');

  await page.getByRole('button', { name: 'Todos' }).click();
  await page.getByLabel('Gênero').selectOption({ label: 'Comédia' });
  await expect(cards(page)).toHaveCount(14);
  expect((await ids(page)).every(id => id % 2 === 1)).toBe(true);

  await page.getByLabel('Gênero').selectOption({ label: 'Todos os gêneros' });
  await page.getByLabel('Avaliação').selectOption({ label: 'Muito Bom ou melhor' });
  await expect(cards(page)).toHaveCount(20);
  await expect(page).toHaveURL('/?nota=muito-bom');

  await page.getByLabel('Avaliação').selectOption({ label: 'Qualquer avaliação' });
  await page.getByLabel('Quem avaliou').selectOption({ label: 'Avaliados por Carla' });
  await expect(cards(page)).toHaveCount(5);
  expect(await ids(page)).toEqual([5, 10, 15, 20, 25]);
});

test('filters combine, and clearing them brings the whole list back', async ({ page }) => {
  await page.goto('/?tipo=series&genero=Comedy');

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
  await expect(page).toHaveURL('/?ordem=populares');
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
  await expect(page).toHaveURL('/?tipo=series');
  await expect(cards(page)).toHaveCount(9);
  await expect(page.getByLabel('Quem avaliou')).toHaveValue('');
});

test('coming back from a movie keeps the filters', async ({ page }) => {
  await page.goto('/?tipo=series');
  await expect(cards(page)).toHaveCount(9);

  await page.locator('a[href="/movies/9-movie-9"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 9');
  await page.goBack();

  await expect(page).toHaveURL('/?tipo=series');
  await expect(cards(page)).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Séries' })).toHaveAttribute('aria-pressed', 'true');
});

test('on phones the filters fold behind a button that counts the active ones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?tipo=series&genero=Comedy');

  const toggle = page.getByRole('button', { name: /Filtros/ });
  await expect(toggle).toContainText('2');
  await expect(page.getByRole('button', { name: 'Séries' })).toBeHidden();

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Séries' })).toBeVisible();
});
