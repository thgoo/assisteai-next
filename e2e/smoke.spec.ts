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
  await expect(page.getByLabel('Avaliação *')).toBeVisible();
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

test('docking fades the label out and the shadow in gradually, and back', async ({ page, context }) => {
  await signIn(context);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Nova indicação' })).toBeInViewport();

  // The label's opacity on each frame the ghost shows, while scrolling to `top`
  const opacities = (top: number) => page.evaluate(async (scrollTop) => {
    const ghost = document.querySelector<HTMLElement>('[class*="_ghost"]')!;
    const label = ghost.querySelector<HTMLElement>('[class*="_label"]')!;
    const seen: number[] = [];
    let run = true;
    const tick = () => {
      if (getComputedStyle(ghost).display !== 'none') seen.push(Number(label.style.opacity));
      if (run) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    await new Promise((resolve) => { setTimeout(resolve, 1_000); });
    run = false;
    return seen;
  }, top);

  const down = await opacities(1_500);
  expect(down[0]).toBeGreaterThan(0.8);
  expect(down.some(opacity => opacity > 0.1 && opacity < 0.9)).toBe(true);
  expect(down.at(-1)).toBeLessThan(0.05);

  const up = await opacities(0);
  expect(up[0]).toBeLessThan(0.2);
  expect(up.some(opacity => opacity > 0.1 && opacity < 0.9)).toBe(true);
  expect(up.at(-1)).toBeGreaterThan(0.95);
});

test('ratings show their comments', async ({ page }) => {
  // Bruno rated every movie, with a comment
  await page.goto('/movies/9-movie-9');
  await expect(page.getByText('Bom demais')).toBeVisible();
});

test('a shared movie link previews its rating and backdrop', async ({ request }) => {
  const html = await (await request.get('/movies/9-movie-9')).text();
  expect(html).toContain('<meta property="og:title" content="Filme 9 (2009)"/>');
  expect(html).toMatch(/<meta property="og:description" content="Média Muito Bom · \d avaliações — Description of movie 9."\/>/);
  expect(html).toMatch(/<meta property="og:image" content="[^"]*logo-square.png"\/>/);
});

test('people without a picture show their initials', async ({ page }) => {
  await page.goto('/movies/9-movie-9');
  await expect(page.getByText('BR', { exact: true }).first()).toBeVisible();
});

for (const way of ['back button', '"Voltar"', 'logo'] as const) {
  test(`coming back to the list with the ${way} keeps its random backdrop`, async ({ page }) => {
    // The backdrops shown (the mock API draws a new one on every request)
    const backdrops = () => page.evaluate(() => [...new Set([...document.querySelectorAll('img')]
      .filter(img => img.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
      .map(img => img.getAttribute('src') ?? '').filter(src => src.includes('/backdrop.png')))]);
    await page.goto('/');
    await expect.poll(async () => (await backdrops()).length).toBe(1);
    const drawn = await backdrops();

    await page.locator('a[href="/movies/8-movie-8"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Movie 8');
    if (way === 'back button') await page.goBack();
    else await page.getByRole('link', { name: way === 'logo' ? 'Logo' : 'Voltar' }).click();
    await expect(page.locator('a[href="/movies/8-movie-8"]')).toBeVisible();

    // Shown with the list, without waiting for the server's new draw, and kept after it
    for (let sample = 0; sample < 8; sample += 1) {
      expect(await backdrops()).toEqual(drawn);
      await page.waitForTimeout(150);
    }
  });
}

test('every visit draws its own random backdrop', async ({ browser }) => {
  // Separate visitors, at once, so no cache of a page answers for both
  const draws = await Promise.all([0, 1, 2].map(async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    const src = await page.locator('img[src*="/backdrop.png"]').first().getAttribute('src');
    await context.close();
    return src;
  }));
  expect(new Set(draws).size).toBeGreaterThan(1);
});
