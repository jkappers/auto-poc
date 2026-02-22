import { test, expect } from '@playwright/test'

test('homepage shows Todo heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /todo/i })).toBeVisible()
})

test('can add a todo item', async ({ page }) => {
  await page.goto('/')
  const input = page.getByPlaceholderText(/add a todo/i)
  await input.fill('Buy groceries')
  await input.press('Enter')
  await expect(page.getByText('Buy groceries')).toBeVisible()
})

test('input is cleared after adding a todo', async ({ page }) => {
  await page.goto('/')
  const input = page.getByPlaceholderText(/add a todo/i)
  await input.fill('Buy groceries')
  await input.press('Enter')
  await expect(input).toHaveValue('')
})

test('can add multiple todos', async ({ page }) => {
  await page.goto('/')
  const input = page.getByPlaceholderText(/add a todo/i)
  await input.fill('First task')
  await input.press('Enter')
  await input.fill('Second task')
  await input.press('Enter')
  await expect(page.getByText('First task')).toBeVisible()
  await expect(page.getByText('Second task')).toBeVisible()
})

test('each todo has a checkbox', async ({ page }) => {
  await page.goto('/')
  const input = page.getByPlaceholderText(/add a todo/i)
  await input.fill('Task with checkbox')
  await input.press('Enter')
  await expect(page.getByRole('checkbox')).toBeVisible()
})
