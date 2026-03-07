import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { JsonUtil } from "../../utils/json.util";
import fs from "fs";

jest.mock("fs");

describe("JsonUtil.readJson", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("parses package.json style files", () => {
        const pkg = { name: "@zaeper/test", version: "1.0.0", dependencies: { lodash: "^4.17.0" } };
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(pkg));

        const result = JsonUtil.readJson<typeof pkg>("/project/package.json");

        expect(result.name).toBe("@zaeper/test");
        expect(result.dependencies.lodash).toBe("^4.17.0");
    });

    it("throws on malformed JSON with helpful context", () => {
        (fs.readFileSync as jest.Mock).mockReturnValue("{ broken");

        expect(() => JsonUtil.readJson("/bad.json")).toThrow();
    });

    it("throws when file missing", () => {
        (fs.readFileSync as jest.Mock).mockImplementation(() => {
            throw new Error("ENOENT: no such file or directory");
        });

        expect(() => JsonUtil.readJson("/nope.json")).toThrow(/ENOENT/);
    });
});
