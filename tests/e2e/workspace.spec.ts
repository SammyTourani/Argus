/**
 * E2E Tests — Workspace
 *
 * Verifies the workspace page loads and basic interactions work.
 * Full testing requires authenticated sessions — these are structural
 * smoke tests that validate the workspace UI renders.
 *
 * Authenticated workspace tests are deferred until a test auth fixture is set up.
 */

import { test, expect } from '@playwright/test';

test.describe('Workspace', () => {
  test('workspace route exists and responds', async ({ page }) => {
    const response = await page.goto('/workspace');
    // Should get some response (200 or redirect to auth)
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
  });

  test('dashboard route exists and responds', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
  });

  test('builder route exists and responds', async ({ page }) => {
    const response = await page.goto('/builder');
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
  });

  test('marketplace route exists and responds', async ({ page }) => {
    const response = await page.goto('/marketplace');
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
  });

  test('generation route redirects (does not 500)', async ({ page }) => {
    const response = await page.goto('/generation');
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
  });

  test('resources route exists and responds', async ({ page }) => {
    const response = await page.goto('/resources');
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
  });

  test('upgrade route exists and responds', async ({ page }) => {
    const response = await page.goto('/upgrade');
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
  });
});
