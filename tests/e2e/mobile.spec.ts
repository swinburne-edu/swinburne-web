import { expect, test } from '@playwright/test'

test.describe('Mobile', () => {
  test('không tràn ngang, menu mở/đóng, CTA mở form', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    const toggle = page.getByRole('button', { name: 'Menu' })
    await toggle.click()
    await expect(page.getByRole('button', { name: 'Đóng menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    await page.locator('a[data-lead-dialog]').last().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByLabel(/Họ và tên/)).toBeVisible()
  })

  test('/en trên mobile', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('h1')).toHaveCount(1)
  })
})
