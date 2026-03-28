import { test, expect } from "@playwright/test"

test("homepage drives the visitor into signup", async ({ page }) => {
  await page.goto("/?utm_source=meta&utm_campaign=ads-creator")

  await expect(
    page.getByRole("heading", {
      name: /Descubra quem pode vender seu produto antes de investir pesado em ads/i,
    })
  ).toBeVisible()

  await expect(page.getByText(/Veja quanto uma campanha com creators pode devolver/i)).toBeVisible()

  await page.getByRole("link", { name: /Comecar gratis/i }).first().click()
  await expect(page).toHaveURL(/\/signup\?utm_source=meta&utm_campaign=ads-creator/)
  await expect(page.getByRole("heading", { name: /Criar Conta/i })).toBeVisible()
})

test("auth links preserve campaign context across the funnel", async ({ page }) => {
  await page.goto("/login?utm_source=google&utm_medium=cpc&utm_campaign=brand-search")

  await expect(page.getByRole("link", { name: /Criar conta gratis/i })).toHaveAttribute(
    "href",
    /\/signup\?utm_source=google&utm_medium=cpc&utm_campaign=brand-search/
  )

  await page.getByRole("link", { name: /Esqueci minha senha/i }).click()
  await expect(page).toHaveURL(/\/forgot-password\?utm_source=google&utm_medium=cpc&utm_campaign=brand-search/)

  await expect(page.getByRole("link", { name: /Voltar ao login/i })).toHaveAttribute(
    "href",
    /\/login\?utm_source=google&utm_medium=cpc&utm_campaign=brand-search/
  )
})

test("roi calculator updates projected revenue", async ({ page }) => {
  await page.goto("/")

  const revenueCard = page.getByText("Faturamento potencial", { exact: true }).locator("..")
  const initialCardText = await revenueCard.textContent()
  await expect(revenueCard).toContainText("R$")

  await page.getByLabel("Creators ativados").fill("24")
  await page.getByLabel("Ticket medio").fill("249")
  await page.getByLabel("Conversao do trafego (%)").fill("3.8")

  await expect(revenueCard).toContainText("R$")
  await expect(revenueCard).not.toHaveText(initialCardText || "")
})
