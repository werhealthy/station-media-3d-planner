import { test, expect } from '@playwright/test'
test('seleziona un media point e mostra il dettaglio upload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('3D Media Experience')).toBeVisible()
  await page
    .getByRole('button', { name: /Sovrapompa \/ Cappuccio/ })
    .first()
    .click()
  await expect(page.getByText('550 × 450 mm')).toBeVisible()
  await page.getByRole('button', { name: 'Carica creatività' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Carica la creatività')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Torna ai dettagli del supporto' }),
  ).toBeVisible()
})

test('ordina i supporti secondo la sequenza della journey', async ({
  page,
}) => {
  await page.goto('/')
  const inventory = page.locator('aside').getByRole('button', { name: /ID / })

  await expect(inventory).toHaveCount(9)
  await expect(inventory.nth(0)).toContainText('1')
  await expect(inventory.nth(0)).toContainText('Beach Flag')
  await expect(inventory.nth(1)).toContainText('2')
  await expect(inventory.nth(1)).toContainText('Stendardo')
})

test('usa giorno, notte, nuvoloso e pioggia come alternative esclusive', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Notte' }).click()
  await expect(page.getByRole('button', { name: 'Notte' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'Pioggia' }).click()
  await expect(page.getByRole('button', { name: 'Notte' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByRole('button', { name: 'Pioggia' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Giorno' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
