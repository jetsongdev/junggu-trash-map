import { expect, test } from '@playwright/test';

test('home page loads core map controls', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /중구 휴지통 지도/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /테마/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '확대' })).toBeVisible();
  await expect(page.getByRole('button', { name: '축소' })).toBeVisible();

  const statusButton = page.getByRole('button', { name: /데이터 현황/ });
  await expect(statusButton).toBeVisible();
  await statusButton.click();
  await expect(statusButton).toHaveAttribute('aria-expanded', 'true');
});
