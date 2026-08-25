import { test, expect } from '@playwright/test'
test('seleziona un media point e mostra il dettaglio upload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('Station Media 3D Planner')).toBeVisible()
  await page
    .getByRole('button', { name: /Sovrapompa \/ Cappuccio/ })
    .first()
    .click()
  await expect(page.getByText('1600 × 400 mm')).toBeVisible()
  await expect(page.getByText('Carica JPEG o PNG')).toBeVisible()
})
