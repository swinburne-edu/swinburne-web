import { expect, test } from '@playwright/test'

/** Cần dữ liệu seed (pnpm seed --reset). */

test.describe('Trang chủ & menu', () => {
  test('vi: đúng một h1, menu 7 mục, header/footer', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Swinburne/)
    await expect(page.locator('h1')).toHaveCount(1)
    const nav = page.getByRole('navigation', { name: 'Menu' }).first()
    await expect(nav.locator(':scope > ul > li')).toHaveCount(7)
    await expect(page.locator('footer')).toContainText('Số 80 Duy Tân')
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  })

  test('điều hướng qua menu tới trang chương trình', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Menu' })
      .first()
      .getByRole('link', { name: 'Chương trình', exact: true })
      .click()
    await expect(page).toHaveURL(/\/chuong-trinh$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chương trình')
    await page.getByRole('link', { name: 'Chương trình Cử nhân' }).first().click()
    await expect(page).toHaveURL(/\/chuong-trinh\/cu-nhan$/)
    await expect(page.getByText('Đã hết hiệu lực')).toBeVisible()
  })

  test('JSON-LD tổ chức có 5 cơ sở', async ({ page }) => {
    await page.goto('/')
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const org = blocks
      .map((b) => JSON.parse(b) as Record<string, unknown>)
      .find((b) => b['@type'] === 'CollegeOrUniversity')
    expect(org).toBeTruthy()
    expect((org!.location as unknown[]).length).toBe(5)
  })
})

test.describe('Đổi ngôn ngữ', () => {
  test('giữ đúng trang tương ứng khi có bản dịch', async ({ page }) => {
    await page.goto('/chuong-trinh/cu-nhan')
    await page.getByRole('link', { name: /EN/ }).click()
    await expect(page).toHaveURL(/\/en\/programs\/bachelor$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.getByRole('link', { name: /VI/ }).click()
    await expect(page).toHaveURL(/\/chuong-trinh\/cu-nhan$/)
  })

  test('hreflang chỉ có khi đủ bản dịch', async ({ page }) => {
    await page.goto('/chuong-trinh/cu-nhan')
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1)
    // Sự kiện chỉ có bản tiếng Việt
    await page.goto('/su-kien/tham-quan-co-so-hoa-lac-mau-chi-tieng-viet')
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0)
  })
})

test.describe('Tin tức', () => {
  test('danh sách, phân trang, lọc chuyên mục, lưu trữ', async ({ page }) => {
    await page.goto('/tin-tuc')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tin tức')
    await expect(page.locator('main article')).toHaveCount(12)
    await page
      .getByRole('navigation', { name: 'Phân trang' })
      .getByRole('link', { name: 'Trang 2' })
      .click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Trang 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.goto('/tin-tuc?category=tuyen-sinh')
    await expect(
      page
        .getByRole('navigation', { name: 'Chuyên mục' })
        .getByRole('link', { name: 'Tuyển sinh', exact: true }),
    ).toHaveAttribute('aria-current', 'page')

    await page.goto('/tin-tuc/luu-tru')
    await expect(page.getByText('tin cũ').first()).toBeVisible()
  })

  test('trang chủ không hiện bài lưu trữ', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('tin cũ')).toHaveCount(0)
  })

  test('bài viết có NewsArticle JSON-LD và nội dung trong HTML server', async ({ request }) => {
    const res = await request.get('/tin-tuc/swinburne-viet-nam-khai-giang-hoc-ky-moi-mau')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toContain('"@type":"NewsArticle"')
    expect(html).toContain('Đoạn văn mẫu thứ nhất')
  })
})

test.describe('Form đăng ký tư vấn', () => {
  test('gửi form → lead lưu và tới mock CRM, kèm UTM', async ({ page, request }) => {
    const unique = `E2E ${Date.now()}`
    await page.goto('/dang-ky-tu-van?utm_source=e2e&utm_campaign=playwright')
    const form = page.locator('main form')
    await form.getByLabel(/Họ và tên/).fill(unique)
    await form.getByLabel(/Số điện thoại/).fill('0912 000 111')
    await form.getByLabel('Email', { exact: true }).fill('e2e@example.test')
    await form.getByLabel('Cơ sở').selectOption('Đà Nẵng')
    await form.getByLabel(/Tôi đồng ý/).check()
    await form.getByRole('button', { name: 'Gửi đăng ký' }).click()
    await expect(page.getByRole('status')).toContainText('Cảm ơn', { timeout: 30_000 })

    await expect
      .poll(
        async () => {
          const res = await request.get('http://localhost:4010/api/leads')
          const json = (await res.json()) as {
            leads: { lead: { fullName: string; utmSource: string | null } }[]
          }
          return json.leads.find((l) => l.lead.fullName === unique)?.lead.utmSource ?? null
        },
        { timeout: 20_000 },
      )
      .toBe('e2e')
  })

  test('báo lỗi khi bỏ trống, có thông báo cho trình đọc màn hình', async ({ page }) => {
    await page.goto('/dang-ky-tu-van')
    const form = page.locator('main form')
    await form.getByRole('button', { name: 'Gửi đăng ký' }).click()
    await expect(form.getByLabel(/Họ và tên/)).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByText('Vui lòng nhập họ tên')).toBeVisible()
  })
})

test.describe('SEO kỹ thuật', () => {
  test('redirect mẫu trả 301', async ({ request }) => {
    const res = await request.get('/2021/05/bai-viet-cu/', { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(res.headers().location).toContain('/tin-tuc/')
    const res2 = await request.get('/gioi-thieu/', { maxRedirects: 0 })
    expect(res2.status()).toBe(301)
    expect(res2.headers().location).toMatch(/\/ve-chung-toi$/)
  })

  test('404 song ngữ', async ({ page }) => {
    const res = await page.goto('/trang-khong-ton-tai')
    expect(res?.status()).toBe(404)
    await expect(page.getByText('Không tìm thấy trang')).toBeVisible()
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('robots.txt và sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('GPTBot')
    expect(robots).toContain('Disallow: /admin')
    expect(robots).toContain('Sitemap:')
    const index = await (await request.get('/sitemap.xml')).text()
    expect(index).toContain('/sitemaps/vi.xml')
    const vi = await (await request.get('/sitemaps/vi.xml')).text()
    expect(vi).toContain('/chuong-trinh/cu-nhan')
    expect(vi).toContain('hreflang="en"')
  })
})
