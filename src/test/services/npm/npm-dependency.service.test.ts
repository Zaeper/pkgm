import { describe, expect, it, beforeEach } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { NpmDependencyService } from "../../../services/npm/npm-dependency.service";
import { INpmPackage } from "../../../definitions/npm/i-npm-package";
import { NpmPackageCollection } from "../../../definitions/npm-package-collection";
import { ENpmPackageType } from "../../../definitions/npm/e-npm-package-type";
import { INpmProject } from "../../../definitions/npm/i-npm-project";
import { INpmWorkspace } from "../../../definitions/npm/i-npm-workspace";

describe("NpmDependencyService", () => {
    let npmDependencyService: NpmDependencyService;

    const createProject = (
        name: string,
        path: string,
        dependencies: Record<string, string> = {},
        devDependencies: Record<string, string> = {},
        peerDependencies: Record<string, string> = {}
    ): INpmProject => ({
        type: ENpmPackageType.PROJECT,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: {
            name,
            dependencies,
            devDependencies,
            peerDependencies
        },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    const createWorkspace = (
        name: string,
        path: string,
        dependencies: Record<string, string> = {},
        devDependencies: Record<string, string> = {},
        peerDependencies: Record<string, string> = {}
    ): INpmWorkspace => ({
        type: ENpmPackageType.WORKSPACE,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: {
            name,
            dependencies,
            devDependencies,
            peerDependencies
        },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    beforeEach(() => {
        npmDependencyService = new NpmDependencyService();
    });

    describe("getNpmPackageInternalDependencies", () => {
        it("should return internal dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {
                "@test/pkg2": "1.0.0",
                "lodash": "4.17.21"
            });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );

            const result = npmDependencyService.getNpmPackageInternalDependencies(pkg, collection);

            expect(result).toEqual({ "@test/pkg2": "1.0.0" });
        });

        it("should return empty object when no internal dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", { lodash: "4.17.21" });
            const collection = new NpmPackageCollection([pkg], []);

            const result = npmDependencyService.getNpmPackageInternalDependencies(pkg, collection);

            expect(result).toEqual({});
        });

        it("should handle undefined dependencies", () => {
            const pkg: INpmProject = {
                type: ENpmPackageType.PROJECT,
                path: "/pkg1",
                packageJsonPath: "/pkg1/package.json",
                packageJson: { name: "@test/pkg1" },
                packageLockJson: null,
                packageLockJsonPath: undefined,
                nodeModulesPath: undefined
            };
            const collection = new NpmPackageCollection([pkg], []);

            const result = npmDependencyService.getNpmPackageInternalDependencies(pkg, collection);

            expect(result).toEqual({});
        });
    });

    describe("getNpmPackageDependencies", () => {
        it("should return all dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", { lodash: "4.17.21" });

            const result = npmDependencyService.getNpmPackageDependencies(pkg);

            expect(result).toEqual({ lodash: "4.17.21" });
        });

        it("should return empty object when no dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1");

            const result = npmDependencyService.getNpmPackageDependencies(pkg);

            expect(result).toEqual({});
        });
    });

    describe("getNpmPackageExternalDependencies", () => {
        it("should return only external dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {
                "@test/pkg2": "1.0.0",
                "lodash": "4.17.21"
            });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );

            const result = npmDependencyService.getNpmPackageExternalDependencies(pkg, collection);

            expect(result).toEqual({ lodash: "4.17.21" });
        });
    });

    describe("getNpmPackagePeerInternalDependencies", () => {
        it("should return internal peer dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, {}, {
                "@test/pkg2": "^1.0.0",
                "react": "^18.0.0"
            });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );

            const result = npmDependencyService.getNpmPackagePeerInternalDependencies(pkg, collection);

            expect(result).toEqual({ "@test/pkg2": "^1.0.0" });
        });
    });

    describe("getNpmPackagePeerDependencies", () => {
        it("should return all peer dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, {}, {
                react: "^18.0.0"
            });

            const result = npmDependencyService.getNpmPackagePeerDependencies(pkg);

            expect(result).toEqual({ react: "^18.0.0" });
        });
    });

    describe("getNpmPackagePeerExternalDependencies", () => {
        it("should return only external peer dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, {}, {
                "@test/pkg2": "^1.0.0",
                "react": "^18.0.0"
            });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );

            const result = npmDependencyService.getNpmPackagePeerExternalDependencies(pkg, collection);

            expect(result).toEqual({ react: "^18.0.0" });
        });
    });

    describe("getNpmPackageDevInternalDependencies", () => {
        it("should return internal dev dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, {
                "@test/pkg2": "1.0.0",
                "jest": "29.0.0"
            });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );

            const result = npmDependencyService.getNpmPackageDevInternalDependencies(pkg, collection);

            expect(result).toEqual({ "@test/pkg2": "1.0.0" });
        });
    });

    describe("getNpmPackageDevDependencies", () => {
        it("should return all dev dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, { jest: "29.0.0" });

            const result = npmDependencyService.getNpmPackageDevDependencies(pkg);

            expect(result).toEqual({ jest: "29.0.0" });
        });
    });

    describe("getNpmPackageDevExternalDependencies", () => {
        it("should return only external dev dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, {
                "@test/pkg2": "1.0.0",
                "jest": "29.0.0"
            });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );

            const result = npmDependencyService.getNpmPackageDevExternalDependencies(pkg, collection);

            expect(result).toEqual({ jest: "29.0.0" });
        });
    });

    describe("getSummarizedNpmPackageInternalDependencies", () => {
        it("should combine all internal dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1",
                { "@test/pkg2": "1.0.0" },
                { "@test/pkg3": "2.0.0" },
                { "@test/pkg4": "3.0.0" }
            );
            const collection = new NpmPackageCollection([
                pkg,
                createProject("@test/pkg2", "/pkg2"),
                createProject("@test/pkg3", "/pkg3"),
                createProject("@test/pkg4", "/pkg4")
            ], []);

            const result = npmDependencyService.getSummarizedNpmPackageInternalDependencies(pkg, collection);

            expect(result).toEqual({
                "@test/pkg2": "1.0.0",
                "@test/pkg3": "2.0.0",
                "@test/pkg4": "3.0.0"
            });
        });
    });

    describe("getSummarizedNpmPackageExternalDependencies", () => {
        it("should combine all external dependencies", () => {
            const pkg = createProject("@test/pkg1", "/pkg1",
                { lodash: "4.17.21" },
                { jest: "29.0.0" },
                { react: "18.0.0" }
            );
            const collection = new NpmPackageCollection([pkg], []);

            const result = npmDependencyService.getSummarizedNpmPackageExternalDependencies(pkg, collection);

            expect(result).toEqual({
                lodash: "4.17.21",
                jest: "29.0.0",
                react: "18.0.0"
            });
        });
    });

    describe("getSortedNpmPackagesByInternalDependencies", () => {
        it("should return single package as-is", () => {
            const pkg = createProject("@test/pkg1", "/pkg1");
            const collection = new NpmPackageCollection([pkg], []);

            const result = npmDependencyService.getSortedNpmPackagesByInternalDependencies(collection, collection);

            expect(result).toHaveLength(1);
            expect(result[0].packageJson.name).toBe("@test/pkg1");
        });

        it("should sort packages with no dependencies first", () => {
            const pkg1 = createProject("@test/pkg1", "/pkg1", { "@test/pkg2": "1.0.0" });
            const pkg2 = createProject("@test/pkg2", "/pkg2");
            const collection = new NpmPackageCollection([pkg1, pkg2], []);

            const result = npmDependencyService.getSortedNpmPackagesByInternalDependencies(collection, collection);

            expect(result[0].packageJson.name).toBe("@test/pkg2");
            expect(result[1].packageJson.name).toBe("@test/pkg1");
        });

        it("should handle complex dependency chains", () => {
            const pkg1 = createProject("@test/pkg1", "/pkg1", {
                "@test/pkg2": "1.0.0",
                "@test/pkg3": "1.0.0"
            });
            const pkg2 = createProject("@test/pkg2", "/pkg2", { "@test/pkg3": "1.0.0" });
            const pkg3 = createProject("@test/pkg3", "/pkg3");
            const collection = new NpmPackageCollection([pkg1, pkg2, pkg3], []);

            const result = npmDependencyService.getSortedNpmPackagesByInternalDependencies(collection, collection);

            expect(result[0].packageJson.name).toBe("@test/pkg3");
            expect(result[1].packageJson.name).toBe("@test/pkg2");
            expect(result[2].packageJson.name).toBe("@test/pkg1");
        });

        it("should include workspaces before their projects", () => {
            const project = createProject("@test/pkg1", "/workspace/pkg1");
            const workspace = createWorkspace("@test/workspace", "/workspace");
            const collection = new NpmPackageCollection([project], [workspace]);

            const result = npmDependencyService.getSortedNpmPackagesByInternalDependencies(collection, collection);

            const workspaceIndex = result.findIndex(p => p.packageJson.name === "@test/workspace");
            const projectIndex = result.findIndex(p => p.packageJson.name === "@test/pkg1");

            expect(workspaceIndex).toBeLessThan(projectIndex);
        });

        it("should filter to scoped collection", () => {
            const pkg1 = createProject("@test/pkg1", "/pkg1");
            const pkg2 = createProject("@test/pkg2", "/pkg2");
            const scopedCollection = new NpmPackageCollection([pkg1], []);
            const unscopedCollection = new NpmPackageCollection([pkg1, pkg2], []);

            const result = npmDependencyService.getSortedNpmPackagesByInternalDependencies(scopedCollection, unscopedCollection);

            expect(result).toHaveLength(1);
            expect(result[0].packageJson.name).toBe("@test/pkg1");
        });
    });
});
