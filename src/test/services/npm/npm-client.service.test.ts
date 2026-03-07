import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { NpmClientService } from "../../../services/npm/npm-client.service";

describe("NpmClientService", () => {
    let npmClientService: NpmClientService;

    beforeEach(() => {
        npmClientService = new NpmClientService();
    });

    describe("installNpmClient", () => {
        it("should not throw for npm client", async () => {
            await expect(npmClientService.installNpmClient("npm")).resolves.not.toThrow();
        });
    });

    describe("_executeTerminalCommand", () => {
        it("should be a function", () => {
            expect(typeof npmClientService["_executeTerminalCommand"]).toBe("function");
        });
    });
});
