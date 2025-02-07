"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmPackageService = void 0;
const chalk_1 = __importDefault(require("chalk"));
const json_util_1 = require("../../utils/json.util");
const logger_1 = __importDefault(require("@ptkdev/logger"));
const packageUtil_1 = require("../../utils/packageUtil");
const path_util_1 = require("../../utils/path.util");
const logger_util_1 = require("../../utils/logger.util");
const e_command_type_1 = require("../../definitions/e-command-type");
const e_npm_package_type_1 = require("../../definitions/npm/e-npm-package-type");
const fs_1 = __importDefault(require("fs"));
class NpmPackageService {
    _executionService;
    _packageType;
    static _LOGGER = new logger_1.default();
    static _NODE_MODULES_DIR_NAME = "node_modules";
    static _PACKAGE_JSON_FILE_NAME = "package.json";
    static _PACKAGE_LOCK_JSON_FILE_NAME = "package-lock.json";
    constructor(_executionService, _packageType = e_npm_package_type_1.ENpmPackageType.UNKNOWN) {
        this._executionService = _executionService;
        this._packageType = _packageType;
    }
    async getPackages(packagePaths, npmPackageScopes = {}) {
        const npmPackages = packagePaths.map((npmPackagePath) => {
            const packageJsonPath = path_util_1.PathUtil.join(npmPackagePath, NpmPackageService._PACKAGE_JSON_FILE_NAME);
            const packageJsonLockPath = path_util_1.PathUtil.join(npmPackagePath, NpmPackageService._PACKAGE_LOCK_JSON_FILE_NAME);
            const nodeModulesPath = path_util_1.PathUtil.join(npmPackagePath, NpmPackageService._NODE_MODULES_DIR_NAME);
            let packageLockJson = null;
            const doesPackageLockJsonExist = fs_1.default.existsSync(packageJsonLockPath);
            if (doesPackageLockJsonExist) {
                try {
                    packageLockJson = json_util_1.JsonUtil.readJson(packageJsonLockPath);
                }
                catch (e) {
                }
            }
            let doesNodeModulesDirectoryExists = fs_1.default.existsSync(nodeModulesPath);
            try {
                const packageJson = json_util_1.JsonUtil.readJson(packageJsonPath);
                return {
                    type: this._packageType,
                    path: npmPackagePath,
                    packageJson,
                    packageJsonPath,
                    packageLockJson,
                    packageLockJsonPath: doesPackageLockJsonExist ? packageJsonLockPath : undefined,
                    nodeModulesPath: doesNodeModulesDirectoryExists ? nodeModulesPath : undefined
                };
            }
            catch (e) {
                NpmPackageService._LOGGER.warning(`Tried to parse ${packageJsonPath} but failed. Skipping this file`);
            }
        }).filter((npmPackage) => !!npmPackage);
        return packageUtil_1.PackageUtil.filterByScopes(npmPackages, npmPackageScopes);
    }
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
    listScripts(packages) {
        packages.forEach((npmPackage) => {
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(npmPackage.packageJson.name)} ${chalk_1.default.gray(npmPackage.path)}`, 2);
            const scripts = npmPackage.packageJson.scripts;
            Object.entries(scripts ?? []).forEach(([key, value]) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.yellow(key)} ${value}`, 3);
            });
        });
    }
    async run(npmPackages, command, commandType, runAsync, configFile) {
        logger_util_1.LoggerUtil.printAction(`Running ${commandType} ${command} in target packages`);
        return this._executeScript(`${command}`, commandType, runAsync, npmPackages, configFile);
    }
    async install(packages, configFile, packageName) {
        logger_util_1.LoggerUtil.printAction(`Running npm install in target packages`);
        const npmCommand = ['install', packageName].filter(Boolean).join(" ");
        return this._executeScript(npmCommand, e_command_type_1.ECommandType.NPM, false, packages, configFile);
    }
    async _executeScript(command, commandType, runAsync = false, packages, configFile) {
        return this._executionService.executeScript(packages, command, commandType, configFile.npmClient, runAsync);
    }
}
exports.NpmPackageService = NpmPackageService;
