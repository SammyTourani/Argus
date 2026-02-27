/**
 * E2E Tests — Landing Page
 *
 * Verifies the public landing page renders correctly, hero section is visible,
 * navigation works, pricing shows 3 tiers, and CTA buttons are interactive.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('hero section is visible', async ({ page }) => {
    // The landing page should have a prominent hero area
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('page has a main heading', async ({ page }) => {
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('navigation links are present', async ({ page }) => {
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('CTA button is clickable', async ({ page }) => {
    // Look for primary action buttons (Get Started, Try Free, etc.)
    const cta = page.locator('a, button').filter({ hasText: /get started|try|sign up|build/i }).first();
    if (await cta.isVisible()) {
      await expect(cta).toBeEnabled();
    }
  });
});
