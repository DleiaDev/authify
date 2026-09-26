import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1")
  })

  it("drops falsy values and keeps truthy object keys", () => {
    expect(cn("base", false, null, undefined, "", { active: true, hidden: false })).toBe(
      "base active",
    )
  })

  it("lets a later Tailwind class override a conflicting earlier one", () => {
    expect(cn("px-2 py-1 bg-red-500", "px-4", "bg-blue-500")).toBe("py-1 px-4 bg-blue-500")
  })
})
