import { describe, expect, it } from "@jest/globals";
import { PathUtil } from "../../utils/path.util";

describe("PathUtil", () => {
    it("normalizes Windows backslashes to forward slashes", () => {
        expect(PathUtil.normalize("C:\\Users\\dev\\project")).toBe("C:/Users/dev/project");
        expect(PathUtil.normalize("libs\\core\\src")).toBe("libs/core/src");
    });

    it("joins paths with consistent separators", () => {
        expect(PathUtil.join("/workspace", "libs", "core")).toBe("/workspace/libs/core");
        expect(PathUtil.join("a\\b", "c")).toMatch(/a\/b\/c/);
    });

    it("computes relative paths for symlink creation", () => {
        expect(PathUtil.relative("/workspace/apps/web", "/workspace/libs/core"))
            .toBe("../../libs/core");
    });
});
