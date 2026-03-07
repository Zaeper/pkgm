import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { ExecutionService } from "../../services/execution.service";
import { ECommandType } from "../../definitions/e-command-type";
import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";

describe("ExecutionService", () => {
    let executionService: ExecutionService;

    const createPackage = (
        name: string,
        path: string,
        scripts: Record<string, string> = {}
    ): INpmPackage => ({
        type: ENpmPackageType.PROJECT,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name, scripts },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    beforeEach(() => {
        executionService = new ExecutionService();
    });

    describe("executeScript", () => {
        it("should skip npm script if not found in package.json", async () => {
            const pkg = createPackage("@test/pkg1", "/pkg1", {});

            await expect(
                executionService.executeScript([pkg], "build", ECommandType.NPM_SCRIPT, "npm")
            ).resolves.not.toThrow();
        });

        it("should handle empty targets array", async () => {
            await expect(
                executionService.executeScript([], "build", ECommandType.NPM_SCRIPT, "npm")
            ).resolves.not.toThrow();
        });
    });

    describe("assembleNPMScript (private)", () => {
        it("should assemble npm command correctly", () => {
            const result = executionService["_assembleNPMScript"]("npm", "install", ECommandType.NPM);
            expect(result).toBe("npm install");
        });

        it("should assemble npm script command correctly", () => {
            const result = executionService["_assembleNPMScript"]("npm", "build", ECommandType.NPM_SCRIPT);
            expect(result).toBe("npm run build");
        });

        it("should work with pnpm client", () => {
            const result = executionService["_assembleNPMScript"]("pnpm", "install", ECommandType.NPM);
            expect(result).toBe("pnpm install");
        });

        it("should work with yarn client", () => {
            const result = executionService["_assembleNPMScript"]("yarn", "build", ECommandType.NPM_SCRIPT);
            expect(result).toBe("yarn run build");
        });

        it("should work with bun client", () => {
            const result = executionService["_assembleNPMScript"]("bun", "test", ECommandType.NPM_SCRIPT);
            expect(result).toBe("bun run test");
        });
    });

    describe("assembleTerminalScript (private)", () => {
        it("should return command as-is", () => {
            const result = executionService["_assembleTerminalScript"]("ls -la");
            expect(result).toBe("ls -la");
        });

        it("should handle complex commands", () => {
            const result = executionService["_assembleTerminalScript"]("git status && git diff");
            expect(result).toBe("git status && git diff");
        });
    });
});
