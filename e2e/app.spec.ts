import { test, expect } from '@playwright/test'

test('homepage has correct heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Vite + React' })).toBeVisible()
})

test('counter increments on click', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: /count is/ })
  await expect(button).toContainText('count is 0')
  await button.click()
  await expect(button).toContainText('count is 1')
})
