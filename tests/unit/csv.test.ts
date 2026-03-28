import { describe, expect, it } from "vitest"
import { escapeCsvField } from "@/lib/csv"

describe("escapeCsvField", () => {
  it("quotes values and escapes inner quotes", () => {
    expect(escapeCsvField('Creator "A"')).toBe('"Creator ""A"""')
  })

  it("neutralizes spreadsheet formulas", () => {
    expect(escapeCsvField("=2+2")).toBe('"\'=2+2"')
  })

  it("replaces line breaks with spaces", () => {
    expect(escapeCsvField("linha 1\nlinha 2")).toBe('"linha 1 linha 2"')
  })
})
