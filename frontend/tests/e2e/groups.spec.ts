import { expect, test, type Page } from '@playwright/test';
import { createFakeJwt, mockCommonRequests } from './support/network';

const authUser = {
  id: 12,
  username: 'qa-artista',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qa-artista',
};

type MineGroup = {
  groupId: number;
  name: string;
  role: 'OWNER' | 'MEMBER';
  description?: string;
  member_count?: number;
  visibility?: 'public' | 'private';
  lastPost: null;
};

type PublicGroup = {
  id: number;
  name: string;
  description: string;
  member_count: number;
  invite_code: string;
  visibility: 'public' | 'private';
  creator_id: number;
  created_at: string;
};

async function setupAuthenticatedGroups(
  page: Page,
  options: {
    mine?: MineGroup[];
    publicGroups?: PublicGroup[];
  } = {}
): Promise<{ mine: MineGroup[]; publicGroups: PublicGroup[] }> {
  const token = createFakeJwt({ sub: String(authUser.id) });
  const mine = options.mine ?? [
    {
      groupId: 10,
      name: 'Atelie Central',
      role: 'OWNER',
      description: 'Coletivo interno de estudos.',
      member_count: 3,
      visibility: 'private',
      lastPost: null,
    },
  ];
  const publicGroups = options.publicGroups ?? [
    {
      id: 20,
      name: 'Laboratorio de Cores',
      description: 'Espaco publico para estudos cromaticos.',
      member_count: 18,
      invite_code: '',
      visibility: 'public',
      creator_id: 3,
      created_at: '2026-05-19T12:00:00.000Z',
    },
  ];

  await page.addInitScript(({ user, authToken }) => {
    localStorage.setItem('basquiart_jwt_token', authToken);
    localStorage.setItem('basquiart_user', JSON.stringify(user));
  }, { user: authUser, authToken: token });

  await mockCommonRequests(page);

  await page.route('**/group/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mine),
    });
  });

  await page.route('**/group/public', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(publicGroups),
    });
  });

  await page.route('**/group/invites', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  return { mine, publicGroups };
}

async function openGroupsPage(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTitle('Grupos').click();
  await expect(page.getByRole('heading', { name: 'Coletivos de Arte' })).toBeVisible();
}

test('lista coletivos do usuario e coletivos publicos', async ({ page }) => {
  await setupAuthenticatedGroups(page);

  await openGroupsPage(page);

  await expect(page.getByRole('heading', { name: 'Seus Coletivos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Atelie Central' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Coletivos Públicos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Laboratorio de Cores' })).toBeVisible();
});

test('filtra coletivos pela busca local', async ({ page }) => {
  await setupAuthenticatedGroups(page, {
    mine: [
      {
        groupId: 10,
        name: 'Atelie Central',
        role: 'OWNER',
        description: 'Coletivo interno de estudos.',
        member_count: 3,
        visibility: 'private',
        lastPost: null,
      },
    ],
    publicGroups: [
      {
        id: 20,
        name: 'Laboratorio de Cores',
        description: 'Espaco publico para estudos cromaticos.',
        member_count: 18,
        invite_code: '',
        visibility: 'public',
        creator_id: 3,
        created_at: '2026-05-19T12:00:00.000Z',
      },
    ],
  });

  await openGroupsPage(page);
  await page.getByLabel('Buscar coletivos').fill('cores');

  await expect(page.getByText('Resultados da Busca')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Laboratorio de Cores' })).toHaveCount(2);
  await expect(page.getByText('Espaco publico para estudos cromaticos.').first()).toBeVisible();
});

test('cria novo coletivo e atualiza a lista', async ({ page }) => {
  const { mine } = await setupAuthenticatedGroups(page);
  let createPayload: Record<string, unknown> | null = null;

  await page.route('**/group/create', async (route) => {
    createPayload = route.request().postDataJSON() as Record<string, unknown>;
    mine.unshift({
      groupId: 30,
      name: 'Coletivo QA',
      role: 'OWNER',
      description: 'Grupo criado pelo Playwright.',
      member_count: 1,
      visibility: 'private',
      lastPost: null,
    });

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 30, name: 'Coletivo QA' }),
    });
  });

  await openGroupsPage(page);
  await page.getByRole('button', { name: 'CRIAR NOVO' }).click();

  const form = page.locator('.fixed form');
  await form.locator('input.elegant-input').fill('Coletivo QA');
  await form.locator('textarea').fill('Grupo criado pelo Playwright.');
  await form.getByRole('button', { name: 'Privado' }).click();
  await form.getByRole('button', { name: 'CRIAR' }).click();

  await expect(page.getByRole('heading', { name: 'Coletivo QA' })).toBeVisible();
  expect(createPayload).toMatchObject({
    name: 'Coletivo QA',
    description: 'Grupo criado pelo Playwright.',
    visibility: 'private',
  });
});

test('participa de coletivo usando id de convite', async ({ page }) => {
  const { mine } = await setupAuthenticatedGroups(page, { publicGroups: [] });
  let acceptedInviteId = '';

  await page.route('**/group/invites/42/accept', async (route) => {
    acceptedInviteId = route.request().url();
    mine.push({
      groupId: 42,
      name: 'Clube do Convite',
      role: 'MEMBER',
      description: 'Grupo acessado por convite.',
      member_count: 4,
      visibility: 'private',
      lastPost: null,
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ userId: authUser.id, groupId: 42, role: 'MEMBER' }),
    });
  });

  await openGroupsPage(page);
  await page.getByRole('button', { name: 'PARTICIPAR DO GRUPO' }).click();

  const form = page.locator('.fixed form');
  await form.locator('input.elegant-input').fill('42');
  await form.getByRole('button', { name: 'PARTICIPAR' }).click();

  await expect(page.getByRole('heading', { name: 'Clube do Convite' })).toBeVisible();
  expect(acceptedInviteId).toContain('/group/invites/42/accept');
});

test('cria convite para usuario a partir de coletivo proprio', async ({ page }) => {
  await setupAuthenticatedGroups(page);

  let invitePayload: Record<string, unknown> | null = null;
  await page.route('**/group/invite', async (route) => {
    invitePayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 77 }),
    });
  });

  await openGroupsPage(page);
  await page.evaluate(() => {
    window.prompt = () => '99';
    window.alert = (message?: string) => {
      window.localStorage.setItem('last_invite_alert', String(message ?? ''));
    };
  });

  const groupCard = page
    .locator('.soft-card')
    .filter({ has: page.getByRole('heading', { name: 'Atelie Central' }) })
    .first();
  await groupCard.getByRole('button', { name: 'Convidar' }).click();

  const inviteModal = page.getByRole('heading', { name: 'Convidar para Coletivo' });
  const hasInviteModal = await inviteModal.isVisible({ timeout: 1000 }).catch(() => false);

  if (hasInviteModal) {
    const modal = page.locator('.fixed').filter({ has: inviteModal }).first();
    await modal.locator('input.elegant-input').fill('99');
    await modal.getByRole('button', { name: 'ENVIAR CONVITE' }).click();
    await expect(page.getByText('Convite criado com sucesso. ID do convite: 77')).toBeVisible();
  }

  await expect.poll(() => invitePayload).toMatchObject({
    group_id: 10,
    receiverId: 99,
  });

  if (!hasInviteModal) {
    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem('last_invite_alert')))
      .toContain('ID do convite: 77');
  }
});
