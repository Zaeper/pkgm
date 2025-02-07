import { ISection } from "./i-section";
import { IFileService } from "../services/i-file.service";
import { IRunner } from "../runners/i-runner";
import { CommandCallback, ICommandRunnerOptions } from "../runners/command.runner";
import { IBuildService } from "../services/i-build.service";
export declare class InitSection implements ISection<void> {
    private readonly _fileService;
    private readonly _buildService;
    private readonly _commandRunner;
    private readonly _rootDir;
    constructor(_fileService: IFileService, _buildService: IBuildService, _commandRunner: IRunner<CommandCallback, void, ICommandRunnerOptions>, _rootDir: string);
    render(): Promise<void>;
    private _exit;
    private _runInitialization;
    private _setup;
    private _createNpmPackageCollection;
    private _promptSelectWorkspaces;
    private _promptSymlinkIgnore;
    private _initialize;
    private _createConfigFile;
    private _continueToMainNavigationPrompt;
}
