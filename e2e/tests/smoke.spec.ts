import { test, expect } from '@playwright/test';

test.describe('Exposure Drift Sentinel Smoke Test', () => {
  test('runs complete demo scenario walkthrough', async ({ page }) => {
    // 1. Visit Desktop / Triage Queue
    await page.goto('/');
    await expect(page).toHaveTitle(/Exposure Drift Sentinel/i);

    // 2. Navigate to Simulator
    await page.click('a[href="/simulator"]');
    await expect(page.locator('h1')).toContainText(/Signal Simulator/i);

    // 3. Run New Facility scenario on demo policy POL-100245
    const runBtn = page.locator('button:has-text("Run Scenario")').first();
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // 4. Wait for scenario execution and verify step log
    await expect(page.locator('text=Scenario complete')).toBeVisible({ timeout: 15_000 });

    // 5. Open newly generated event detail
    const eventLink = page.locator('a[href^="/events/"]').first();
    await expect(eventLink).toBeVisible();
    await eventLink.click();

    // 6. Verify Event Detail attributes
    await expect(page.locator('h1')).toContainText(/Drift Event/i);
    await expect(page.locator('text=HIGH')).toBeVisible();

    // 7. Verify Decision modal interaction (Accept)
    const acceptBtn = page.locator('button:has-text("Accept")');
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();

      // Modal appears requesting underwriter note
      const noteInput = page.locator('textarea, input[name="note"]').first();
      await noteInput.fill('Verified new facility with insured broker.');
      await page.click('button:has-text("Confirm Accept")');

      // Verify closed status
      await expect(page.locator('text=CLOSED')).toBeVisible({ timeout: 10_000 });
    }

    // 8. Navigate to Portfolio page
    await page.click('a[href="/portfolio"]');
    await expect(page.locator('h1')).toContainText(/Portfolio Exposure/i);

    // 9. Navigate to Rules Catalog
    await page.click('a[href="/rules"]');
    await expect(page.locator('h1')).toContainText(/Rules Catalog/i);

    // 10. Navigate to Audit Log
    await page.click('a[href="/audit"]');
    await expect(page.locator('h1')).toContainText(/Audit History/i);
  });
});
