"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANpmPackageService = void 0;
const chalk_1 = __importDefault(require("chalk"));
const json_util_1 = require("../../utils/json.util");
const logger_1 = __importDefault(require("@ptkdev/logger"));
const packageUtil_1 = require("../../utils/packageUtil");
const path_util_1 = require("../../utils/path.util");
const logger_util_1 = require("../../utils/logger.util");
const e_command_type_1 = require("../../definitions/e-command-type");
class ANpmPackageService {
    _packageType;
    _executionService;
    static _LOGGER = new logger_1.default();
    static _PACKAGE_JSON_FILE_NAME = "package.json";
    constructor(_packageType, _executionService) {
        this._packageType = _packageType;
        this._executionService = _executionService;
    }
    /**
     * Fetches the npm package infos
     * @param packagePaths Path's of packages which should be parsed
     * @param npmPackageScopes Definitions of scopes, to be used to filter the npmPackageCollection
     * @returns A list of {@link INpmPackage} objects
     */
    async getPackages(packagePaths, npmPackageScopes = {}) {
        const npmPackages = packagePaths.map((npmPackagePath) => {
            const packageJsonPath = path_util_1.PathUtil.join(npmPackagePath, ANpmPackageService._PACKAGE_JSON_FILE_NAME);
            try {
                const packageJson = json_util_1.JsonUtil.readJson(packageJsonPath);
                return {
                    type: this._packageType,
                    path: npmPackagePath,
                    packageJsonPath: packageJsonPath,
                    packageJson: packageJson
                };
            }
            catch (e) {
                ANpmPackageService._LOGGER.warning(`Tried to parse ${packageJsonPath} but failed. Skipping this file`);
            }
        }).filter((npmPackage) => !!npmPackage);
        return packageUtil_1.PackageUtil.filterByScopes(npmPackages, npmPackageScopes);
    }
    /**
     * Lists npm packages
     * @param npmPackages Packages which should be listed
     * @param npmPackageType type of packages to be listed
     */
    list(npmPackages, npmPackageType) {
        const sortedPackagesListByName = npmPackages.sort(((a, b) => {
            if (a.packageJson.name < b.packageJson.name) {
                return -1;
            }
            if (a.packageJson.name > b.packageJson.name) {
                return 1;
            }
            return 0;
        }));
        const getNpmPackageTypeText = () => {
            const type = npmPackageType?.toLowerCase() ?? "package";
            if (sortedPackagesListByName.length === 1) {
                return type;
            }
            else {
                return type + "s";
            }
        };
        logger_util_1.LoggerUtil.printInfo(`Found ${sortedPackagesListByName.length} ${getNpmPackageTypeText()}. Listed in alphabetical order.`);
        logger_util_1.LoggerUtil.printOutputTitle("Packages");
        if (sortedPackagesListByName.length > 0) {
            sortedPackagesListByName.forEach((npmPackage) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(npmPackage.packageJson.name)} ${chalk_1.default.gray(npmPackage.path)}`, 2);
            });
        }
        else {
            if (npmPackages.length === 0) {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(`No ${getNpmPackageTypeText()} affected`)}`, 2);
            }
        }
    }
    /**
     * Lists all defined scripts of a package, defined in its package.json
     * @param packages List of packages, of which its scripts should be listed
     */
    listScripts(packages) {
        packages.forEach((npmPackage) => {
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(npmPackage.packageJson.name)} ${chalk_1.default.gray(npmPackage.path)}`, 2);
            const scripts = npmPackage.packageJson.scripts;
            Object.entries(scripts ?? []).forEach(([key, value]) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.yellow(key)} ${value}`, 3);
            });
        });
    }
    /**
     * Executes a command, on multiple packages
     * @param npmPackages List of npm packages in which the command should be executed in
     * @param command Command, which should be executed
     * @param commandType The type of command to be executed. See also {@link ECommandType}
     * @param runAsync Defines if the command should be executed as an async command or synchronously
     */
    async run(npmPackages, command, commandType, runAsync) {
        logger_util_1.LoggerUtil.printAction(`Running ${commandType} ${command} in target packages`);
        return this._executeScript(`${command}`, commandType, runAsync, npmPackages);
    }
    /**
     * Executes the npm install script on multiple packages.
     * This method can be used, to execute a regular npm install or to execute a npm install of a specific package
     * @param packages List of packages, where the npm install command should be executed in
     * @param packageName Specified package name to be installed in the defined packages
     */
    async install(packages, packageName) {
        logger_util_1.LoggerUtil.printAction(`Running npm install in target packages`);
        const npmCommand = ['install', packageName].filter(Boolean).join(" ");
        return this._executeScript(npmCommand, e_command_type_1.ECommandType.NPM, false, packages);
    }
    /**
     * Execute a terminal command in defined packages
     * @param command The command to be executed
     * @param commandType The type of command to be executed. See also {@link ECommandType}
     * @param runAsync Defines if the command should be executed as an async command or synchronously
     * @param packages List of packages in which the command should be executed in
     * @protected
     */
    async _executeScript(command, commandType, runAsync = false, packages) {
        return this._executionService.executeScript(packages, command, commandType, runAsync);
    }
}
exports.ANpmPackageService = ANpmPackageService;
