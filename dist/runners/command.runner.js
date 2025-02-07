"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRunner = void 0;
const logger_util_1 = require("../utils/logger.util");
const prompts_1 = require("@inquirer/prompts");
const e_mode_1 = require("../definitions/e-mode");
const chalk_1 = __importDefault(require("chalk"));
const key_prompt_util_1 = require("../utils/key-prompt.util");
const npm_package_collection_1 = require("../definitions/npm-package-collection");
const e_npm_package_type_1 = require("../definitions/npm/e-npm-package-type");
const packageUtil_1 = require("../utils/packageUtil");
const e_include_mode_1 = require("./e-include-mode");
class CommandRunner {
    _npmProjectService;
    _npmWorkspaceService;
    constructor(_npmProjectService, _npmWorkspaceService) {
        this._npmProjectService = _npmProjectService;
        this._npmWorkspaceService = _npmWorkspaceService;
    }
    async run(configFile, fn, mode, workspacesIncludeMode, silent, printTargetPackages, runnerOptions, npmPackageScopes, isInitializing) {
        await this._prepareExecution(configFile, fn, mode, workspacesIncludeMode, silent, printTargetPackages, runnerOptions, npmPackageScopes, isInitializing);
    }
    async _prepareExecution(configFile, fn, mode, workspacesIncludeMode, silent, printTargetPackages, runnerOptions, npmPackageScopes, isInitializing) {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        const unscopedNpmPackageCollection = await this._getNpmPackageCollection(configFile, workspacesIncludeMode);
        const npmPackageCollection = await this._getNpmPackageCollection(configFile, workspacesIncludeMode, npmPackageScopes);
        const prunedNpmPackageScopes = await this._getPrunedNpmPackageScopes(npmPackageCollection, npmPackageScopes);
        const command = this._assembleCommand(runnerOptions, prunedNpmPackageScopes);
        if (!!command) {
            logger_util_1.LoggerUtil.printCommand(command);
            logger_util_1.LoggerUtil.printSpacing();
        }
        if (npmPackageCollection.packages.length === 0) {
            logger_util_1.LoggerUtil.printNote("No packages affected");
            return await this._returnToMainNavigationPrompt();
        }
        if (!silent || printTargetPackages) {
            this._listAffectedPackages(npmPackageCollection, workspacesIncludeMode);
        }
        const execute = async () => {
            await fn(npmPackageCollection, unscopedNpmPackageCollection, configFile);
            if ((mode === e_mode_1.EMode.INTERACTIVE) && !isInitializing) {
                await this._returnToMainNavigationPrompt();
            }
            return;
        };
        if (mode === e_mode_1.EMode.COMMAND || silent) {
            return execute();
        }
        else {
            const promptScopesResult = await this._promptManageScopes(npmPackageCollection, unscopedNpmPackageCollection, prunedNpmPackageScopes, isInitializing);
            switch (promptScopesResult) {
                case "continue":
                    return execute();
                case "abort":
                    return;
                default:
                    return this._prepareExecution(configFile, fn, mode, workspacesIncludeMode, silent, printTargetPackages, runnerOptions, promptScopesResult, isInitializing);
            }
        }
    }
    async _getPrunedNpmPackageScopes(npmPackageCollection, npmPackageScopes) {
        let prunedNpmPackageScopes;
        if (!!npmPackageScopes) {
            prunedNpmPackageScopes = packageUtil_1.PackageUtil.pruneUnusedNpmPackageScopes(npmPackageCollection.packages, npmPackageScopes);
        }
        return prunedNpmPackageScopes;
    }
    _listAffectedPackages(npmPackageCollection, workspacesIncludeMode) {
        logger_util_1.LoggerUtil.printNote("Affected packages");
        if (workspacesIncludeMode !== e_include_mode_1.EIncludeMode.NONE) {
            this._npmWorkspaceService.list(npmPackageCollection.workspaces, e_npm_package_type_1.ENpmPackageType.WORKSPACE);
            logger_util_1.LoggerUtil.printSpacing();
        }
        this._npmProjectService.list(npmPackageCollection.projects, e_npm_package_type_1.ENpmPackageType.PROJECT);
    }
    _sortPackagesInAlphabeticalOrder(packages) {
        return packages.sort((a, b) => {
            if (a.packageJson.name > b.packageJson.name) {
                return 1;
            }
            if (a.packageJson.name < b.packageJson.name) {
                return -1;
            }
            return 0;
        });
    }
    async _returnToMainNavigationPrompt() {
        logger_util_1.LoggerUtil.printDemandActionMessage(`${chalk_1.default.bgGreen.black(`  Press ${chalk_1.default.bold.black("<ENTER>")} to return back to the main navigation  `)}`);
        return await key_prompt_util_1.KeyPromptUtil.setKeyPrompt(() => {
        }, "return");
    }
    _assembleCommand(runnerCommandOptions, npmPackageScopes) {
        if (!runnerCommandOptions.command)
            return;
        const command = ['pkgm', runnerCommandOptions.command];
        for (let parametersKey in runnerCommandOptions.parameters) {
            command.push([parametersKey, runnerCommandOptions.parameters[parametersKey]].filter(Boolean).join("="));
        }
        if (npmPackageScopes?.pathScopes) {
            npmPackageScopes.pathScopes?.forEach((pathScope) => {
                command.push('--scope-path=' + pathScope);
            });
        }
        if (npmPackageScopes?.packageNameScopes) {
            npmPackageScopes.packageNameScopes?.forEach((npmPackageScope) => {
                command.push('--scope-package-name=' + npmPackageScope);
            });
        }
        if (npmPackageScopes?.excludedPackagePaths) {
            npmPackageScopes.excludedPackagePaths.forEach((path) => {
                command.push('--exclude-path=' + path);
            });
        }
        if (npmPackageScopes?.packagePaths) {
            npmPackageScopes.packagePaths.forEach((path) => {
                command.push('--package-path=' + path);
            });
        }
        return command.join(" ");
    }
    async _promptManageScopes(npmPackageCollection, unscopedNpmPackageCollection, npmPackageScopes, isInitializing) {
        let packageNameScopes = new Set(npmPackageScopes?.packageNameScopes);
        let pathScopes = new Set(npmPackageScopes?.pathScopes);
        let excludedPackagePaths = new Set(npmPackageScopes?.excludedPackagePaths);
        let packagePaths = new Set(npmPackageScopes?.packagePaths);
        logger_util_1.LoggerUtil.printPromptTitle("Edit scopes?");
        let choices = [
            {
                name: 'Continue',
                value: 'continue',
            }, {
                name: npmPackageScopes?.pathScopes?.length ?? 0 > 0 ? 'Rerun with another path scope' : 'Add path scope',
                value: 'addPathScope'
            }, {
                name: npmPackageScopes?.packageNameScopes?.length ?? 0 > 0 ? 'Rerun with another package name scope' : 'Add package name scope',
                value: 'addPackageNameScope'
            }, {
                name: 'Exclude manually',
                value: 'excludeManually'
            }, {
                name: 'Select manually',
                value: 'selectManually'
            },
        ];
        if (npmPackageScopes?.packageNameScopes || npmPackageScopes?.pathScopes) {
            choices.push({
                name: 'Remove all scopes',
                value: 'removeAllScopes'
            });
        }
        if (!isInitializing) {
            choices.push({
                name: "Back to main navigation",
                value: "backToMainNavigation"
            });
        }
        const answer = await (0, prompts_1.select)({
            message: 'Add or remove scopes',
            choices: choices,
            loop: false
        });
        switch (answer) {
            case ("addPathScope"):
                const suggestedPathScope = this._generateScopeSuggestion(npmPackageCollection.packagePaths);
                const pathScopeInput = await (0, prompts_1.input)({
                    message: 'Enter a path scope',
                    default: suggestedPathScope ?? undefined
                });
                pathScopes = new Set([pathScopeInput]);
                break;
            case ("addPackageNameScope"):
                const packageJsonNames = npmPackageCollection.packages.map((npmPackage) => npmPackage.packageJson.name);
                const suggestedPackageNameScope = this._generateScopeSuggestion(packageJsonNames);
                const packageNameScopeInput = await (0, prompts_1.input)({
                    message: 'Enter a package name scope',
                    default: suggestedPackageNameScope ?? undefined
                });
                packageNameScopes = new Set([packageNameScopeInput]);
                break;
            case ("excludeManually"):
                const excludeManuallyExcludedPackagePaths = await this._promptExcludePackagesManually(npmPackageCollection, npmPackageScopes);
                excludedPackagePaths = new Set(excludeManuallyExcludedPackagePaths);
                break;
            case ("selectManually"):
                const selectedPackagePaths = await this._promptSelectPackagesManually(npmPackageCollection, npmPackageScopes);
                packagePaths = new Set(selectedPackagePaths);
                break;
            case ("removeAllScopes"):
                return {};
            case ("continue"):
                return "continue";
            case ("backToMainNavigation"):
                return "abort";
        }
        return {
            packageNameScopes: [...packageNameScopes],
            pathScopes: [...pathScopes],
            excludedPackagePaths: [...excludedPackagePaths],
            packagePaths: [...packagePaths]
        };
    }
    async _getNpmPackageCollection(configs, workspacesIncludeMode, projectScopes) {
        const npmProjects = await this._npmProjectService.getPackages(configs.projects, projectScopes);
        const projectPaths = npmProjects.map(npmProject => npmProject.path);
        let includedWorkspaces = [];
        if (workspacesIncludeMode !== e_include_mode_1.EIncludeMode.NONE) {
            const npmWorkspaces = await this._npmWorkspaceService.getPackages(configs.workspaces ?? [], projectScopes);
            if (workspacesIncludeMode === e_include_mode_1.EIncludeMode.ONLY_AFFECTED) {
                includedWorkspaces = npmWorkspaces.filter((workspace) => {
                    return !!projectPaths.find(projectPath => projectPath.includes(workspace.path));
                });
            }
            else {
                includedWorkspaces = npmWorkspaces;
            }
        }
        return new npm_package_collection_1.NpmPackageCollection(npmProjects, includedWorkspaces);
    }
    async _promptExcludePackagesManually(npmPackageCollection, npmPackageScopes = {}) {
        logger_util_1.LoggerUtil.printPromptTitle("Select all packages, which should be excluded.");
        const sortedNpmPackages = this._sortPackagesInAlphabeticalOrder(npmPackageCollection.packages);
        const choices = sortedNpmPackages.map((npmPackage) => {
            const isChecked = !!npmPackageScopes.excludedPackagePaths?.includes(npmPackage.path);
            return {
                name: npmPackage.packageJson.name,
                value: npmPackage.path,
                checked: isChecked
            };
        });
        return (0, prompts_1.checkbox)({
            message: "Select packages to exclude from linking",
            choices: choices,
            loop: false,
            pageSize: 50
        });
    }
    async _promptSelectPackagesManually(npmPackageCollection, npmPackageScopes = {}) {
        logger_util_1.LoggerUtil.printPromptTitle("Select all packages, which should be included.");
        const sortedNpmPackages = this._sortPackagesInAlphabeticalOrder(npmPackageCollection.packages);
        const choices = sortedNpmPackages.map((npmPackage) => {
            const isChecked = !!npmPackageScopes.packagePaths?.includes(npmPackage.path);
            return {
                name: npmPackage.packageJson.name,
                value: npmPackage.path,
                checked: isChecked
            };
        });
        return (0, prompts_1.checkbox)({
            message: "Select packages to include in linking",
            choices: choices,
            loop: false,
            pageSize: 50
        });
    }
    _generateScopeSuggestion(inputs) {
        if (inputs.length === 0)
            return null;
        const prefixCountMap = {};
        for (const str of inputs) {
            for (let i = 1; i <= str.length; i++) {
                const prefix = str.slice(0, i);
                if (prefixCountMap[prefix]) {
                    prefixCountMap[prefix]++;
                }
                else {
                    prefixCountMap[prefix] = 1;
                }
            }
        }
        let mostFrequentPrefix = null;
        let maxCount = 0;
        for (const prefix in prefixCountMap) {
            if (prefixCountMap[prefix] >= maxCount) {
                maxCount = prefixCountMap[prefix];
                if (mostFrequentPrefix?.length ?? 0 < prefix.length) {
                    mostFrequentPrefix = prefix;
                }
            }
        }
        return mostFrequentPrefix;
    }
}
exports.CommandRunner = CommandRunner;
