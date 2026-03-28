import { describe, expect, it } from "vitest"
import {
  buildTrackedClientPath,
  mergeMarketingAttribution,
  parseMarketingSearch,
  sanitizeMarketingAttribution,
  serializeMarketingAttribution,
} from "@/lib/marketing-attribution"

describe("marketing attribution helpers", () => {
  it("keeps only supported tracking keys", () => {
    expect(
      sanitizeMarketingAttribution({
        utm_source: "meta",
        utm_campaign: "creator-q2",
        random: "drop-me",
      })
    ).toEqual({
      utm_source: "meta",
      utm_campaign: "creator-q2",
    })
  })

  it("parses and serializes campaign params without noise", () => {
    const attribution = parseMarketingSearch("?utm_source=google&utm_medium=cpc&other=skip")

    expect(attribution).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
    })
    expect(serializeMarketingAttribution(attribution)).toBe("utm_source=google&utm_medium=cpc")
  })

  it("prefers newer values when merging attribution sources", () => {
    expect(
      mergeMarketingAttribution(
        { utm_source: "meta", utm_campaign: "old-campaign" },
        { utm_campaign: "new-campaign", gclid: "g-123" }
      )
    ).toEqual({
      utm_source: "meta",
      utm_campaign: "new-campaign",
      gclid: "g-123",
    })
  })

  it("builds tracked paths for auth transitions", () => {
    expect(
      buildTrackedClientPath("/forgot-password", {
        utm_source: "meta",
        utm_campaign: "retargeting",
      })
    ).toBe("/forgot-password?utm_source=meta&utm_campaign=retargeting")
  })
})
