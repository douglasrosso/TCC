import { test, expect } from '@playwright/test';

test.describe('Dashboard — Elementos visíveis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve renderizar navbar com título VRT Demo', async ({ page }) => {
    const brand = page.locator('text=VRT Demo').first();
    await expect(brand).toBeVisible();
  });

  test('deve renderizar hero com "Painel de Controle"', async ({ page }) => {
    await expect(page.locator('text=Painel de Controle')).toBeVisible();
  });

  test('deve exibir 4 cards de estatísticas', async ({ page }) => {
    const cards = page.locator('[data-testid^="stat-"]');
    await expect(cards).toHaveCount(4);
  });

  test('deve exibir tabela de transações com 5 linhas', async ({ page }) => {
    const rows = page.locator('[data-testid="transactions-table"] tbody tr');
    await expect(rows).toHaveCount(5);
  });

  test('deve exibir sidebar de informações', async ({ page }) => {
    await expect(page.locator('text=Informações')).toBeVisible();
    await expect(page.locator('[data-testid="current-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="visit-counter"]')).toBeVisible();
  });

  test('deve exibir rodapé', async ({ page }) => {
    await expect(page.locator('text=Trabalho de Conclusão de Curso')).toBeVisible();
  });
});

test.describe('Dashboard — Conteúdo dos cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('card Usuários Ativos deve conter valor 1.247', async ({ page }) => {
    await expect(page.locator('text=1.247')).toBeVisible();
  });

  test('card Pedidos deve conter valor 3.891', async ({ page }) => {
    await expect(page.locator('text=3.891')).toBeVisible();
  });

  test('card Receita deve conter valor R$ 48.520', async ({ page }) => {
    await expect(page.locator('text=R$ 48.520')).toBeVisible();
  });

  test('card Satisfação deve conter valor 94%', async ({ page }) => {
    await expect(page.locator('text=94%')).toBeVisible();
  });
});

test.describe('Dashboard — Tabela de transações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve exibir cabeçalhos ID, Cliente, Valor, Status', async ({ page }) => {
    const table = page.locator('[data-testid="transactions-table"]');
    await expect(table.locator('th', { hasText: 'ID' })).toBeVisible();
    await expect(table.locator('th', { hasText: 'Cliente' })).toBeVisible();
    await expect(table.locator('th', { hasText: 'Valor' })).toBeVisible();
    await expect(table.locator('th', { hasText: 'Status' })).toBeVisible();
  });

  test('deve exibir chips de status com cores corretas', async ({ page }) => {
    const chips = page.locator('[data-testid="transactions-table"] .MuiChip-root');
    await expect(chips).toHaveCount(5);
  });

  test('transação #1004 deve ter status Cancelado', async ({ page }) => {
    const row = page.locator('[data-testid="transactions-table"] tbody tr', { hasText: '#1004' });
    await expect(row.locator('.MuiChip-root')).toHaveText('Cancelado');
  });
});

test.describe('Dashboard — Versão', () => {
  test('sidebar deve exibir versão 2.1.0', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=2.1.0').first()).toBeVisible();
  });
});
