import { describe, expect, it } from "@jest/globals";
import { LoggerUtil } from "../../utils/logger.util";

describe("LoggerUtil", () => {
    describe("printTitle", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printTitle("Test Title")).not.toThrow();
        });
    });

    describe("printNote", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printNote("Test note")).not.toThrow();
        });
    });

    describe("printWarning", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printWarning("Test warning")).not.toThrow();
        });
    });

    describe("printSection", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printSection("Test section")).not.toThrow();
        });
    });

    describe("printInfo", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printInfo("Test info")).not.toThrow();
        });
    });

    describe("printHint", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printHint("Test hint")).not.toThrow();
        });
    });

    describe("printImportantHint", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printImportantHint("Important hint")).not.toThrow();
        });
    });

    describe("printOutputTitle", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printOutputTitle("Output title")).not.toThrow();
        });
    });

    describe("printSuccess", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printSuccess("Success")).not.toThrow();
        });
    });

    describe("printAction", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printAction("Action")).not.toThrow();
        });
    });

    describe("printSeparator", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printSeparator()).not.toThrow();
        });
    });

    describe("printStep", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printStep("Step")).not.toThrow();
        });
    });

    describe("printCommand", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printCommand("pkgm list")).not.toThrow();
        });
    });

    describe("printIndented", () => {
        it("should not throw with default level", () => {
            expect(() => LoggerUtil.printIndented("text")).not.toThrow();
        });

        it("should not throw with specified level", () => {
            expect(() => LoggerUtil.printIndented("text", 3)).not.toThrow();
        });

        it("should handle multiline text", () => {
            expect(() => LoggerUtil.printIndented("line1\nline2\nline3", 2)).not.toThrow();
        });
    });

    describe("printSpacingLg", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printSpacingLg()).not.toThrow();
        });
    });

    describe("printSpacing", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printSpacing()).not.toThrow();
        });
    });

    describe("printWhite", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printWhite("white text")).not.toThrow();
        });
    });

    describe("printYellow", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printYellow("yellow text")).not.toThrow();
        });
    });

    describe("printRed", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printRed("red text")).not.toThrow();
        });
    });

    describe("printPromptTitle", () => {
        it("should not throw", () => {
            expect(() => LoggerUtil.printPromptTitle("Prompt")).not.toThrow();
        });
    });

    describe("printProject", () => {
        it("should not throw", () => {
            const mockPackage = {
                type: "Project" as const,
                path: "/test/path",
                packageJsonPath: "/test/path/package.json",
                packageJson: { name: "@test/project" },
                packageLockJson: null,
                packageLockJsonPath: undefined,
                nodeModulesPath: undefined
            };
            expect(() => LoggerUtil.printProject(mockPackage as any)).not.toThrow();
        });
    });
});
