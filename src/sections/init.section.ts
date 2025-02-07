import {ISection} from "./i-section";
import {LoggerUtil} from "../utils/logger.util";
import ora, {Ora} from "ora";
import {IFileService} from "../services/i-file.service";
import {checkbox, select} from "@inquirer/prompts";
import {INpmProject} from "../definitions/npm/i-npm-project";
import {IConfigFile} from "../definitions/i-config-file";
import {IRunner} from "../runners/i-runner";
import {CommandCallback, ICommandRunnerOptions} from "../runners/command.runner";
import {EMode} from "../definitions/e-mode";
import {KeyPromptUtil} from "../utils/key-prompt.util";
import chalk from "chalk";
import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import {INpmWorkspace} from "../definitions/npm/i-npm-workspace";
import {PackageUtil} from "../utils/packageUtil";
import {EIncludeMode} from "../runners/e-include-mode";
import {NpmClientType} from "../definitions/npm/npm-client-type";
import {INpmClientService} from "../services/npm/i-npm-client.service";
import {IBuildService} from "../services/i-build.service";

export class InitSection implements ISection<void> {
    constructor(private readonly _fileService: IFileService, private readonly _commandRunner: IRunner<CommandCallback, void, ICommandRunnerOptions>, private readonly _buildService: IBuildService, private readonly _npmClientService: INpmClientService, private readonly _rootDir: string) {
    }

    public async render(): Promise<void> {
        console.clear();
        await LoggerUtil.printWelcome();
        LoggerUtil.printSection("Initialization");

        const checkConfigFileSpinner: Ora = ora('Checking configuration file').start();
        const configFileExists: boolean = this._fileService.checkIfConfigFileExists();
        checkConfigFileSpinner.stop();

        if (!configFileExists) {
            LoggerUtil.printPromptTitle("Run initialization?")
            LoggerUtil.printInfo("No pkgm.json configuration file found. Interactive mode only works after initialization.");
            const answer: string = await select({
                message: 'Do you want to run the init script?', choices: [{
                    name: 'Yes', value: 'yes'
                }, {
                    name: 'No', value: 'no'
                },], loop: false
            });

            if (answer === "no") {
                this._exit();
            } else {
                const npmClient: NpmClientType = await this._requestNpmClient();
                await this._npmClientService.installNpmClient(npmClient);

                await this._runInitialization(npmClient);
            }
        } else {
            console.clear();
        }
    }

    private _exit() {
        console.clear();
        LoggerUtil.printInfo("Exiting");
        process.exit();
    }

    private async _requestNpmClient(): Promise<NpmClientType> {
        console.clear();
        await LoggerUtil.printWelcome();

        return select({
            message: 'Please choose your npm client', choices: [{
                name: 'npm', value: "npm"
            }, {
                name: 'pnpm', value: "pnpm"
            }, {
                name: 'yarn', value: "yarn"
            }, {
                name: 'bun', value: "bun"
            },], loop: false
        });
    }

    private async _runInitialization(npmClient: NpmClientType) {
        console.clear();
        await LoggerUtil.printWelcome();

        const discoverNpmPackagesSpinner: Ora = ora('Discovering projects').start();
        const discoveredNpmPackagePaths: string[] = await PackageUtil.discoverPackagePaths(this._rootDir);
        discoverNpmPackagesSpinner.stop();

        if (discoveredNpmPackagePaths.length === 0) {
            LoggerUtil.printNote("No projects found.")
            LoggerUtil.printDemandActionMessage(`${chalk.bgRed.white(`  Press ${chalk.bold.white("<ENTER>")} to exit initialization  `)}`);

            await KeyPromptUtil.setKeyPrompt(() => {
                process.exit(0);
            }, "return")
        }

        LoggerUtil.printSpacing();
        LoggerUtil.printHint(`You can adjust the packages anytime in the pkgm.config file.`)

        const tmpConfigFile: IConfigFile = {
            npmClient: "npm", projects: discoveredNpmPackagePaths
        }

        const commandRunnerOptions: ICommandRunnerOptions = {}

        await this._commandRunner.run(tmpConfigFile, (npmPackageCollection: NpmPackageCollection) => this._setup(npmPackageCollection, npmClient), EMode.INTERACTIVE, EIncludeMode.NONE, false, false, commandRunnerOptions, {}, true)
    }

    private async _setup(npmPackageCollection: NpmPackageCollection, npmClient: NpmClientType): Promise<void> {
        console.clear();
        await LoggerUtil.printWelcome();

        const npmWorkspacePaths: string[] = await this._promptSelectWorkspaces(npmPackageCollection.projects);

        const updatedNpmPackageCollection: NpmPackageCollection = this._createNpmPackageCollection(npmPackageCollection.packages, npmWorkspacePaths);

        const symlinkIgnoredProjects: string[] = await this._promptSymlinkIgnore(updatedNpmPackageCollection.projects);
        await this._initialize(updatedNpmPackageCollection, symlinkIgnoredProjects, npmClient);
    }

