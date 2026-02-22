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

test('energy metric shows 0.00 mJ initially', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Energy generated: 0.00 mJ')).toBeVisible()
})

test('energy metric shows correct mJ per click', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: /count is/ })
  await button.click()
  await expect(page.getByText('Energy generated: 0.90 mJ')).toBeVisible()
  await button.click()
  await expect(page.getByText('Energy generated: 1.80 mJ')).toBeVisible()
})
