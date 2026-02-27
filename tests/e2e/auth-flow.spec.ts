/**
 * E2E Tests — Authentication Flow
 *
 * Verifies auth pages load correctly and protected routes redirect.
 * Real OAuth/password submission is not tested here — these are structural
 * smoke tests that validate routing and page rendering.
 */

import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('sign-in page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    // Should render some form of sign-in UI
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('domcontentloaded');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('protected route redirects unauthenticated user', async ({ page }) => {
    // Workspace/dashboard should redirect to sign-in for unauthenticated users
    await page.goto('/workspace');
    await page.waitForLoadState('domcontentloaded');

    // Should either redirect to login or show a sign-in prompt
    const url = page.url();
    const isRedirected = url.includes('/auth') || url.includes('/login');
    const hasSignInContent = await page
      .locator('text=/sign in|log in|sign up/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(isRedirected || hasSignInContent).toBeTruthy();
  });

  test('auth pages have no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});
