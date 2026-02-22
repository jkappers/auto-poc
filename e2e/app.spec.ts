import { test, expect } from '@playwright/test'

test('homepage has correct heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'auto-poc' })).toBeVisible()
})

test('homepage describes the workflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
  await expect(page.getByText(/agent-ready/)).toBeVisible()
})
