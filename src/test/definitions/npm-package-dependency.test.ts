import { describe, expect, it } from "@jest/globals";
import {
    NpmPackageDependency,
    INpmPackageDependencyVersionEntry
} from "../../definitions/npm/npm-package-dependency";

describe("NpmPackageDependency", () => {
    const createVersionEntry = (
        version: string,
        peerDependencies: Record<string, { version: string; isOptional: boolean }> = {},
        bins: Record<string, string> = {},
        deprecated?: string
    ): INpmPackageDependencyVersionEntry => ({
        version,
        peerDependencies,
        bins,
        deprecated
    });

    describe("constructor and getters", () => {
        it("should return name", () => {
            const versionEntries = [createVersionEntry("1.0.0")];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "package.json");

            expect(dependency.name).toBe("lodash");
        });

        it("should return isTypeDeclarationPackage", () => {
            const versionEntries = [createVersionEntry("1.0.0")];
            const dependency = new NpmPackageDependency("@types/node", versionEntries, true, "package.json");

            expect(dependency.isTypeDeclarationPackage).toBe(true);
        });

        it("should return addedBy", () => {
            const versionEntries = [createVersionEntry("1.0.0")];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "react");

            expect(dependency.addedBy).toBe("react");
        });

        it("should return versions array", () => {
            const versionEntries = [
                createVersionEntry("2.0.0"),
                createVersionEntry("1.5.0"),
                createVersionEntry("1.0.0")
            ];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "package.json");

            expect(dependency.versions).toEqual(["2.0.0", "1.5.0", "1.0.0"]);
        });

        it("should return versionEntries", () => {
            const versionEntries = [
                createVersionEntry("1.0.0"),
                createVersionEntry("2.0.0")
            ];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "package.json");

            expect(dependency.versionEntries).toHaveLength(2);
        });
    });

    describe("version filtering and sorting", () => {
        it("should filter out prerelease versions", () => {
            const versionEntries = [
                createVersionEntry("2.0.0"),
                createVersionEntry("2.0.0-beta.1"),
                createVersionEntry("1.0.0-alpha"),
                createVersionEntry("1.0.0")
            ];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "package.json");

            expect(dependency.versions).toEqual(["2.0.0", "1.0.0"]);
        });

        it("should sort versions in descending order", () => {
            const versionEntries = [
                createVersionEntry("1.0.0"),
                createVersionEntry("3.0.0"),
                createVersionEntry("2.0.0")
            ];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "package.json");

            expect(dependency.versions).toEqual(["3.0.0", "2.0.0", "1.0.0"]);
        });

        it("should handle minor and patch version sorting", () => {
            const versionEntries = [
                createVersionEntry("1.0.1"),
                createVersionEntry("1.2.0"),
                createVersionEntry("1.1.0"),
                createVersionEntry("1.0.0")
            ];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "package.json");

            expect(dependency.versions).toEqual(["1.2.0", "1.1.0", "1.0.1", "1.0.0"]);
        });

        it("should handle empty version entries", () => {
            const dependency = new NpmPackageDependency("lodash", [], false, "package.json");

            expect(dependency.versions).toEqual([]);
            expect(dependency.versionEntries).toEqual([]);
        });

        it("should handle versions with rc suffix", () => {
            const versionEntries = [
                createVersionEntry("2.0.0"),
                createVersionEntry("2.0.0-rc.1"),
                createVersionEntry("1.0.0")
            ];
            const dependency = new NpmPackageDependency("lodash", versionEntries, false, "package.json");

            expect(dependency.versions).toEqual(["2.0.0", "1.0.0"]);
        });
    });

    describe("version entries preservation", () => {
        it("should preserve peerDependencies in version entries", () => {
            const versionEntries = [
                createVersionEntry("1.0.0", {
                    react: { version: "^18.0.0", isOptional: false }
                })
            ];
            const dependency = new NpmPackageDependency("react-dom", versionEntries, false, "package.json");

            expect(dependency.versionEntries[0].peerDependencies.react).toBeDefined();
            expect(dependency.versionEntries[0].peerDependencies.react.version).toBe("^18.0.0");
        });

        it("should preserve bins in version entries", () => {
            const versionEntries = [
                createVersionEntry("1.0.0", {}, { typescript: "bin/tsc" })
            ];
            const dependency = new NpmPackageDependency("typescript", versionEntries, false, "package.json");

            expect(dependency.versionEntries[0].bins.typescript).toBe("bin/tsc");
        });

        it("should preserve deprecated field in version entries", () => {
            const versionEntries = [
                createVersionEntry("1.0.0", {}, {}, "This version is deprecated")
            ];
            const dependency = new NpmPackageDependency("old-package", versionEntries, false, "package.json");

            expect(dependency.versionEntries[0].deprecated).toBe("This version is deprecated");
        });
    });
});
