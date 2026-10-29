import {
  expect, test, type BrowserContext, type Page,
} from '@playwright/test';

// The titles come from e2e/mock-api.ts
const signIn = (context: BrowserContext) => context.addCookies([
  {
    name: 'session', value: 'e2e', domain: 'localhost', path: '/',
  },
]);

async function openForm(page: Page, context: BrowserContext) {
  await signIn(context);
  await page.goto('/');
  await page.getByRole('button', { name: 'Nova indicação' }).click();
  return page.getByRole('combobox', { name: 'Filme/Série *' });
}

const suggestions = (page: Page) => page.getByRole('listbox').getByRole('option');

const ratingRequest = (page: Page) => page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/ratings'));

test('a title found by name is rated through its TMDb link', async ({ page, context }) => {
  const field = await openForm(page, context);

  await field.fill('matr');
  await expect(suggestions(page)).toHaveCount(2);
  await suggestions(page).filter({ hasText: /^MatrixFilme · 1999/ }).click();
  await expect(page.getByText('Filme · 1999 · The Matrix')).toBeVisible();

  await page.getByLabel('Avaliação *').selectOption('UNMISSABLE');
  const request = ratingRequest(page);
  await page.getByRole('button', { name: 'Enviar' }).click();

  expect((await request).postDataJSON()).toMatchObject({ url: 'https://www.themoviedb.org/movie/603', rating: 'UNMISSABLE' });
  await expect(page.getByText('Sua avaliação foi enviada com sucesso.')).toBeVisible();
});

test('the keyboard picks a title, skipping the ones already rated', async ({ page, context }) => {
  const field = await openForm(page, context);

  await field.fill('matrix');
  await expect(suggestions(page).filter({ hasText: /Você já avaliou/ })).toHaveAttribute('aria-disabled', 'true');
  // Matrix, then Matrix Reloaded (already rated) is skipped back to Matrix
  await field.press('ArrowDown');
  await field.press('ArrowDown');
  await field.press('Enter');

  await expect(page.getByText('Filme · 1999 · The Matrix')).toBeVisible();
  // Enter picked the title, it didn't submit the form
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
});

test('Esc closes the suggestions, not the form', async ({ page, context }) => {
  const field = await openForm(page, context);

  await field.fill('game');
  await expect(suggestions(page).filter({ hasText: /Game of Thrones/ })).toBeVisible();
  await field.press('Escape');

  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
});

test('a picked title can be swapped for another', async ({ page, context }) => {
  const field = await openForm(page, context);

  await field.fill('game');
  await suggestions(page).filter({ hasText: /Game of Thrones/ }).click();
  await page.getByRole('button', { name: 'Trocar título' }).click();

  await expect(field).toBeFocused();
  await expect(field).toHaveValue('');
});

test('nothing found says so', async ({ page, context }) => {
  const field = await openForm(page, context);

  await field.fill('xyzzy');
  await expect(page.getByText('Nenhum título encontrado.')).toBeVisible();
});

test('a pasted link is sent as is, without searching', async ({ page, context }) => {
  const field = await openForm(page, context);
  let searched = false;
  page.on('request', (req) => {
    if (req.url().includes('/titles/search')) searched = true;
  });

  await field.fill('https://www.themoviedb.org/tv/1399');
  await page.getByLabel('Avaliação *').selectOption('GOOD');
  const request = ratingRequest(page);
  await page.getByRole('button', { name: 'Enviar' }).click();

  expect((await request).postDataJSON()).toMatchObject({ url: 'https://www.themoviedb.org/tv/1399' });
  expect(searched).toBe(false);
});

test('typing a name without picking a title asks to pick one', async ({ page, context }) => {
  const field = await openForm(page, context);

  await field.fill('matrix');
  await page.getByLabel('Avaliação *').selectOption('GOOD');
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page.getByText('Escolha um título da lista ou cole o link do IMDb ou do TMDb.')).toBeVisible();
});

test('the suggestions float over the modal instead of making it scroll', async ({ page, context }) => {
  // A full page of results, like TMDb's
  await page.route('**/titles/search**', route => route.fulfill({
    json: {
      data: Array.from({ length: 10 }, (_, i) => ({
        url: `https://www.themoviedb.org/movie/${1000 + i}`,
        category: 'movie',
        title: `Matrix ${i + 1}`,
        originalTitle: `Matrix ${i + 1}`,
        year: 2000 + i,
        posterUrl: null,
        ratedByMe: false,
      })),
    },
  }));
  const field = await openForm(page, context);

  await field.fill('matrix');
  await expect(suggestions(page)).toHaveCount(10);

  expect(await page.getByRole('listbox').evaluate(list => list.parentElement === document.body)).toBe(true);
  const modalScrolls = await field.evaluate((input) => {
    for (let el = input.parentElement; el; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY === 'auto') return true;
    }
    return false;
  });
  expect(modalScrolls).toBe(false);
});
