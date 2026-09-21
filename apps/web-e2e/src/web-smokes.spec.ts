import {expect, test} from '@playwright/test'

import {WebE2eApi} from './web-e2e-api'

test('unauthenticated /me redirects to login', async ({page}) => {
  await page.goto('/me')

  await expect(page.getByRole('heading', {name: 'Login'})).toBeVisible()
})

test('invalid password surfaces INVALID_CREDENTIALS', async ({page}) => {
  await page.goto('/login')
  await page.locator('#login-email').fill('nobody@example.com')
  await page.locator('#login-password').fill('wrong-password')
  await page.getByRole('button', {name: 'Sign in'}).click()

  await expect(page.getByText(/INVALID_CREDENTIALS/)).toBeVisible()
})

test('register then sign in lands on home', async ({page}) => {
  const {email, password} = await WebE2eApi.registerOwner()

  await page.goto('/login')
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.getByRole('button', {name: 'Sign in'}).click()

  await expect(page.getByRole('heading', {name: 'B2B SaaS Starter'})).toBeVisible()
})
