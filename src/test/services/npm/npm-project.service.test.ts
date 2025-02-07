import {mock, MockProxy} from "jest-mock-extended";
import {describe, expect, it, jest, test, beforeEach} from "@jest/globals";
import {INpmProjectService} from "../../../services/npm/i-npm-project.service";
import {NpmProjectService} from "../../../services/npm/npm-project.service";
import {ExecutionService} from "../../../services/execution.service";
import {INpmPackageScopes} from "../../../definitions/npm/i-npm-package-scopes";
import {INpmPackage} from "../../../definitions/npm/i-npm-package";
import {JsonUtil} from "../../../utils/json.util";
import {ENpmPackageType} from "../../../definitions/npm/e-npm-package-type";
import {IPackageJson} from "../../../definitions/i-package-json";
import {IExecutionService} from "../../../services/i-execution.service";

jest.mock("../../../utils/json.util");

describe('packageScopes', () => {
    let mockedExecutionService: MockProxy<IExecutionService>;
    let npmProjectService: INpmProjectService;

    beforeEach(() => {
        npmProjectService = new NpmProjectService(mockedExecutionService);
        mockedExecutionService = mock<ExecutionService>();
    })

    const getMockedPackageJson = (name?: string): IPackageJson => ({
        name: name ?? "test"
    })

    JsonUtil.readJson = <T>(_: string): T => {
        return <T>getMockedPackageJson();
    }

    it('should return all package paths', async (): Promise<void> => {
        const packagePaths: string[] = ["/test"];
        const npmPackageScopes: INpmPackageScopes = {}

        const fetchedPackages: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes);

        const expectedNpmPackage: INpmPackage = {
            nodeModulesPath: undefined,
            type: ENpmPackageType.PROJECT,
            path: packagePaths[0],
            packageJsonPath: `${packagePaths[0]}/package.json`,
            packageLockJson: null,
            packageLockJsonPath: undefined,
            packageJson: getMockedPackageJson()
        }

        expect(fetchedPackages).toEqual([expectedNpmPackage]);
    });

    test('package path scopes', async (): Promise<void> => {
        const packagePaths: string[] = ["/test", "/test2", "/other"];
        const npmPackageScopes: INpmPackageScopes = {
            pathScopes: ["/test"]
        }
        const npmPackageScopes2: INpmPackageScopes = {
            pathScopes: ["/test", "/other"]
        }

        const fetchedPackages: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes);
        const fetchedPackages2: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes2);

        const expectedNpmPackages: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[0],
                packageJsonPath: `${packagePaths[0]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[1],
                packageJsonPath: `${packagePaths[1]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }
        ]

        const expectedNpmPackages2: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[0],
                packageJsonPath: `${packagePaths[0]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[1],
                packageJsonPath: `${packagePaths[1]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[2],
                packageJsonPath: `${packagePaths[2]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }
        ]

        expect(fetchedPackages).toEqual(expectedNpmPackages);
        expect(fetchedPackages2).toEqual(expectedNpmPackages2);
    });

    test('package paths', async (): Promise<void> => {
        const packagePaths: string[] = ["/test/to-package", "/test2/to-package", "/other/to-package"];
        const npmPackageScopes: INpmPackageScopes = {
            packagePaths: ["/test/to-package"]
        }
        const npmPackageScopes2: INpmPackageScopes = {
            packagePaths: ["/test/to-package", "/test2/to-package"]
        }

        const fetchedPackages: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes);
        const fetchedPackages2: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes2);

        const expectedNpmPackages: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[0],
                packageJsonPath: `${packagePaths[0]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }
        ]

        const expectedNpmPackages2: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[0],
                packageJsonPath: `${packagePaths[0]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[1],
                packageJsonPath: `${packagePaths[1]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }
        ]

        expect(fetchedPackages).toEqual(expectedNpmPackages);
        expect(fetchedPackages2).toEqual(expectedNpmPackages2);
    });

    test('package name scopes', async (): Promise<void> => {
        const packageNames: string[] = ["@zaeper/test", "@zaeper/test2", "@zaeper/other"];
        let readJsonIndex = 0;
        JsonUtil.readJson = <T>(_: string): T => {
            const mockedReturnValue: T = <T>getMockedPackageJson(packageNames[readJsonIndex]);
            readJsonIndex++;
            return mockedReturnValue;
        }

        const packagePaths: string[] = ["/test", "/test2", "/other"];
        const npmPackageScopes: INpmPackageScopes = {
            packageNameScopes: ["@zaeper"]
        }
        const npmPackageScopes2: INpmPackageScopes = {
            packageNameScopes: ["@zaeper/test"]
        }

        const fetchedPackages: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes);

        readJsonIndex = 0;
        const fetchedPackages2: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes2);

        const expectedNpmPackages: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[0],
                packageJsonPath: `${packagePaths[0]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson(packageNames[0])
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[1],
                packageJsonPath: `${packagePaths[1]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson(packageNames[1])
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[2],
                packageJsonPath: `${packagePaths[2]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson(packageNames[2])
            }
        ]

        const expectedNpmPackages2: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[0],
                packageJsonPath: `${packagePaths[0]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson(packageNames[0])
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[1],
                packageJsonPath: `${packagePaths[1]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson(packageNames[1])
            }
        ]

        expect(fetchedPackages).toEqual(expectedNpmPackages);
        expect(fetchedPackages2).toEqual(expectedNpmPackages2);
    });

    test('excluded package paths', async (): Promise<void> => {
        const packagePaths: string[] = ["/test/to-package", "/test2/to-package", "/other/to-package"];
        const npmPackageScopes: INpmPackageScopes = {
            excludedPackagePaths: ["/test/to-package"]
        }
        const npmPackageScopes2: INpmPackageScopes = {
            excludedPackagePaths: ["/test/to-package", "/test2/to-package"]
        }

        const fetchedPackages: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes);
        const fetchedPackages2: INpmPackage[] = await npmProjectService.getPackages(packagePaths, npmPackageScopes2);

        const expectedNpmPackages: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[1],
                packageJsonPath: `${packagePaths[1]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }, {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[2],
                packageJsonPath: `${packagePaths[2]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }
        ]

        const expectedNpmPackages2: INpmPackage[] = [
            {
                nodeModulesPath: undefined,
                type: ENpmPackageType.PROJECT,
                path: packagePaths[2],
                packageJsonPath: `${packagePaths[2]}/package.json`,
                packageLockJson: null,
                packageLockJsonPath: undefined,
                packageJson: getMockedPackageJson()
            }
        ]

        expect(fetchedPackages).toEqual(expectedNpmPackages);
        expect(fetchedPackages2).toEqual(expectedNpmPackages2);
    });
});