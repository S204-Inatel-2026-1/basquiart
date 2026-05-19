import { expect, test, type Page } from '@playwright/test';
import {
  backendPost,
  createFakeJwt,
  mockCommonRequests,
  mockGroupPosts,
  mockGroups,
} from './support/network';

const authUser = {
  id: 12,
  username: 'qa-artista',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qa-artista',
};

async function setupAuthenticatedGroup(page: Page): Promise<void> {
  const token = createFakeJwt({ sub: String(authUser.id) });

  await page.addInitScript(({ user, authToken }) => {
    localStorage.setItem('basquiart_jwt_token', authToken);
    localStorage.setItem('basquiart_user', JSON.stringify(user));
  }, { user: authUser, authToken: token });

  await mockCommonRequests(page);
  await mockGroups(page, {
    mine: [
      {
        groupId: 10,
        name: 'Atelie Central',
        role: 'OWNER',
        lastPost: null,
      },
    ],
    publicGroups: [],
  });
}

async function openGroupFeed(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTitle('Grupos').click();
  await expect(page.getByRole('heading', { name: 'Coletivos de Arte' })).toBeVisible();
  await page.getByText('Atelie Central').click();
  await expect(page.getByRole('heading', { name: 'Atelie Central' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await setupAuthenticatedGroup(page);
});

test('carrega posts do coletivo com dados do backend', async ({ page }) => {
  await mockGroupPosts(page, 10, [
    backendPost({
      id: 100,
      content: 'Estudo de luz azul',
      likes: { totalLikes: 2, hasLiked: false },
      commentCount: 1,
    }),
  ]);

  await openGroupFeed(page);

  await expect(page.getByRole('heading', { name: 'Estudo de luz azul' })).toBeVisible();
  await expect(page.getByText('artista-convidado')).toBeVisible();
  await expect(page.getByRole('button', { name: /Curtidas \(2\)/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Di.*\(1\)/i })).toBeVisible();
});

test('atualiza contador ao curtir post do coletivo', async ({ page }) => {
  await mockGroupPosts(page, 10, [
    backendPost({
      id: 100,
      likes: { totalLikes: 2, hasLiked: false },
    }),
  ]);

  let likeRequested = false;
  await page.route('**/posts/100/like', async (route) => {
    likeRequested = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ liked: true }),
    });
  });

  await openGroupFeed(page);
  await page.getByRole('button', { name: /Curtidas \(2\)/i }).click();

  await expect(page.getByRole('button', { name: /Curtidas \(3\)/i })).toBeVisible();
  expect(likeRequested).toBe(true);
});

test('lista e cria comentario em post do coletivo', async ({ page }) => {
  await mockGroupPosts(page, 10, [
    backendPost({ id: 100, commentCount: 1 }),
  ]);

  const comments = [
    {
      id: 1,
      content: 'Composicao muito forte.',
      createdAt: '2026-05-19T12:00:00.000Z',
      userId: 22,
      postId: 100,
      user: { id: 22, username: 'curadora' },
    },
  ];

  await page.route('**/posts/100/comments', async (route) => {
    if (route.request().method() === 'POST') {
      comments.push({
        id: 2,
        content: 'Gostei da paleta.',
        createdAt: '2026-05-19T12:05:00.000Z',
        userId: authUser.id,
        postId: 100,
        user: { id: authUser.id, username: authUser.username },
      });

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(comments[1]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(comments),
    });
  });

  await openGroupFeed(page);
  await page.getByRole('button', { name: /Di.*\(1\)/i }).click();

  await expect(page.getByText('Composicao muito forte.')).toBeVisible();
  await page.locator('input[type="text"]').last().fill('Gostei da paleta.');
  await page.locator('form button[type="submit"]').last().click();

  await expect(page.getByText('Gostei da paleta.')).toBeVisible();
});

test('envia avaliacao para post de outro artista', async ({ page }) => {
  await mockGroupPosts(page, 10, [
    backendPost({
      id: 100,
      authorId: 22,
      author: {
        id: 22,
        username: 'artista-convidado',
        createdAt: '2026-05-18T12:00:00.000Z',
      },
    }),
  ]);

  let ratingPayload: {
    ratings: Array<{ category: string; score: number }>;
  } | null = null;

  await page.route('**/posts/100/rate', async (route) => {
    ratingPayload = route.request().postDataJSON() as {
      ratings: Array<{ category: string; score: number }>;
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await openGroupFeed(page);
  await page.getByRole('button', { name: 'Avaliar' }).click();

  await expect(page.getByRole('heading', { name: 'Avaliar Obra' })).toBeVisible();
  const sliders = page.locator('input[type="range"]');
  await sliders.nth(0).fill('8');
  await sliders.nth(1).fill('6');
  await sliders.nth(2).fill('10');
  await page.getByRole('button', { name: /ENVIAR AVALIA/i }).click();

  await expect(page.getByRole('heading', { name: 'Avaliar Obra' })).toBeHidden();
  expect(ratingPayload).toEqual({
    ratings: [
      { category: 'Technique', score: 4 },
      { category: 'Composition', score: 3 },
      { category: 'Creativity', score: 5 },
    ],
  });
});

test('publica nova arte dentro de um coletivo', async ({ page }) => {
  const posts = [backendPost({ id: 100, content: 'Primeiro estudo' })];
  await mockGroupPosts(page, 10, posts);

  let createdPostContent = '';
  await page.route('**/posts/10', async (route) => {
    createdPostContent = route.request().postData() || '';
    posts.unshift(backendPost({
      id: 101,
      content: 'Nova obra QA\n\nDescricao criada pelo teste',
      authorId: authUser.id,
      author: {
        id: authUser.id,
        username: authUser.username,
        createdAt: '2026-05-19T12:00:00.000Z',
      },
      likes: { totalLikes: 0, hasLiked: false },
      commentCount: 0,
    }));

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 101 }),
    });
  });

  await openGroupFeed(page);
  await page.getByRole('button', { name: /ENVIAR PARA ESTE COLETIVO/i }).click();

  await expect(page.getByRole('heading', { name: /Compartilhe/i })).toBeVisible();
  const submitForm = page.locator('main form');

  await submitForm.locator('input[type="file"]').setInputFiles({
    name: 'arte-qa.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
      'base64'
    ),
  });
  await submitForm.locator('input[type="text"]').first().fill('Nova obra QA');
  await submitForm.locator('textarea').fill('Descricao criada pelo teste');
  await page.getByRole('button', { name: /Publicar na Galeria/i }).click();

  await expect(page.getByRole('heading', { name: 'Atelie Central' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Nova obra QA/ })).toBeVisible();
  expect(createdPostContent).toContain('Nova obra QA');
  expect(createdPostContent).toContain('Descricao criada pelo teste');
});
