import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { PackageUtil } from "../../utils/packageUtil";
import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { INpmPackageScopes } from "../../definitions/npm/i-npm-package-scopes";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";

describe("PackageUtil", () => {
    const createPackage = (name: string, path: string): INpmPackage => ({
        type: ENpmPackageType.PROJECT,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    describe("getLookupMap", () => {
        it("should create lookup map from packages", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];

            const result = PackageUtil.getLookupMap(packages);

            expect(result["@test/pkg1"]).toEqual(packages[0]);
            expect(result["@test/pkg2"]).toEqual(packages[1]);
        });

        it("should return empty object for empty array", () => {
            const result = PackageUtil.getLookupMap([]);

            expect(result).toEqual({});
        });

        it("should handle single package", () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];

            const result = PackageUtil.getLookupMap(packages);

            expect(Object.keys(result)).toHaveLength(1);
        });
    });

    describe("getPaths", () => {
        it("should extract paths from packages", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];

            const result = PackageUtil.getPaths(packages);

            expect(result).toEqual(["/pkg1", "/pkg2"]);
        });

        it("should return empty array for empty packages", () => {
            const result = PackageUtil.getPaths([]);

            expect(result).toEqual([]);
        });
    });

    describe("getNames", () => {
        it("should extract names from packages", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];

            const result = PackageUtil.getNames(packages);

            expect(result).toEqual(["@test/pkg1", "@test/pkg2"]);
        });

        it("should return empty array for empty packages", () => {
            const result = PackageUtil.getNames([]);

            expect(result).toEqual([]);
        });
    });

    describe("filterByScopes", () => {
        it("should return all packages when no scopes provided", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];

            const result = PackageUtil.filterByScopes(packages, undefined);

            expect(result).toHaveLength(2);
        });

        it("should return all packages when empty scopes provided", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];
            const scopes: INpmPackageScopes = {};

            const result = PackageUtil.filterByScopes(packages, scopes);

            expect(result).toHaveLength(2);
        });

        it("should filter by packageNameScopes", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@other/pkg2", "/pkg2")
            ];
            const scopes: INpmPackageScopes = {
                packageNameScopes: ["@test"]
            };

            const result = PackageUtil.filterByScopes(packages, scopes);

            expect(result).toHaveLength(1);
            expect(result[0].packageJson.name).toBe("@test/pkg1");
        });

        it("should filter by pathScopes", () => {
            const packages = [
                createPackage("@test/pkg1", "/workspace/pkg1"),
                createPackage("@test/pkg2", "/other/pkg2")
            ];
            const scopes: INpmPackageScopes = {
                pathScopes: ["/workspace"]
            };

            const result = PackageUtil.filterByScopes(packages, scopes);

            expect(result).toHaveLength(1);
            expect(result[0].path).toBe("/workspace/pkg1");
        });

        it("should filter by packagePaths", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];
            const scopes: INpmPackageScopes = {
                packagePaths: ["/pkg1"]
            };

            const result = PackageUtil.filterByScopes(packages, scopes);

            expect(result).toHaveLength(1);
            expect(result[0].path).toBe("/pkg1");
        });

        it("should exclude by excludedPackagePaths", () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];
            const scopes: INpmPackageScopes = {
                excludedPackagePaths: ["/pkg1"]
            };

            const result = PackageUtil.filterByScopes(packages, scopes);

            expect(result).toHaveLength(1);
            expect(result[0].path).toBe("/pkg2");
        });

        it("should exclude self package @zaeper/pkgm", () => {
            const packages = [
                createPackage("@zaeper/pkgm", "/pkgm"),
                createPackage("@test/pkg1", "/pkg1")
            ];
            const scopes: INpmPackageScopes = {};

            const result = PackageUtil.filterByScopes(packages, scopes);

            expect(result).toHaveLength(1);
            expect(result[0].packageJson.name).toBe("@test/pkg1");
        });

        it("should combine multiple scope filters", () => {
            const packages = [
                createPackage("@test/pkg1", "/workspace/pkg1"),
                createPackage("@test/pkg2", "/workspace/pkg2"),
                createPackage("@other/pkg3", "/workspace/pkg3")
            ];
            const scopes: INpmPackageScopes = {
                packageNameScopes: ["@test"],
                pathScopes: ["/workspace"]
            };

            const result = PackageUtil.filterByScopes(packages, scopes);

            expect(result).toHaveLength(2);
        });
    });

    describe("pruneUnusedNpmPackageScopes", () => {
        it("should keep only scopes that match packages", () => {
            const packages = [
                createPackage("@test/pkg1", "/workspace/pkg1")
            ];
            const scopes: INpmPackageScopes = {
                pathScopes: ["/workspace", "/nonexistent"],
                packageNameScopes: ["@test", "@nonexistent"]
            };

            const result = PackageUtil.pruneUnusedNpmPackageScopes(packages, scopes);

            expect(result.pathScopes).toEqual(["/workspace"]);
            expect(result.packageNameScopes).toEqual(["@test"]);
        });

        it("should handle empty packages", () => {
            const scopes: INpmPackageScopes = {
                pathScopes: ["/workspace"],
                packageNameScopes: ["@test"]
            };

            const result = PackageUtil.pruneUnusedNpmPackageScopes([], scopes);

            expect(result.pathScopes).toEqual([]);
            expect(result.packageNameScopes).toEqual([]);
        });

        it("should handle undefined scopes", () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const scopes: INpmPackageScopes = {};

            const result = PackageUtil.pruneUnusedNpmPackageScopes(packages, scopes);

            expect(result.pathScopes).toEqual([]);
            expect(result.packageNameScopes).toEqual([]);
        });

        it("should prune packagePaths that dont match", () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const scopes: INpmPackageScopes = {
                packagePaths: ["/pkg1", "/nonexistent"]
            };

            const result = PackageUtil.pruneUnusedNpmPackageScopes(packages, scopes);

            expect(result.packagePaths).toEqual(["/pkg1"]);
        });

        it("should prune excludedPackagePaths that dont match", () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const scopes: INpmPackageScopes = {
                excludedPackagePaths: ["/pkg1", "/nonexistent"]
            };

            const result = PackageUtil.pruneUnusedNpmPackageScopes(packages, scopes);

            expect(result.excludedPackagePaths).toEqual(["/pkg1"]);
        });
    });
});
