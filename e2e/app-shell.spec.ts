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
  await expect(page.getByText('Carica JPEG, PNG o PDF')).toBeVisible()
})

test('ordina i supporti secondo la sequenza della journey', async ({ page }) => {
  await page.goto('/')
  const inventory = page.locator('aside').getByRole('button', { name: /ID / })

  await expect(inventory).toHaveCount(9)
  await expect(inventory.nth(0)).toContainText('1')
  await expect(inventory.nth(0)).toContainText('Beach Flag')
  await expect(inventory.nth(1)).toContainText('2')
  await expect(inventory.nth(1)).toContainText('Stendardo')
})
