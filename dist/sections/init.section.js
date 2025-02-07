"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitSection = void 0;
const logger_util_1 = require("../utils/logger.util");
const ora_1 = __importDefault(require("ora"));
const prompts_1 = require("@inquirer/prompts");
const e_mode_1 = require("../definitions/e-mode");
const key_prompt_util_1 = require("../utils/key-prompt.util");
const chalk_1 = __importDefault(require("chalk"));
const npm_package_collection_1 = require("../definitions/npm-package-collection");
const packageUtil_1 = require("../utils/packageUtil");
const e_include_mode_1 = require("../runners/e-include-mode");
class InitSection {
    _fileService;
    _commandRunner;
    _buildService;
    _npmClientService;
    _rootDir;
    constructor(_fileService, _commandRunner, _buildService, _npmClientService, _rootDir) {
        this._fileService = _fileService;
        this._commandRunner = _commandRunner;
        this._buildService = _buildService;
        this._npmClientService = _npmClientService;
        this._rootDir = _rootDir;
    }
    async render() {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        logger_util_1.LoggerUtil.printSection("Initialization");
        const checkConfigFileSpinner = (0, ora_1.default)('Checking configuration file').start();
        const configFileExists = this._fileService.checkIfConfigFileExists();
        checkConfigFileSpinner.stop();
        if (!configFileExists) {
            logger_util_1.LoggerUtil.printPromptTitle("Run initialization?");
            logger_util_1.LoggerUtil.printInfo("No pkgm.json configuration file found. Interactive mode only works after initialization.");
            const answer = await (0, prompts_1.select)({
                message: 'Do you want to run the init script?', choices: [{
                        name: 'Yes', value: 'yes'
                    }, {
                        name: 'No', value: 'no'
                    },], loop: false
            });
            if (answer === "no") {
                this._exit();
            }
            else {
                const npmClient = await this._requestNpmClient();
                await this._npmClientService.installNpmClient(npmClient);
                await this._runInitialization(npmClient);
            }
        }
        else {
            console.clear();
        }
    }
    _exit() {
        console.clear();
        logger_util_1.LoggerUtil.printInfo("Exiting");
        process.exit();
    }
    async _requestNpmClient() {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        return (0, prompts_1.select)({
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
    async _runInitialization(npmClient) {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        const discoverNpmPackagesSpinner = (0, ora_1.default)('Discovering projects').start();
        const discoveredNpmPackagePaths = await packageUtil_1.PackageUtil.discoverPackagePaths(this._rootDir);
        discoverNpmPackagesSpinner.stop();
        if (discoveredNpmPackagePaths.length === 0) {
            logger_util_1.LoggerUtil.printNote("No projects found.");
            logger_util_1.LoggerUtil.printDemandActionMessage(`${chalk_1.default.bgRed.white(`  Press ${chalk_1.default.bold.white("<ENTER>")} to exit initialization  `)}`);
            await key_prompt_util_1.KeyPromptUtil.setKeyPrompt(() => {
                process.exit(0);
            }, "return");
        }
        logger_util_1.LoggerUtil.printSpacing();
        logger_util_1.LoggerUtil.printHint(`You can adjust the packages anytime in the pkgm.config file.`);
        const tmpConfigFile = {
            npmClient: "npm", projects: discoveredNpmPackagePaths
        };
        const commandRunnerOptions = {};
        await this._commandRunner.run(tmpConfigFile, (npmPackageCollection) => this._setup(npmPackageCollection, npmClient), e_mode_1.EMode.INTERACTIVE, e_include_mode_1.EIncludeMode.NONE, false, false, commandRunnerOptions, {}, true);
    }
    async _setup(npmPackageCollection, npmClient) {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        const npmWorkspacePaths = await this._promptSelectWorkspaces(npmPackageCollection.projects);
        const updatedNpmPackageCollection = this._createNpmPackageCollection(npmPackageCollection.packages, npmWorkspacePaths);
        const symlinkIgnoredProjects = await this._promptSymlinkIgnore(updatedNpmPackageCollection.projects);
        await this._initialize(updatedNpmPackageCollection, symlinkIgnoredProjects, npmClient);
    }
    _createNpmPackageCollection(npmPackages, npmWorkspacePaths) {
        const npmProjects = [];
        const npmWorkspaces = [];
        npmPackages.forEach(npmPackage => {
            if (npmWorkspacePaths.includes(npmPackage.path)) {
                npmWorkspaces.push(npmPackage);
            }
            else {
                npmProjects.push(npmPackage);
            }
        });
        return new npm_package_collection_1.NpmPackageCollection(npmProjects, npmWorkspaces);
    }
    async _promptSelectWorkspaces(projects) {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        logger_util_1.LoggerUtil.printHint("Workspaces will be excluded when running the run or build command");
        logger_util_1.LoggerUtil.printPromptTitle("Select your workspaces");
        const choices = projects.map((project) => ({
            name: project.packageJson.name, value: project.path
        }));
        return (0, prompts_1.checkbox)({
            message: 'Select workspaces', choices: choices, loop: false, pageSize: 50
        });
    }
    async _promptSymlinkIgnore(projects) {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        logger_util_1.LoggerUtil.printHint("We recommend to select all non lib projects, since those projects are not being linked within another npm package.");
        logger_util_1.LoggerUtil.printPromptTitle("Select non lib projects");
        const choices = projects.map((project) => ({
            name: project.packageJson.name, value: project.path
        }));
        return (0, prompts_1.checkbox)({
            message: 'Select projects which should not be linked', choices: choices, loop: false, pageSize: 50
        });
    }
    async _initialize(npmPackageCollection, excludeSymlinks, npmClient) {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        logger_util_1.LoggerUtil.printPromptTitle("Start initialization");
        logger_util_1.LoggerUtil.printWarning("If you want to initially build and link your projects, please ensure that all your projects are buildable and contain a build script in their package.json");
        const shouldRunInitialBuild = await (0, prompts_1.select)({
            message: 'Do you want to build and link your projects?', choices: [{
                    name: 'Yes', value: true
                }, {
                    name: 'No', value: false
                },], loop: false, default: false
        });
        logger_util_1.LoggerUtil.printHint("Writing configs into pkgm.json");
        const initializationSpinner = (0, ora_1.default)('Initializing').start();
        const configFile = this._createConfigFile(npmPackageCollection, excludeSymlinks, npmClient);
        this._fileService.writeConfigFile(configFile);
        const initOutputs = ["Everything is set up", "pkgm.json` configuration file created."];
        if (shouldRunInitialBuild) {
            logger_util_1.LoggerUtil.printHint("Running initial build");
            const commandRunnerOptions = {
                symlinkedProjectsOnly: true
            };
            await this._commandRunner.run(configFile, (npmPackageCollection, unscopedNpmPackageCollection, configFile) => this._buildService.build(npmPackageCollection, unscopedNpmPackageCollection, configFile), e_mode_1.EMode.COMMAND, e_include_mode_1.EIncludeMode.NONE, false, true, commandRunnerOptions, {});
            initOutputs.push("Your projects are now build and linked.");
        }
        initializationSpinner.stop();
        logger_util_1.LoggerUtil.printSpacing();
        console.log("########################################################################");
        initOutputs.forEach((message, index) => {
            console.log(`#\n# ${index + 1}. ${message}`);
        });
        console.log("#\n" + "########################################################################");
        logger_util_1.LoggerUtil.printSpacing();
        await this._continueToMainNavigationPrompt();
    }
    _createConfigFile(npmPackageCollection, excludeSymlinks, npmClient) {
        return {
            workspaces: npmPackageCollection.workspacePaths,
            projects: npmPackageCollection.projectPaths,
            excludeSymlinks: excludeSymlinks,
            npmClient: npmClient
        };
    }
    async _continueToMainNavigationPrompt() {
        logger_util_1.LoggerUtil.printPromptTitle("Continue to main navigation");
        const answer = await (0, prompts_1.select)({
            message: 'Do you want to continue to the main navigation?', choices: [{
                    name: 'Yes', value: true
                }, {
                    name: 'No', value: false
                },], loop: false
        });
        if (answer) {
            console.clear();
            return;
        }
        else {
            this._exit();
        }
    }
}
exports.InitSection = InitSection;
