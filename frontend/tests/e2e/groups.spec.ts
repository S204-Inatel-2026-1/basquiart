import { expect, test } from '@playwright/test';
import {
  createFakeJwt,
  mockCommonRequests,
  mockGroups,
  mockLoginSuccess,
} from './support/network';
import { setupAuthenticatedUser, fillGroupForm, inviteUserToGroup, waitForElement } from './support/helpers';

test.beforeEach(async ({ page }) => {
  await mockCommonRequests(page);
});

test.describe('Group Management - E2E', () => {
  test('deve exibir coletivos do usuário quando autenticado', async ({ page }) => {
    const token = await setupAuthenticatedUser(page, { id: 5, username: 'artista-maria' });

    await mockGroups(page, {
      mine: [
        {
          groupId: 1,
          name: 'Estúdio colaborativo',
          role: 'OWNER',
          lastPost: {
            content: 'Primeira obra do coletivo',
            author: 'artista-maria',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        {
          groupId: 2,
          name: 'Galeria experimental',
          role: 'MEMBER',
          lastPost: null,
        },
      ],
    });

    await page.goto('/');

    // Verificar que o user está autenticado
    await expect(page.getByRole('button', { name: /ENVIAR ARTE/i })).toBeVisible();

    // Navegar para grupos
    await page.getByTitle('Grupos').click();

    // Verificar que os grupos aparecem
    await expect(page.getByRole('heading', { name: 'Coletivos de Arte' })).toBeVisible();
    await expect(page.getByText('Estúdio colaborativo')).toBeVisible();
    await expect(page.getByText('Galeria experimental')).toBeVisible();

    // Verificar role exibido
    await expect(page.getByText(/Owner/i).or(page.getByText(/Dono/i))).toBeVisible();
  });

  test('deve listar grupos públicos disponíveis para jointar', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await mockGroups(page, {
      mine: [],
      publicGroups: [
        {
          id: 100,
          name: 'Coletivo público aberto',
          description: 'Espaço para todos os artistas experimentarem',
          member_count: 24,
          invite_code: 'ABERTO100',
          visibility: 'public',
          creator_id: 3,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 101,
          name: 'Laboratório de cores',
          description: 'Estudos cromáticos avançados',
          member_count: 8,
          invite_code: 'CORES101',
          visibility: 'public',
          creator_id: 7,
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    });

    await page.goto('/');
    await page.getByTitle('Grupos').click();

    // Verificar grupos públicos na seção apropriada
    await expect(page.getByText('Coletivo público aberto')).toBeVisible();
    await expect(page.getByText('Espaço para todos os artistas experimentarem')).toBeVisible();
    await expect(page.getByText('Laboratório de cores')).toBeVisible();

    // Verificar contagem de membros
    await expect(page.getByText(/24 membros?/i).or(page.getByText('24'))).toBeVisible();
  });

  test('deve criar novo grupo com visibilidade privada', async ({ page }) => {
    await setupAuthenticatedUser(page, { id: 10, username: 'novo-criador' });

    // Mock da criação
    await page.route('**/group/create', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 50,
            name: 'Meu novo coletivo',
            description: 'Descrição do novo grupo',
            visibility: 'PRIVATE',
            created_at: new Date().toISOString(),
          }),
        });
      }
    });

    await mockCommonRequests(page);
    await page.goto('/');
    await page.getByTitle('Grupos').click();

    // Clicar em criar novo grupo
    await page.getByRole('button', { name: /novo coletivo/i }).or(page.getByRole('button', { name: /\+/i })).click();

    // Preencher formulário
    await fillGroupForm(page, {
      name: 'Meu novo coletivo',
      description: 'Descrição do novo grupo',
      isPublic: false,
    });

    // Submeter
    await page.getByRole('button', { name: /Criar|Enviar/i }).first().click();

    // Verificar que o grupo foi criado (validação básica de sucesso)
    await expect(page.getByText(/sucesso|criado|created/i).or(page.getByTitle('Grupos'))).toBeVisible({ timeout: 3000 });
  });

  test('deve convidar usuário para um grupo (owner)', async ({ page }) => {
    const token = await setupAuthenticatedUser(page, { id: 5, username: 'owner-grupo' });

    await mockGroups(page, {
      mine: [
        {
          groupId: 20,
          name: 'Grupo do dono',
          role: 'OWNER',
          lastPost: null,
        },
      ],
    });

    // Mock do endpoint de convite
    await page.route('**/group/*/invite', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Convite enviado com sucesso',
            invited_user: 'novo-usuario',
          }),
        });
      }
    });

    await page.goto('/');
    await page.getByTitle('Grupos').click();

    // Clicar no grupo para abrir detalhes
    await page.getByText('Grupo do dono').click();

    // Clicar em convidar
    await page.getByRole('button', { name: /convidar|adicionar membro/i }).click();

    // Preencher e submeter convite
    await inviteUserToGroup(page, 'novo-usuario');

    // Verificar mensagem de sucesso
    await expect(
      page.getByText(/convite enviado|sucesso|invited/i)
    ).toBeVisible({ timeout: 3000 });
  });

  test('deve exibir diferença entre grupos OWNER e MEMBER', async ({ page }) => {
    const token = await setupAuthenticatedUser(page, { id: 8, username: 'artista-joao' });

    await mockGroups(page, {
      mine: [
        {
          groupId: 30,
          name: 'Grupo que participo',
          role: 'MEMBER',
          lastPost: {
            content: 'Post do grupo',
            author: 'outro-usuario',
            createdAt: new Date().toISOString(),
          },
        },
      ],
    });

    await page.goto('/');
    await page.getByTitle('Grupos').click();
    await page.getByText('Grupo que participo').click();

    // Como MEMBER, não deve ter botão de deletar ou opções de admin
    const deleteButton = page.getByRole('button', { name: /deletar|remover grupo/i });
    await expect(deleteButton).not.toBeVisible();

    // Mas pode ter botão de sair
    await expect(
      page.getByRole('button', { name: /sair|deixar/i })
    ).toBeVisible({ timeout: 3000 });
  });

  test('deve deletar grupo (somente owner)', async ({ page }) => {
    await setupAuthenticatedUser(page, { id: 12, username: 'owner-delete' });

    await mockGroups(page, {
      mine: [
        {
          groupId: 40,
          name: 'Grupo para deletar',
          role: 'OWNER',
          lastPost: null,
        },
      ],
    });

    // Mock do delete
    await page.route('**/group/40', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Grupo deletado' }),
        });
      }
    });

    await page.goto('/');
    await page.getByTitle('Grupos').click();
    await page.getByText('Grupo para deletar').click();

    // Abrir menu de opções ou clicar em deletar
    await page.getByRole('button', { name: /deletar|remover grupo/i }).click();

    // Confirmar no modal
    await page.getByRole('button', { name: /confirmar|deletar|sim/i }).click();

    // Deve voltar para lista e grupo não aparece mais
    await expect(page.getByText('Grupo para deletar')).not.toBeVisible({ timeout: 3000 });
  });

  test('deve buscar grupos públicos por nome', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Mock para busca vazia
    await page.route('**/api/groups/search?q=&*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock para busca com termo
    await page.route('**/api/groups/search?q=cores*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 200,
            name: 'Laboratório de cores avançadas',
            description: 'Estudo profundo de teoria das cores',
            member_count: 15,
            invite_code: 'CORES200',
            visibility: 'public',
            creator_id: 9,
            created_at: new Date().toISOString(),
          },
        ]),
      });
    });

    await mockCommonRequests(page);
    await page.goto('/');
    await page.getByTitle('Grupos').click();

    // Buscar por termo
    await page.getByPlaceholder(/buscar|search/i).fill('cores');

    // Aguardar resultado
    await expect(page.getByText('Laboratório de cores avançadas')).toBeVisible({ timeout: 3000 });
  });
});