    private _createNpmPackageCollection(npmPackages: INpmPackage[], npmWorkspacePaths: string[]): NpmPackageCollection {
        const npmProjects: INpmProject[] = [];
        const npmWorkspaces: INpmWorkspace[] = [];

        npmPackages.forEach(npmPackage => {
            if (npmWorkspacePaths.includes(npmPackage.path)) {
                npmWorkspaces.push(<INpmWorkspace>npmPackage);
            } else {
                npmProjects.push(<INpmProject>npmPackage);
            }
        })

        return new NpmPackageCollection(npmProjects, npmWorkspaces);
    }

    private async _promptSelectWorkspaces(projects: INpmProject[]): Promise<string[]> {
        console.clear();
        await LoggerUtil.printWelcome();

        LoggerUtil.printHint("Workspaces will be excluded when running the run or build command");
        LoggerUtil.printPromptTitle("Select your workspaces")
        const choices = projects.map((project) => ({
            name: project.packageJson.name, value: project.path
        }))

        return checkbox({
            message: 'Select workspaces', choices: choices, loop: false, pageSize: 50
        });
    }

    private async _promptSymlinkIgnore(projects: INpmProject[]): Promise<string[]> {
        console.clear();
        await LoggerUtil.printWelcome();

        LoggerUtil.printHint("We recommend to select all non lib projects, since those projects are not being linked within another npm package.");
        LoggerUtil.printPromptTitle("Select non lib projects")
        const choices = projects.map((project) => ({
            name: project.packageJson.name, value: project.path
        }))

        return checkbox({
            message: 'Select projects which should not be linked', choices: choices, loop: false, pageSize: 50
        });
    }

    private async _initialize(npmPackageCollection: NpmPackageCollection, excludeSymlinks: string[], npmClient: NpmClientType) {
        console.clear();
        await LoggerUtil.printWelcome();

        LoggerUtil.printPromptTitle("Start initialization");

        LoggerUtil.printWarning("If you want to initially build and link your projects, please ensure that all your projects are buildable and contain a build script in their package.json")
        const shouldRunInitialBuild: boolean = await select({
            message: 'Do you want to build and link your projects?', choices: [{
                name: 'Yes', value: true
            }, {
                name: 'No', value: false
            },], loop: false, default: false
        });

        LoggerUtil.printHint("Writing configs into pkgm.json")
        const initializationSpinner: Ora = ora('Initializing').start();
        const configFile: IConfigFile = this._createConfigFile(npmPackageCollection, excludeSymlinks, npmClient);
        this._fileService.writeConfigFile(configFile);

        const initOutputs: string[] = ["Everything is set up", "pkgm.json` configuration file created."];

        if (shouldRunInitialBuild) {
            LoggerUtil.printHint("Running initial build")
            const commandRunnerOptions: ICommandRunnerOptions = {
                symlinkedProjectsOnly: true
            }
            await this._commandRunner.run(configFile, (npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, configFile: IConfigFile) => this._buildService.build(npmPackageCollection, unscopedNpmPackageCollection, configFile), EMode.COMMAND, EIncludeMode.NONE, false, true, commandRunnerOptions, {})

            initOutputs.push("Your projects are now build and linked.")
        }

        initializationSpinner.stop();

        LoggerUtil.printSpacing()

        console.log("########################################################################");
        initOutputs.forEach((message: string, index: number) => {
            console.log(`#\n# ${index + 1}. ${message}`)
        })
        console.log("#\n" + "########################################################################")

        LoggerUtil.printSpacing()

        await this._continueToMainNavigationPrompt();
    }

    private _createConfigFile(npmPackageCollection: NpmPackageCollection, excludeSymlinks: string[], npmClient: NpmClientType): IConfigFile {
        return {
            workspaces: npmPackageCollection.workspacePaths,
            projects: npmPackageCollection.projectPaths,
            excludeSymlinks: excludeSymlinks,
            npmClient: npmClient
        }
    }

    private async _continueToMainNavigationPrompt() {
        LoggerUtil.printPromptTitle("Continue to main navigation")
        const answer: boolean = await select({
            message: 'Do you want to continue to the main navigation?', choices: [{
                name: 'Yes', value: true
            }, {
                name: 'No', value: false
            },], loop: false
        });

        if (answer) {
            console.clear();
            return;
        } else {
            this._exit();
        }
    }
}