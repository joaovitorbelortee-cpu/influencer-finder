import { afterEach, describe, expect, it } from "vitest"
import { buildTrackedPath, getSiteUrl } from "@/lib/site"

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL
const originalVercelUrl = process.env.VERCEL_URL

afterEach(() => {
  if (originalAppUrl) {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
  } else {
    delete process.env.NEXT_PUBLIC_APP_URL
  }

  if (originalVercelUrl) {
    process.env.VERCEL_URL = originalVercelUrl
  } else {
    delete process.env.VERCEL_URL
  }
})

describe("buildTrackedPath", () => {
  it("preserves only known campaign parameters", () => {
    const href = buildTrackedPath("/signup", {
      utm_source: "meta",
      utm_campaign: "creator-q2",
      ref: "ignored",
      random: "drop-me",
    })

    expect(href).toBe("/signup?utm_source=meta&utm_campaign=creator-q2")
  })

  it("returns the base path when no marketing params are present", () => {
    expect(buildTrackedPath("/login", {})).toBe("/login")
  })

  it("prefers NEXT_PUBLIC_APP_URL when available", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"
    process.env.VERCEL_URL = "preview-example.vercel.app"

    expect(getSiteUrl()).toBe("https://app.example.com")
  })

  it("falls back to the current Vercel preview URL", () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    process.env.VERCEL_URL = "preview-example.vercel.app"

    expect(getSiteUrl()).toBe("https://preview-example.vercel.app")
  })
})
