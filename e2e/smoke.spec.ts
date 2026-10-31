import { expect, test } from '@playwright/test';

const signIn = (context: import('@playwright/test').BrowserContext) => context.addCookies([
  // The mock API's session (e2e/mock-api.ts)
  {
    name: 'session', value: 'e2e', domain: 'localhost', path: '/',
  },
]);

test('home renders the first page on the server and loads more on scroll', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('a[href^="/movies/"]');
  await expect(cards).toHaveCount(24);
  await expect(page.locator('a[href="/movies/1-movie-1"]')).toContainText('Muito Bom');

  await page.mouse.wheel(0, 100_000);
  await expect(page.locator('a[href="/movies/27-movie-27"]')).toBeVisible();
  await expect(cards).toHaveCount(27);
});

test('a screen taller than the first page loads the next one without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 4000 });
  await page.goto('/');

  await expect(page.locator('a[href="/movies/27-movie-27"]')).toBeAttached();
});

for (const way of ['back button', 'logo'] as const) {
  test(`coming back to the list with the ${way} returns to the same place`, async ({ page }) => {
    await page.goto('/');
    // Away from the bottom, so no next page starts loading
    const movie = page.locator('a[href="/movies/8-movie-8"]');
    await movie.scrollIntoViewIfNeeded();
    // Let the debounced save run, as a visitor reading the list would
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => document.documentElement.scrollTop)).toBeGreaterThan(0);
    // Where the card sits on the screen: what the visitor sees
    const cardTop = () => movie.evaluate(el => Math.round(el.getBoundingClientRect().top));
    const before = await cardTop();

    await movie.click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 8');

    if (way === 'logo') await page.getByRole('link', { name: 'Logo' }).click();
    else await page.goBack();

    await expect(movie).toBeInViewport();
    await expect.poll(cardTop).toBe(before);
  });
}

test('home HTML already has the list', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('href="/movies/1-movie-1"');
});

test('movie page shows the movie and its ratings', async ({ page }) => {
  await page.goto('/movies/2-movie-2');

  await expect(page).toHaveTitle('Assiste Aí - Movie 2');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 2');
  await expect(page.getByText('Ficção científica e Fantasia')).toBeVisible();
  await expect(page.getByText('Bruno')).toBeVisible();
  await expect(page.getByText('Imperdível').first()).toBeVisible();
});

test('a movie outside the build is generated on its first visit', async ({ request }) => {
  const res = await request.get('/movies/26-movie-26');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('Movie 26');
});

test('unknown movies answer 404', async ({ request }) => {
  expect((await request.get('/movies/999-nope')).status()).toBe(404);
  expect((await request.get('/movies/not-a-movie')).status()).toBe(404);
});

test('anonymous visitors are asked to log in before rating', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova indicação' }).click();
  await expect(page.getByText('faça login')).toBeVisible();
  await expect(page.getByLabel('Filme/Série *')).toHaveCount(0);
});

test('signed-in users never see the login button while the session is checked', async ({ page, context }) => {
  await signIn(context);
  // The session check answers only when the test says so
  let answerSession = () => {};
  await page.route('**/me', async (route) => {
    await new Promise<void>((resolve) => {
      answerSession = resolve;
    });
    await route.continue();
  });
  await page.goto('/');

  // `isVisible` checks right now; `toBeHidden` would wait for the button to go
  await expect(page.getByRole('searchbox')).toBeVisible();
  expect(await page.getByRole('button', { name: 'Entrar' }).isVisible()).toBe(false);

  answerSession();
  await expect(page.getByRole('button', { name: 'Usuário E2E' })).toBeVisible();
  expect(await page.getByRole('button', { name: 'Entrar' }).isVisible()).toBe(false);
});

test('signed-in users rate a movie', async ({ page, context }) => {
  await signIn(context);
  await page.goto('/');

  await page.getByRole('button', { name: 'Nova indicação' }).click();
  await page.getByLabel('Filme/Série *').fill('https://www.themoviedb.org/movie/603');
  await page.getByLabel('Avaliação *').selectOption('UNMISSABLE');
  await page.getByLabel('Comentário').fill('Clássico');
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page.getByText('Sua avaliação foi enviada com sucesso.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeHidden();
});

test('rating errors show the API message', async ({ page, context }) => {
  await signIn(context);
  await page.goto('/');

  await page.getByRole('button', { name: 'Nova indicação' }).click();
  await page.getByLabel('Filme/Série *').fill('https://example.com/movie');
  await page.getByLabel('Avaliação *').selectOption('BAD');
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page.getByText('Link do IMDb ou do TMDb inválido.')).toBeVisible();
  // The form stays open with what was typed
  await expect(page.getByLabel('Filme/Série *')).toHaveValue('https://example.com/movie');
});

test('signed-in users log out', async ({ page, context }) => {
  await signIn(context);
  await page.goto('/');

  await page.getByRole('button', { name: 'Usuário E2E' }).click();
  await page.getByRole('button', { name: 'Sair' }).click();

  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('on phones nothing spills past the screen\'s width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  await page.goto('/');
  await expect(page.locator('a[href^="/movies/"]').first()).toBeVisible();
  expect(await overflow()).toBe(0);

  await page.goto('/movies/9-movie-9');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 9');
  expect(await overflow()).toBe(0);
});

test('on phones "Nova indicação" floats at the bottom right, on every page', async ({ page, context }) => {
  await signIn(context);
  await page.setViewportSize({ width: 390, height: 844 });
  const button = page.getByRole('button', { name: 'Nova indicação' });

  for (const path of ['/', '/movies/9-movie-9']) {
    await page.goto(path);
    await page.mouse.wheel(0, 2_000);
    await expect(button).toBeInViewport();
    const box = (await button.boundingBox())!;
    expect(box.x + box.width).toBeGreaterThan(390 - 32);
    expect(box.y + box.height).toBeGreaterThan(844 - 32);
  }

  await button.click();
  await expect(page.getByLabel('Filme/Série *')).toBeVisible();
});

test('on wide screens "Nova indicação" docks at the bottom right once the header scrolls away', async ({ page, context }) => {
  await signIn(context);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Nova indicação' });
  const corner = async () => {
    const box = (await button.boundingBox())!;
    return box.x + box.width > 1280 - 48 && box.y + box.height > 720 - 48;
  };

  await expect(button).toBeInViewport();
  expect(await corner()).toBe(false);

  await page.mouse.wheel(0, 1_000);
  await expect.poll(corner).toBe(true);
  await expect(button).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(corner).toBe(false);
  await expect(button).toHaveCount(1);

  await page.mouse.wheel(0, 1_000);
  await expect.poll(corner).toBe(true);
  await button.click();
  await expect(page.getByLabel('Filme/Série *')).toBeVisible();
});
