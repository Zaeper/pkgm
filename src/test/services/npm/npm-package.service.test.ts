import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { NpmPackageService } from "../../../services/npm/npm-package.service";
import { IExecutionService } from "../../../services/i-execution.service";
import { INpmPackage } from "../../../definitions/npm/i-npm-package";
import { ENpmPackageType } from "../../../definitions/npm/e-npm-package-type";
import { ECommandType } from "../../../definitions/e-command-type";
import { IConfigFile } from "../../../definitions/i-config-file";
import { JsonUtil } from "../../../utils/json.util";
import { IPackageJson } from "../../../definitions/i-package-json";

jest.mock("../../../utils/json.util");

describe("NpmPackageService", () => {
    let npmPackageService: NpmPackageService<INpmPackage>;
    let mockedExecutionService: MockProxy<IExecutionService>;

    const createPackage = (name: string, path: string): INpmPackage => ({
        type: ENpmPackageType.UNKNOWN,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    const getMockedPackageJson = (name?: string): IPackageJson => ({
        name: name ?? "test-package"
    });

    beforeEach(() => {
        mockedExecutionService = mock<IExecutionService>();
        npmPackageService = new NpmPackageService(mockedExecutionService);
        JsonUtil.readJson = <T>(_: string): T => {
            return <T>getMockedPackageJson();
        };
    });

    describe("getPackages", () => {
        it("should return packages for given paths", async () => {
            const packagePaths = ["/pkg1", "/pkg2"];

            const packages = await npmPackageService.getPackages(packagePaths);

            expect(packages).toHaveLength(2);
        });

        it("should set correct package properties", async () => {
            const packagePaths = ["/pkg1"];

            const packages = await npmPackageService.getPackages(packagePaths);

            expect(packages[0].path).toBe("/pkg1");
            expect(packages[0].packageJsonPath).toBe("/pkg1/package.json");
        });

        it("should return empty array for empty paths", async () => {
            const packages = await npmPackageService.getPackages([]);

            expect(packages).toEqual([]);
        });

        it("should filter by packageNameScopes", async () => {
            let callIndex = 0;
            JsonUtil.readJson = <T>(_: string): T => {
                const names = ["@test/pkg1", "@other/pkg2"];
                const result = getMockedPackageJson(names[callIndex]);
                callIndex++;
                return <T>result;
            };

            const packages = await npmPackageService.getPackages(
                ["/pkg1", "/pkg2"],
                { packageNameScopes: ["@test"] }
            );

            expect(packages).toHaveLength(1);
            expect(packages[0].packageJson.name).toBe("@test/pkg1");
        });
    });

    describe("run", () => {
        it("should call execution service with correct parameters", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmPackageService.run(packages, "test", ECommandType.NPM_SCRIPT, false, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                packages,
                "test",
                ECommandType.NPM_SCRIPT,
                "npm",
                false
            );
        });

        it("should pass async flag correctly", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmPackageService.run(packages, "dev", ECommandType.NPM_SCRIPT, true, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                packages,
                "dev",
                ECommandType.NPM_SCRIPT,
                "npm",
                true
            );
        });
    });

    describe("install", () => {
        it("should call execution service for npm install", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmPackageService.install(packages, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                packages,
                "install",
                ECommandType.NPM,
                "npm",
                false
            );
        });

        it("should install specific dependency", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmPackageService.install(packages, configFile, {
                dependencyName: "lodash"
            });

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                packages,
                "install lodash --save",
                ECommandType.NPM,
                "npm",
                false
            );
        });

        it("should install as devDependency", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmPackageService.install(packages, configFile, {
                dependencyName: "jest",
                dependencyCategory: "devDependency"
            });

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                packages,
                "install jest --save-dev",
                ECommandType.NPM,
                "npm",
                false
            );
        });

        it("should install as peerDependency", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmPackageService.install(packages, configFile, {
                dependencyName: "react",
                dependencyCategory: "peerDependency"
            });

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                packages,
                "install react --save-peer",
                ECommandType.NPM,
                "npm",
                false
            );
        });

        it("should use configured npm client", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmPackageService.install(packages, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                packages,
                "install",
                ECommandType.NPM,
                "npm",
                false
            );
        });
    });
});
