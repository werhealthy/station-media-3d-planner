import { test, expect } from '@playwright/test'
test('seleziona un media point e mostra il dettaglio upload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('Station Media 3D Planner')).toBeVisible()
  await page
    .getByRole('button', { name: /Pump Topper 1/ })
    .first()
    .click()
  await expect(page.getByText('LED screen')).toBeVisible()
  await expect(page.getByText('Carica JPEG o PNG')).toBeVisible()
})
