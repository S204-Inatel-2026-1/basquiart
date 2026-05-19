import { expect, test } from '@playwright/test';
import {
  mockCommonRequests,
  mockGroups,
} from './support/network';
import { setupAuthenticatedUser, navigateToGroup } from './support/helpers';

test.beforeEach(async ({ page }) => {
  await mockCommonRequests(page);
});

test.describe('Post Management - E2E', () => {
  test('deve exibir botão de criar arte em grupo vazio', async ({ page }) => {
    await setupAuthenticatedUser(page, { id: 1, username: 'artista-pedro' });

    await mockGroups(page, {
      mine: [
        {
          groupId: 1,
          name: 'Novo estúdio',
          role: 'OWNER',
          lastPost: null,
        },
      ],
    });

    // Mock para listar posts do grupo
    await page.route('**/group/1/posts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');
    await page.getByTitle('Grupos').click();
    await navigateToGroup(page, 'Novo estúdio');

    // Verificar que o botão de criar arte está visível
    await expect(page.getByRole('button', { name: /ENVIAR ARTE/i })).toBeVisible();
  });

  test('deve carregar posts do grupo com sucesso', async ({ page }) => {
    await setupAuthenticatedUser(page, { id: 2, username: 'artista-ana' });

    await mockGroups(page, {
      mine: [
        {
          groupId: 2,
          name: 'Estúdio collaborativo',
          role: 'OWNER',
          lastPost: {
            content: 'Último post aqui',
            author: 'artista-ana',
            createdAt: new Date().toISOString(),
          },
        },
      ],
    });

    await page.route('**/group/2/posts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            content: 'Post do grupo',
            author: 'artista-ana',
            created_at: new Date().toISOString(),
            group_id: 2,
            images: [],
          },
        ]),
      });
    });

    await page.goto('/');
    await page.getByTitle('Grupos').click();
    await navigateToGroup(page, 'Estúdio collaborativo');

    // Verificar que o grupo foi carregado (botão de criar arte visível)
    await expect(page.getByRole('button', { name: /ENVIAR ARTE/i })).toBeVisible();
  });

  test('deve retornar à lista de grupos quando clicar em voltar', async ({ page }) => {
    await setupAuthenticatedUser(page, { id: 3, username: 'artista-carlos' });

    await mockGroups(page, {
      mine: [
        {
          groupId: 3,
          name: 'Galeria privada',
          role: 'MEMBER',
          lastPost: null,
        },
      ],
    });

    await page.route('**/group/3/posts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');
    await page.getByTitle('Grupos').click();
    
    // Verificar que está na lista de grupos
    await expect(page.getByText('Galeria privada')).toBeVisible();

    await navigateToGroup(page, 'Galeria privada');
    // Verificar que entrou no grupo
    await expect(page.getByRole('button', { name: /ENVIAR ARTE/i })).toBeVisible();

    // Voltar para lista de grupos
    await page.getByRole('button', { name: /voltar|back|<|seta/i }).first().click();

    // Verificar que voltou para a lista
    await expect(page.getByText('Galeria privada')).toBeVisible({ timeout: 3000 });
  });
});
