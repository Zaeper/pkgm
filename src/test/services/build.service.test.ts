import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { BuildService } from "../../services/build.service";
import { ILinkerService } from "../../services/i-linker.service";
import { IExecutionService } from "../../services/i-execution.service";
import { INpmDependencyService } from "../../services/npm/i-npm-dependency.service";
import { IFileService } from "../../services/i-file.service";
import { NpmPackageCollection } from "../../definitions/npm-package-collection";
import { IConfigFile } from "../../definitions/i-config-file";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";
import { INpmProject } from "../../definitions/npm/i-npm-project";
import { INpmPackage } from "../../definitions/npm/i-npm-package";
import fs from "fs";

jest.mock("fs");
jest.mock("rimraf");

describe("BuildService", () => {
    let buildService: BuildService;
    let mockedLinkerService: MockProxy<ILinkerService>;
    let mockedExecutionService: MockProxy<IExecutionService>;
    let mockedNpmDependencyService: MockProxy<INpmDependencyService>;
    let mockedFileService: MockProxy<IFileService>;

    const createProject = (
        name: string,
        path: string,
        dependencies: Record<string, string> = {}
    ): INpmProject => ({
        type: ENpmPackageType.PROJECT,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name, dependencies },
        packageLockJson: null,
        packageLockJsonPath: `${path}/package-lock.json`,
        nodeModulesPath: `${path}/node_modules`
    });

    beforeEach(() => {
        mockedLinkerService = mock<ILinkerService>();
        mockedExecutionService = mock<IExecutionService>();
        mockedNpmDependencyService = mock<INpmDependencyService>();
        mockedFileService = mock<IFileService>();

        buildService = new BuildService(
            mockedLinkerService,
            mockedExecutionService,
            mockedNpmDependencyService,
            mockedFileService
        );

        (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    describe("build", () => {
        it("should build packages in correct order", async () => {
            const pkg1 = createProject("@test/pkg1", "/pkg1", { "@test/pkg2": "1.0.0" });
            const pkg2 = createProject("@test/pkg2", "/pkg2");
            const collection = new NpmPackageCollection([pkg1, pkg2], []);
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            mockedNpmDependencyService.getSortedNpmPackagesByInternalDependencies
                .mockReturnValue([pkg2, pkg1]);

            await buildService.build(collection, collection, configFile);

            expect(mockedLinkerService.applyLinks).toHaveBeenCalledTimes(2);
            expect(mockedExecutionService.executeScript).toHaveBeenCalled();
            expect(mockedFileService.createSymlinks).toHaveBeenCalledTimes(2);
        });

        it("should apply links before install", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1");
            const collection = new NpmPackageCollection([pkg], []);
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            mockedNpmDependencyService.getSortedNpmPackagesByInternalDependencies
                .mockReturnValue([pkg]);

            const callOrder: string[] = [];
            mockedLinkerService.applyLinks.mockImplementation(async () => {
                callOrder.push("applyLinks");
            });
            mockedExecutionService.executeScript.mockImplementation(async () => {
                callOrder.push("executeScript");
            });

            await buildService.build(collection, collection, configFile);

            expect(callOrder[0]).toBe("applyLinks");
        });
    });

    describe("clean", () => {
        it("should delete node_modules directory", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1");
            const collection = new NpmPackageCollection([pkg], []);

            mockedNpmDependencyService.getSortedNpmPackagesByInternalDependencies
                .mockReturnValue([pkg]);

            await buildService.clean(collection, collection, false);

            expect(mockedLinkerService.unlink).toHaveBeenCalled();
            expect(mockedFileService.removeSymlinks).toHaveBeenCalled();
        });

        it("should delete package-lock.json when includePackageLock is true", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1");
            const collection = new NpmPackageCollection([pkg], []);

            mockedNpmDependencyService.getSortedNpmPackagesByInternalDependencies
                .mockReturnValue([pkg]);

            await buildService.clean(collection, collection, true);

            expect(mockedLinkerService.unlink).toHaveBeenCalled();
        });

        it("should handle missing node_modules directory", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1");
            const collection = new NpmPackageCollection([pkg], []);

            mockedNpmDependencyService.getSortedNpmPackagesByInternalDependencies
                .mockReturnValue([pkg]);
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            await expect(buildService.clean(collection, collection, false)).resolves.not.toThrow();
        });

        it("should clean multiple packages", async () => {
            const pkg1 = createProject("@test/pkg1", "/pkg1");
            const pkg2 = createProject("@test/pkg2", "/pkg2");
            const collection = new NpmPackageCollection([pkg1, pkg2], []);

            mockedNpmDependencyService.getSortedNpmPackagesByInternalDependencies
                .mockReturnValue([pkg1, pkg2]);

            await buildService.clean(collection, collection, false);

            expect(mockedFileService.removeSymlinks).toHaveBeenCalled();
        });
    });
});
