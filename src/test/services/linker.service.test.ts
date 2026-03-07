import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { LinkerService } from "../../services/linker.service";
import { INpmDependencyService } from "../../services/npm/i-npm-dependency.service";
import { IExecutionService } from "../../services/i-execution.service";
import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { NpmPackageCollection } from "../../definitions/npm-package-collection";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";
import { IConfigFile } from "../../definitions/i-config-file";
import { ECommandType } from "../../definitions/e-command-type";
import { INpmProject } from "../../definitions/npm/i-npm-project";

describe("LinkerService", () => {
    let linkerService: LinkerService;
    let mockedDependencyService: MockProxy<INpmDependencyService>;
    let mockedExecutionService: MockProxy<IExecutionService>;

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
            version: "1.0.0",
            dependencies,
            devDependencies,
            peerDependencies
        },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    beforeEach(() => {
        mockedDependencyService = mock<INpmDependencyService>();
        mockedExecutionService = mock<IExecutionService>();
        linkerService = new LinkerService(mockedDependencyService, mockedExecutionService);
    });

    describe("applyLinks", () => {
        it("should link dependencies", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1", { "@test/pkg2": "1.0.0" });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            mockedDependencyService.getNpmPackageInternalDependencies.mockReturnValue({
                "@test/pkg2": "1.0.0"
            });
            mockedDependencyService.getNpmPackageDevInternalDependencies.mockReturnValue({});
            mockedDependencyService.getNpmPackagePeerInternalDependencies.mockReturnValue({});

            await linkerService.applyLinks(pkg, collection, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                [pkg],
                "link @test/pkg2 --save",
                ECommandType.NPM,
                "npm"
            );
        });

        it("should link dev dependencies with --save-dev", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, { "@test/pkg2": "1.0.0" });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            mockedDependencyService.getNpmPackageInternalDependencies.mockReturnValue({});
            mockedDependencyService.getNpmPackageDevInternalDependencies.mockReturnValue({
                "@test/pkg2": "1.0.0"
            });
            mockedDependencyService.getNpmPackagePeerInternalDependencies.mockReturnValue({});

            await linkerService.applyLinks(pkg, collection, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                [pkg],
                "link @test/pkg2 --save-dev",
                ECommandType.NPM,
                "npm"
            );
        });

        it("should link peer dependencies with --save-peer", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1", {}, {}, { "@test/pkg2": "1.0.0" });
            const collection = new NpmPackageCollection(
                [pkg, createProject("@test/pkg2", "/pkg2")],
                []
            );
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            mockedDependencyService.getNpmPackageInternalDependencies.mockReturnValue({});
            mockedDependencyService.getNpmPackageDevInternalDependencies.mockReturnValue({});
            mockedDependencyService.getNpmPackagePeerInternalDependencies.mockReturnValue({
                "@test/pkg2": "1.0.0"
            });

            await linkerService.applyLinks(pkg, collection, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                [pkg],
                "link @test/pkg2 --save-peer",
                ECommandType.NPM,
                "npm"
            );
        });

        it("should not call executeScript when no dependencies to link", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1");
            const collection = new NpmPackageCollection([pkg], []);
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            mockedDependencyService.getNpmPackageInternalDependencies.mockReturnValue({});
            mockedDependencyService.getNpmPackageDevInternalDependencies.mockReturnValue({});
            mockedDependencyService.getNpmPackagePeerInternalDependencies.mockReturnValue({});

            await linkerService.applyLinks(pkg, collection, configFile);

            expect(mockedExecutionService.executeScript).not.toHaveBeenCalled();
        });
    });

    describe("link", () => {
        it("should batch link dependencies", async () => {
            const pkg1 = createProject("@test/pkg1", "/pkg1", { "@test/common": "1.0.0" });
            const pkg2 = createProject("@test/pkg2", "/pkg2", { "@test/common": "1.0.0" });
            const common = createProject("@test/common", "/common");
            const collection = new NpmPackageCollection([pkg1, pkg2, common], []);
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            mockedDependencyService.getNpmPackageInternalDependencies
                .mockImplementation((pkg: INpmPackage): Record<string, string> => {
                    if (pkg.packageJson.name === "@test/pkg1" || pkg.packageJson.name === "@test/pkg2") {
                        return { "@test/common": "1.0.0" };
                    }
                    return {};
                });
            mockedDependencyService.getNpmPackageDevInternalDependencies.mockReturnValue({});
            mockedDependencyService.getNpmPackagePeerInternalDependencies.mockReturnValue({});

            await linkerService.link(collection, collection, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalled();
        });
    });

    describe("unlink", () => {
        it("should replace file protocol with version in package.json", async () => {
            const pkg1 = createProject("@test/pkg1", "/pkg1");
            const pkg2 = createProject("@test/pkg2", "/pkg2", {
                "@test/pkg1": "file:../pkg1"
            });
            const collection = new NpmPackageCollection([pkg1, pkg2], []);

            await linkerService.unlink(collection, collection);
        });

        it("should handle packages without dependencies", async () => {
            const pkg = createProject("@test/pkg1", "/pkg1");
            const collection = new NpmPackageCollection([pkg], []);

            await linkerService.unlink(collection, collection);
        });
    });
});
