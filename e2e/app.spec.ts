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

test('energy metric shows 0 Ohmz initially', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Energy generated: 0 Ohmz')).toBeVisible()
})

test('energy metric increments by 1 Ohmz per click', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: /count is/ })
  await button.click()
  await expect(page.getByText('Energy generated: 1 Ohmz')).toBeVisible()
  await button.click()
  await expect(page.getByText('Energy generated: 2 Ohmz')).toBeVisible()
})
