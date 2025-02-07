#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process = __importStar(require("process"));
const prompts_1 = require("@inquirer/prompts");
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = __importDefault(require("@ptkdev/logger"));
const arg_1 = __importDefault(require("arg"));
const e_command_1 = require("./definitions/e-command");
const npm_project_service_1 = require("./services/npm/npm-project.service");
const file_service_1 = require("./services/file.service");
const execution_service_1 = require("./services/execution.service");
const linker_service_1 = require("./services/linker.service");
const logger_util_1 = require("./utils/logger.util");
const main_navigation_section_1 = require("./sections/main-navigation.section");
const init_section_1 = require("./sections/init.section");
const command_runner_1 = require("./runners/command.runner");
const e_mode_1 = require("./definitions/e-mode");
const build_service_1 = require("./services/build.service");
const e_command_type_1 = require("./definitions/e-command-type");
const path_util_1 = require("./utils/path.util");
const e_version_manager_task_1 = require("./definitions/e-version-manager-task");
const version_manager_service_1 = require("./services/version-manager.service");
const npm_workspace_service_1 = require("./services/npm/npm-workspace.service");
const help_section_1 = require("./sections/help.section");
const npm_dependency_service_1 = require("./services/npm/npm-dependency.service");
const e_npm_package_type_1 = require("./definitions/npm/e-npm-package-type");
const npm_package_service_1 = require("./services/npm/npm-package.service");
const e_include_mode_1 = require("./runners/e-include-mode");
const npm_client_service_1 = require("./services/npm/npm-client.service");
const rootDir = path_util_1.PathUtil.normalize(process.cwd());
const executionService = new execution_service_1.ExecutionService();
const npmDependencyService = new npm_dependency_service_1.NpmDependencyService();
const linkerService = new linker_service_1.LinkerService(npmDependencyService, executionService);
const fileService = new file_service_1.FileService(rootDir, executionService);
const npmPackageService = new npm_package_service_1.NpmPackageService(executionService);
const npmProjectService = new npm_project_service_1.NpmProjectService(executionService);
const npmWorkspaceService = new npm_workspace_service_1.NpmWorkspaceService(executionService);
const versionManagerService = new version_manager_service_1.VersionManagerService(executionService, npmDependencyService, npmPackageService);
const npmClientService = new npm_client_service_1.NpmClientService();
const buildService = new build_service_1.BuildService(linkerService, executionService, npmDependencyService, fileService);
const logger = new logger_1.default();
const commandRunner = new command_runner_1.CommandRunner(npmProjectService, npmWorkspaceService);
const mainNavigationSection = new main_navigation_section_1.MainNavigationSection();
const initSection = new init_section_1.InitSection(fileService, commandRunner, buildService, npmClientService, rootDir);
const helpSection = new help_section_1.HelpSection();
const DEFAULT_ARGS = {
    '--scope-package-name': [String], '--scope-path': [String], '--exclude-path': [String], '--package-path': [String]
};
function getPackageScopes(args) {
    return {
        pathScopes: args['--scope-path'],
        packageNameScopes: args['--scope-package-name'],
        excludedPackagePaths: args['--exclude-path'],
        packagePaths: args['--package-path']
    };
}
let mode = e_mode_1.EMode.COMMAND;
async function defineArgs(command) {
    let args;
    if (command === undefined) {
        mode = e_mode_1.EMode.INTERACTIVE;
        command = await mainNavigationSection.render();
    }
    switch (command.toLowerCase()) {
        case (e_command_1.ECommand.VERSION_MANAGER.toLowerCase()):
            if (process.argv[3] === e_version_manager_task_1.EVersionManagerTask.UPDATE_VERSIONS) {
                args = (0, arg_1.default)({
                    ...DEFAULT_ARGS, "--dry-run": Boolean
                });
            }
            else {
                args = (0, arg_1.default)({
                    ...DEFAULT_ARGS
                });
            }
            break;
        case (e_command_1.ECommand.EXIT.toLowerCase()):
        case (e_command_1.ECommand.HELP.toLowerCase()):
        case (e_command_1.ECommand.LIST.toLowerCase()):
        case (e_command_1.ECommand.LIST_DEPENDENCIES.toLowerCase()):
        case (e_command_1.ECommand.LIST_SCRIPTS.toLowerCase()):
        case (e_command_1.ECommand.LINK.toLowerCase()):
        case (e_command_1.ECommand.UNLINK.toLowerCase()):
        case (e_command_1.ECommand.RUN.toLowerCase()):
        case (e_command_1.ECommand.RUN_ASYNC.toLowerCase()):
        case (e_command_1.ECommand.BUILD.toLowerCase()):
        case (e_command_1.ECommand.BUILD_WATCH.toLowerCase()):
            args = (0, arg_1.default)({
                ...DEFAULT_ARGS
            });
            break;
        case (e_command_1.ECommand.INSTALL.toLowerCase()):
            args = (0, arg_1.default)({
                ...DEFAULT_ARGS, '--package-name': String
            });
            break;
        case (e_command_1.ECommand.REINIT.toLowerCase()):
            args = (0, arg_1.default)({
                ...DEFAULT_ARGS, '--delete-package-lock': Boolean
            });
            break;
    }
    await executeTask(command, args);
    if (mode === e_mode_1.EMode.INTERACTIVE) {
        await defineArgs(undefined);
    }
    return args;
}
const listTargets = async (npmPackageCollection) => {
    if (npmPackageCollection.workspaces.length > 0) {
        npmWorkspaceService.list(npmPackageCollection.workspaces, e_npm_package_type_1.ENpmPackageType.WORKSPACE);
        logger_util_1.LoggerUtil.printSpacing();
    }
    npmProjectService.list(npmPackageCollection.projects, e_npm_package_type_1.ENpmPackageType.PROJECT);
};
const listTargetsWithDependencies = async (npmPackageCollection, unscopedNpmPackageCollection) => {
    npmDependencyService.listInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
};
const listTargetsWithScripts = async (npmPackageCollection) => {
    npmWorkspaceService.listScripts(npmPackageCollection.workspaces);
    npmProjectService.listScripts(npmPackageCollection.projects);
};
const linkTargets = async (npmPackageCollection, unscopedNpmPackageCollection, configFile) => {
    const npmPackageProcessingList = npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
    await fileService.createSymlinks(npmPackageProcessingList, configFile);
    await linkerService.link(npmPackageCollection, unscopedNpmPackageCollection, configFile);
};
const reinit = async (npmPackageCollection, unscopedNpmPackageCollection, includePackageLock, configFile) => {
    await buildService.clean(npmPackageCollection, unscopedNpmPackageCollection, includePackageLock);
    await buildService.build(npmPackageCollection, unscopedNpmPackageCollection, configFile);
};
const unlinkTargets = async (npmPackageCollection, unscopedNpmPackageCollection) => {
    const npmPackageProcessingList = npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
    await linkerService.unlink(npmPackageCollection, unscopedNpmPackageCollection);
    await fileService.removeSymlinks(npmPackageProcessingList);
};
const installTargets = async (npmPackageCollection, configFile, packageName) => {
    await npmWorkspaceService.install(npmPackageCollection.workspaces, configFile, packageName);
    await npmProjectService.install(npmPackageCollection.projects, configFile, packageName);
};
const checkPackageVersions = async (npmPackageCollection, unscopedNpmPackageCollection, configFile, mode, dryRun) => {
    const recommendedPackages = await versionManagerService.getPackageVersionRecommendations(npmPackageCollection, unscopedNpmPackageCollection);
    let runNpmInstall = !dryRun;
    let cleanProjects = !dryRun;
    if (mode === e_mode_1.EMode.INTERACTIVE) {
        logger_util_1.LoggerUtil.printWarning("Pkgm recommends package versions based solely on their dependencies and does not account for potential breaking changes. Updating to the recommended version could break your existing code. Ensure all your changes are committed before proceeding.");
        const shouldContinue = await (0, prompts_1.select)({
            message: 'Do you want to update all packages to the recommended versions?', choices: [{
                    name: "Yes", value: true
                }, {
                    name: "No", value: false
                }], loop: false
        });
        if (!shouldContinue)
            return;
        runNpmInstall = await (0, prompts_1.select)({
            message: 'Do you want to run npm install after the package.json files are updated?', choices: [{
                    name: "Yes", value: true
                }, {
                    name: "No", value: false
                }], loop: false
        });
        cleanProjects = runNpmInstall;
    }
    if (!dryRun) {
        await versionManagerService.installRecommendedDependencies(npmPackageCollection, unscopedNpmPackageCollection, configFile, recommendedPackages, cleanProjects, runNpmInstall);
    }
};
async function executeTask(command, args) {
    const npmPackageScopes = getPackageScopes(args);
    const configFile = fileService.readConfigFile();
    let commandRunnerOptions;
    if (command.toLowerCase() === e_command_1.ECommand.EXIT.toLowerCase()) {
        console.clear();
        logger_util_1.LoggerUtil.printInfo('Goodbye!');
        process.exit(0);
    }
    switch (command.toLowerCase()) {
        case (e_command_1.ECommand.HELP.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.HELP
            };
            await commandRunner.run(configFile, async (_) => showHelp(), mode, e_include_mode_1.EIncludeMode.NONE, true, false, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.LIST.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.LIST
            };
            await commandRunner.run(configFile, async (npmPackageCollection) => await listTargets(npmPackageCollection), mode, e_include_mode_1.EIncludeMode.ALL, true, false, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.LIST_DEPENDENCIES.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.LIST_DEPENDENCIES
            };
            await commandRunner.run(configFile, async (npmPackageCollection, unscopedNpmPackageCollection) => await listTargetsWithDependencies(npmPackageCollection, unscopedNpmPackageCollection), mode, e_include_mode_1.EIncludeMode.ALL, true, false, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.LIST_SCRIPTS.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.LIST_SCRIPTS
            };
            await commandRunner.run(configFile, async (npmPackageCollection) => await listTargetsWithScripts(npmPackageCollection), mode, e_include_mode_1.EIncludeMode.ALL, false, false, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.LINK.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.LINK
            };
            await commandRunner.run(configFile, async (npmPackageCollection, unscopedNpmPackageCollection, configFile) => await linkTargets(npmPackageCollection, unscopedNpmPackageCollection, configFile), mode, e_include_mode_1.EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.UNLINK.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.UNLINK
            };
            await commandRunner.run(configFile, async (npmPackageCollection, unscopedNpmPackageCollection) => await unlinkTargets(npmPackageCollection, unscopedNpmPackageCollection), mode, e_include_mode_1.EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.VERSION_MANAGER.toLowerCase()):
            let task;
            if (mode === e_mode_1.EMode.INTERACTIVE) {
                console.clear();
                await logger_util_1.LoggerUtil.printWelcome();
                task = await (0, prompts_1.select)({
                    message: 'Choose a strategy to continue with', choices: [{
                            name: "Sync versions", value: e_version_manager_task_1.EVersionManagerTask.SYNC_VERSIONS
                        }, {
                            name: "Check packages", value: e_version_manager_task_1.EVersionManagerTask.UPDATE_VERSIONS
                        }], loop: false
                });
            }
            else {
                const input = process.argv[3];
                if (input !== e_version_manager_task_1.EVersionManagerTask.UPDATE_VERSIONS && input !== e_version_manager_task_1.EVersionManagerTask.SYNC_VERSIONS) {
                    logger.error("Unrecognized version manager task");
                    process.exit(0);
                }
                task = input;
            }
            if (task === e_version_manager_task_1.EVersionManagerTask.SYNC_VERSIONS) {
                commandRunnerOptions = {
                    command: `${e_command_1.ECommand.VERSION_MANAGER} ${task}`
                };
                await commandRunner.run(configFile, async (npmPackageCollection, unscopedNpmPackageCollection, configFile) => await versionManagerService.syncVersions(npmPackageCollection, unscopedNpmPackageCollection, configFile), mode, e_include_mode_1.EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes);
            }
            if (task === e_version_manager_task_1.EVersionManagerTask.UPDATE_VERSIONS) {
                const dryRunArg = "--dry-run";
                let dryRun = args[dryRunArg] !== undefined ? args[dryRunArg] : false;
                const runCommand = [];
                runCommand.push(task);
                if (dryRun) {
                    runCommand.push(dryRunArg);
                }
                commandRunnerOptions = {
                    command: `${command} ${runCommand.join(" ")}`
                };
                await commandRunner.run(configFile, async (npmPackageCollection, unscopedNpmPackageCollection, configFile) => await checkPackageVersions(npmPackageCollection, unscopedNpmPackageCollection, configFile, mode, dryRun), mode, e_include_mode_1.EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes);
            }
            break;
        case (e_command_1.ECommand.RUN.toLowerCase()):
        case (e_command_1.ECommand.RUN_ASYNC.toLowerCase()):
            const runAsync = command.toLowerCase() === e_command_1.ECommand.RUN_ASYNC.toLowerCase();
            let runCommand;
            let commandType;
            if (mode === e_mode_1.EMode.INTERACTIVE) {
                console.clear();
                await logger_util_1.LoggerUtil.printWelcome();
                commandType = await (0, prompts_1.select)({
                    message: 'Do you want to rerun the discovery process with a scope?', choices: [{
                            name: "npm command", value: e_command_type_1.ECommandType.NPM
                        }, {
                            name: "npm script command", value: e_command_type_1.ECommandType.NPM_SCRIPT
                        }, {
                            name: "terminal command", value: e_command_type_1.ECommandType.TERMINAL
                        }], loop: false
                });
                let promptMessage;
                if (commandType === e_command_type_1.ECommandType.NPM) {
                    promptMessage = 'Enter a npm command';
                }
                else if (commandType === e_command_type_1.ECommandType.NPM_SCRIPT) {
                    promptMessage = 'Enter a npm run command';
                }
                else if (commandType === e_command_type_1.ECommandType.TERMINAL) {
                    promptMessage = 'Enter a terminal command';
                }
                runCommand = await (0, prompts_1.input)({
                    message: promptMessage
                });
            }
            else {
                commandType = e_command_type_1.ECommandType.NPM_SCRIPT;
                runCommand = process.argv[3];
                if (runCommand === undefined) {
                    logger.error("Please provide a command");
                    process.exit(0);
                }
            }
            commandRunnerOptions = {
                command: `${e_command_1.ECommand.RUN} ${runCommand}`
            };
            await commandRunner.run(configFile, async (npmPackageCollection, _, configFile) => await npmPackageService.run(npmPackageCollection.packages, runCommand, commandType, runAsync, configFile), mode, e_include_mode_1.EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.INSTALL.toLowerCase()):
            const packageNameParameterName = "--package-name";
            let packageName;
            if (mode === e_mode_1.EMode.INTERACTIVE) {
                console.clear();
                await logger_util_1.LoggerUtil.printWelcome();
                const runType = await (0, prompts_1.select)({
                    message: 'Do you want to install a specific package?', choices: [{
                            name: `Yes ${chalk_1.default.gray("npm install [package name]")}`, value: "package"
                        }, {
                            name: `No ${chalk_1.default.gray("npm install")}`, value: "install",
                        },], loop: false, default: "package"
                });
                if (runType === "package") {
                    console.clear();
                    await logger_util_1.LoggerUtil.printWelcome();
                    packageName = await (0, prompts_1.input)({
                        message: 'Enter a package name'
                    });
                }
            }
            else {
                packageName = args[packageNameParameterName];
            }
            commandRunnerOptions = {
                command: e_command_1.ECommand.INSTALL, parameters: {
                    [packageNameParameterName]: packageName
                }
            };
            await commandRunner.run(configFile, async (npmPackageCollection, _, configFile) => await installTargets(npmPackageCollection, configFile, packageName), mode, e_include_mode_1.EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.BUILD.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.BUILD
            };
            await commandRunner.run(configFile, async (npmPackageCollection, _, configFile) => await npmProjectService.build(npmPackageCollection.projects, configFile), mode, e_include_mode_1.EIncludeMode.NONE, false, true, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.BUILD_WATCH.toLowerCase()):
            commandRunnerOptions = {
                command: e_command_1.ECommand.BUILD_WATCH
            };
            await commandRunner.run(configFile, async (npmPackageCollection, _, configFile) => await npmProjectService.buildWatch(npmPackageCollection.projects, configFile), mode, e_include_mode_1.EIncludeMode.NONE, false, true, commandRunnerOptions, npmPackageScopes);
            break;
        case (e_command_1.ECommand.REINIT.toLowerCase()):
            const includePackageLockParameterName = "--delete-package-lock";
            let includePackageLock;
            if (mode === e_mode_1.EMode.INTERACTIVE) {
                console.clear();
                await logger_util_1.LoggerUtil.printWelcome();
                includePackageLock = await (0, prompts_1.select)({
                    message: 'Include deleting package-lock.json files?', choices: [{
                            name: 'Yes', value: true
                        }, {
                            name: 'No', value: false
                        },], loop: false, default: false
                });
            }
            else {
                includePackageLock = args[includePackageLockParameterName];
            }
            commandRunnerOptions = {
                command: e_command_1.ECommand.REINIT, symlinkedProjectsOnly: true, parameters: {
                    [includePackageLockParameterName]: undefined
                }
            };
            await commandRunner.run(configFile, async (npmPackageCollection, unscopedNpmPackageCollection, configFile) => await reinit(npmPackageCollection, unscopedNpmPackageCollection, includePackageLock, configFile), mode, e_include_mode_1.EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes);
            break;
    }
}
function showHelp() {
    helpSection.render();
}
async function main() {
    console.clear();
    await logger_util_1.LoggerUtil.printWelcome();
    const command = process.argv[2];
    if (command === undefined) {
        await initSection.render();
    }
    const args = await defineArgs(command);
    return;
}
main().then(() => {
    logger_util_1.LoggerUtil.printInfo("Exiting...");
});
