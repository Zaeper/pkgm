import { IRunner } from "./i-runner";
import { EMode } from "../definitions/e-mode";
import { IConfigFile } from "../definitions/i-config-file";
import { NpmPackageCollection } from "../definitions/npm-package-collection";
import { INpmPackageScopes } from "../definitions/npm/i-npm-package-scopes";
import { INpmProjectService } from "../services/npm/i-npm-project.service";
import { INpmWorkspaceService } from "../services/npm/i-npm-workspace.service";
import { EIncludeMode } from "./e-include-mode";
export type CommandCallback = (npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, configFile: IConfigFile) => void | Promise<void>;
export interface ICommandRunnerOptions {
    command?: string;
    symlinkedProjectsOnly?: boolean;
    parameters?: Record<string, string | undefined>;
}
export declare class CommandRunner implements IRunner<CommandCallback, void, ICommandRunnerOptions> {
    private _npmProjectService;
    private _npmWorkspaceService;
    constructor(_npmProjectService: INpmProjectService, _npmWorkspaceService: INpmWorkspaceService);
    run(configFile: IConfigFile, fn: CommandCallback, mode: EMode, workspacesIncludeMode: EIncludeMode, silent: boolean, printTargetPackages: boolean, runnerOptions: ICommandRunnerOptions, npmPackageScopes?: INpmPackageScopes, isInitializing?: boolean): Promise<void>;
    private _prepareExecution;
    private _getPrunedNpmPackageScopes;
    private _listAffectedPackages;
    private _sortPackagesInAlphabeticalOrder;
    private _returnToMainNavigationPrompt;
    private _assembleCommand;
    private _promptManageScopes;
    private _getNpmPackageCollection;
    private _promptExcludePackagesManually;
    private _promptSelectPackagesManually;
    private _generateScopeSuggestion;
}
