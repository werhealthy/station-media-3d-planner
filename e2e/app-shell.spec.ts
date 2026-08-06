import { test, expect } from '@playwright/test'

test('l\'app si avvia e mostra il layout principale', async ({ page }) => {
  await page.goto('/')

  const viewModeNav = page.getByRole('navigation', {
    name: "Modalita' di visualizzazione",
  })

  await expect(page.getByText('Nuovo progetto')).toBeVisible()
  await expect(
    viewModeNav.getByRole('button', { name: 'Overview' }),
  ).toBeVisible()
  await expect(
    viewModeNav.getByRole('button', { name: 'Hotspot' }),
  ).toBeVisible()
  await expect(
    viewModeNav.getByRole('button', { name: 'Walkthrough' }),
  ).toBeVisible()
})

test('cambiare modalita\' aggiorna lo stato attivo', async ({ page }) => {
  await page.goto('/')

  const hotspotButton = page
    .getByRole('navigation', { name: "Modalita' di visualizzazione" })
    .getByRole('button', { name: 'Hotspot' })
  await hotspotButton.click()
  await expect(hotspotButton).toHaveAttribute('aria-pressed', 'true')
})
