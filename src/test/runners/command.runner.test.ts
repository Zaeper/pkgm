import {mock, MockProxy} from "jest-mock-extended";
import {beforeEach, describe, expect, it} from "@jest/globals";
import {INpmProjectService} from "../../services/npm/i-npm-project.service";
import {CommandRunner} from "../../runners/command.runner";
import {NpmProjectService} from "../../services/npm/npm-project.service";
import {INpmWorkspaceService} from "../../services/npm/i-npm-workspace.service";
import {NpmPackageCollection} from "../../definitions/npm-package-collection";
import {IConfigFile} from "../../definitions/i-config-file";
import {INpmPackageScopes} from "../../definitions/npm/i-npm-package-scopes";
import {NpmWorkspaceService} from "../../services/npm/npm-workspace.service";
import {ENpmPackageType} from "../../definitions/npm/e-npm-package-type";
import {INpmProject} from "../../definitions/npm/i-npm-project";
import {INpmWorkspace} from "../../definitions/npm/i-npm-workspace";
import {EIncludeMode} from "../../runners/e-include-mode";

describe('packageScopes', () => {
    const projectNames: string[] = ["@zaeper/test", "@zaeper/test2", "@zaeper/other"];
    const workspaceNames: string[] = ["@zaeper/workspace", "@zaeper/workspace2"];
    const projectPaths: string[] = ["/workspace/test", "/workspace/test2", "/other"];
    const workspacePaths: string[] = ["/workspace", "/workspace2"];

    const mockedNpmProjects: INpmProject[] = [
        {
            nodeModulesPath: undefined,
            type: ENpmPackageType.PROJECT,
            path: projectPaths[0],
            packageJsonPath: `${projectPaths[0]}/package.json`,
            packageLockJson: null,
            packageLockJsonPath: undefined,
            packageJson: {
                name: projectNames[0]
            }
        }, {
            nodeModulesPath: undefined,
            type: ENpmPackageType.PROJECT,
            path: projectPaths[1],
            packageJsonPath: `${projectPaths[1]}/package.json`,
            packageLockJson: null,
            packageLockJsonPath: undefined,
            packageJson: {
                name: projectNames[1]
            }
        }, {
            nodeModulesPath: undefined,
            type: ENpmPackageType.PROJECT,
            path: projectPaths[2],
            packageJsonPath: `${projectPaths[2]}/package.json`,
            packageLockJson: null,
            packageLockJsonPath: undefined,
            packageJson: {
                name: projectNames[2]
            }
        }
    ]

    const mockedNpmWorkspaces: INpmWorkspace[] = [
        {
            nodeModulesPath: undefined,
            type: ENpmPackageType.WORKSPACE,
            path: workspacePaths[0],
            packageJsonPath: `${workspacePaths[0]}/package.json`,
            packageLockJson: null,
            packageLockJsonPath: undefined,
            packageJson: {
                name: workspaceNames[0]
            }
        },
        {
            nodeModulesPath: undefined,
            type: ENpmPackageType.WORKSPACE,
            path: workspacePaths[1],
            packageJsonPath: `${workspacePaths[1]}/package.json`,
            packageLockJson: null,
            packageLockJsonPath: undefined,
            packageJson: {
                name: workspaceNames[1]
            }
        }
    ]

    let mockedNpmProjectService: MockProxy<INpmProjectService>;
    let mockedNpmWorkspaceService: MockProxy<INpmWorkspaceService>;
    let commandRunner: CommandRunner;

    beforeEach(() => {
        mockedNpmProjectService = mock<NpmProjectService>();
        mockedNpmWorkspaceService = mock<NpmWorkspaceService>();
        commandRunner = new CommandRunner(mockedNpmProjectService, mockedNpmWorkspaceService);

        mockedNpmProjectService.getPackages.mockResolvedValue(mockedNpmProjects)
        mockedNpmWorkspaceService.getPackages.mockResolvedValue(mockedNpmWorkspaces)
    })

    it('should return all projects and workspaces', async (): Promise<void> => {
        const configFile: IConfigFile = {
            npmClient: "npm",
            projects: [
                "@zaeper/test", "@zaeper/test2", "@zaeper/other"
            ],
            workspaces: [
                "@zaeper/workspace", "@zaeper/workspace2"
            ]
        }
        const workspacesIncludeMode: EIncludeMode = EIncludeMode.ALL;
        const projectScopes: INpmPackageScopes = {}

        const npmPackageCollection: NpmPackageCollection = await commandRunner["_getNpmPackageCollection"](configFile, workspacesIncludeMode, projectScopes);

        const expectedNpmPackageCollection: NpmPackageCollection = new NpmPackageCollection(mockedNpmProjects, mockedNpmWorkspaces);

        expect(npmPackageCollection).toEqual(expectedNpmPackageCollection);
    });

    it('should only return all projects', async (): Promise<void> => {
        const configFile: IConfigFile = {
            npmClient: "npm",
            projects: [
                "@zaeper/test", "@zaeper/test2", "@zaeper/other"
            ],
            workspaces: [
                "@zaeper/workspace", "@zaeper/workspace2"
            ]
        }
        const workspacesIncludeMode: EIncludeMode = EIncludeMode.NONE;
        const projectScopes: INpmPackageScopes = {}

        const npmPackageCollection: NpmPackageCollection = await commandRunner["_getNpmPackageCollection"](configFile, workspacesIncludeMode, projectScopes);

        const expectedNpmPackageCollection: NpmPackageCollection = new NpmPackageCollection(mockedNpmProjects, []);

        expect(npmPackageCollection).toEqual(expectedNpmPackageCollection);
    });

    it('should only return all projects and affected workspaces', async (): Promise<void> => {
        const configFile: IConfigFile = {
            npmClient: "npm",
            projects: [
                "@zaeper/test", "@zaeper/test2", "@zaeper/other"
            ],
            workspaces: [
                "@zaeper/workspace", "@zaeper/workspace2"
            ]
        }
        const workspacesIncludeMode1: EIncludeMode = EIncludeMode.ONLY_AFFECTED;
        const projectScopes1: INpmPackageScopes = {}
        const npmPackageCollection1: NpmPackageCollection = await commandRunner["_getNpmPackageCollection"](configFile, workspacesIncludeMode1, projectScopes1);
        const expectedNpmPackageCollection1: NpmPackageCollection = new NpmPackageCollection(mockedNpmProjects, [mockedNpmWorkspaces[0]]);

        expect(npmPackageCollection1).toEqual(expectedNpmPackageCollection1);
    });
});