import { test, expect } from '@playwright/test';

test.describe('Regressão Visual — Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Desativar animações MUI para determinismo
    await page.addStyleTag({
      content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
    });
    await page.waitForTimeout(500);
  });

  test('dashboard deve corresponder ao snapshot visual', async ({ page }) => {
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.005,
    });
  });

  test('hero banner deve corresponder ao snapshot', async ({ page }) => {
    const hero = page.locator('.MuiBox-root').filter({ hasText: 'Painel de Controle' }).first();
    await expect(hero).toHaveScreenshot('hero-banner.png', {
      maxDiffPixelRatio: 0.005,
    });
  });

  test('cards de estatísticas devem corresponder ao snapshot', async ({ page }) => {
    const statsSection = page.locator('[data-testid^="stat-"]').first().locator('..');
    await expect(statsSection).toHaveScreenshot('stats-grid.png', {
      maxDiffPixelRatio: 0.005,
    });
  });

  test('tabela de transações deve corresponder ao snapshot', async ({ page }) => {
    const table = page.locator('[data-testid="transactions-table"]');
    await expect(table).toHaveScreenshot('transactions-table.png', {
      maxDiffPixelRatio: 0.005,
    });
  });
});
