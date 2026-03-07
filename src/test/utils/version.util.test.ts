import { describe, expect, it } from "@jest/globals";
import { VersionUtil } from "../../utils/version.util";

describe("VersionUtil.getVersionOperator", () => {
    it("preserves caret/tilde operators from the original range", () => {
        expect(VersionUtil.getVersionOperator("1.0.0", "^1.0.0")).toBe("^");
        expect(VersionUtil.getVersionOperator("1.0.0", "~1.0.0")).toBe("~");
    });

    it("defaults to caret for exact or greater-than ranges", () => {
        expect(VersionUtil.getVersionOperator("1.0.0", "1.0.0")).toBe("^");
        expect(VersionUtil.getVersionOperator("1.0.0", ">0.9.0")).toBe("^");
    });

    it("returns null when version is outside the range", () => {
        expect(VersionUtil.getVersionOperator("2.0.0", "^1.0.0")).toBeNull();
    });

    it("picks caret for ranges allowing minor bumps", () => {
        expect(VersionUtil.getVersionOperator("1.0.0", ">=1.0.0 <2.0.0")).toBe("^");
    });

    it("rejects garbage input", () => {
        expect(() => VersionUtil.getVersionOperator("not-a-version", "^1.0.0")).toThrow();
        expect(() => VersionUtil.getVersionOperator("1.0.0", "wat")).toThrow();
    });
});
