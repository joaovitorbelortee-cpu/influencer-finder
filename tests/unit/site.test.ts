import { describe, expect, it } from "vitest"
import { buildTrackedPath } from "@/lib/site"

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
})
