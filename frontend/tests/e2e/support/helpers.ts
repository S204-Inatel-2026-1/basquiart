import type { Page } from '@playwright/test';
import { createFakeJwt } from './network';

/**
 * Setup de autenticação no localStorage e página
 */
export async function setupAuthenticatedUser(
  page: Page,
  user = { id: 1, username: 'playwright-user' }
): Promise<string> {
  const token = createFakeJwt({ sub: String(user.id) });

  await page.addInitScript(({ authToken, userData }) => {
    localStorage.setItem('basquiart_jwt_token', authToken);
    localStorage.setItem('basquiart_user', JSON.stringify(userData));
  }, {
    authToken: token,
    userData: {
      id: user.id,
      username: user.username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
    },
  });

  return token;
}

/**
 * Limpar localStorage após teste
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('basquiart_jwt_token');
    localStorage.removeItem('basquiart_user');
  });
}

/**
 * Esperar um elemento estar visível com retry
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout });
}

/**
 * Preencher formulário de criação de grupo
 */
export async function fillGroupForm(
  page: Page,
  data: { name: string; description?: string; isPublic?: boolean }
): Promise<void> {
  await page.getByLabel(/Nome do coletivo/i).fill(data.name);

  if (data.description) {
    await page.getByLabel(/Descrição/i).fill(data.description);
  }

  if (data.isPublic !== undefined) {
    const checkbox = page.getByLabel(/público/i).or(page.getByLabel(/Visibilidade.*público/i));
    const isChecked = await checkbox.isChecked();

    if (isChecked !== data.isPublic) {
      await checkbox.click();
    }
  }
}

/**
 * Preencher e submeter formulário de convite
 */
export async function inviteUserToGroup(page: Page, username: string): Promise<void> {
  await page.getByLabel(/Email ou usuário/i).fill(username);
  await page.getByRole('button', { name: /Convidar/i }).click();
}

/**
 * Preencher formulário de criação de post
 */
export async function fillPostForm(
  page: Page,
  data: { content: string; imagePaths?: string[] }
): Promise<void> {
  await page.getByLabel(/Conteúdo|Descrição/i).or(page.getByPlaceholder(/Compartilhe|Escreva/i)).fill(data.content);

  if (data.imagePaths && data.imagePaths.length > 0) {
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(data.imagePaths);
    
    // Aguardar upload
    await page.waitForTimeout(1000);
  }
}

/**
 * Navegar para um grupo específico
 * Como a app é um SPA, esperamos apenas que o conteúdo do grupo apareça
 */
export async function navigateToGroup(page: Page, groupName: string): Promise<void> {
  await page.getByText(groupName, { exact: false }).first().click();
  // Aguardar a página carregar o conteúdo do grupo (ex: botão de criar post)
  await page.getByRole('button', { name: /ENVIAR ARTE|criar post|publicar/i }).first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
    // Se não encontrar o botão, apenas aguarda um pouco para a página renderizar
    return page.waitForLoadState('networkidle').catch(() => null);
  });
}
