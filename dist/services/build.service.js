"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildService = void 0;
const logger_util_1 = require("../utils/logger.util");
const fs_1 = __importDefault(require("fs"));
const rimraf_1 = require("rimraf");
const e_command_type_1 = require("../definitions/e-command-type");
const path_util_1 = require("../utils/path.util");
const e_npm_package_type_1 = require("../definitions/npm/e-npm-package-type");
class BuildService {
    _linkerService;
    _executionService;
    _npmDependencyService;
    _fileService;
    static _NODE_MODULES_DIR_NAME = "node_modules";
    static _DIST_DIR_NAME = "dist";
    static _PACKAGE_LOCK_FILE_NAME = "package-lock.json";
    constructor(_linkerService, _executionService, _npmDependencyService, _fileService) {
        this._linkerService = _linkerService;
        this._executionService = _executionService;
        this._npmDependencyService = _npmDependencyService;
        this._fileService = _fileService;
    }
    async build(npmPackageCollection, unscopedNpmPackageCollection, configFile) {
        const npmPackageProcessList = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
        for (const npmPackage of npmPackageProcessList) {
            logger_util_1.LoggerUtil.printHint(npmPackage.packageJson.name);
            await this._linkerService.applyLinks(npmPackage, unscopedNpmPackageCollection, configFile);
            await this._executionService.executeScript([npmPackage], "install", e_command_type_1.ECommandType.NPM, configFile.npmClient);
            if (npmPackage.type == e_npm_package_type_1.ENpmPackageType.PROJECT) {
                await this._executionService.executeScript([npmPackage], "build", e_command_type_1.ECommandType.NPM_SCRIPT, configFile.npmClient);
                await this._fileService.createSymlinks([npmPackage], configFile);
            }
        }
    }
    async clean(npmPackageCollection, unscopedNpmPackageCollection, includePackageLock = false) {
        const packageProcessList = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
        await this._linkerService.unlink(npmPackageCollection, unscopedNpmPackageCollection);
        await this._fileService.removeSymlinks(npmPackageCollection.packages);
        for (const [index, npmPackage] of packageProcessList.entries()) {
            logger_util_1.LoggerUtil.printSection(`Process ${index + 1}/${packageProcessList.length}: Processing ${npmPackage.type.toLowerCase()}: ${npmPackage.packageJson.name}`);
            const nodeModulesDirPath = path_util_1.PathUtil.join(npmPackage.path, BuildService._NODE_MODULES_DIR_NAME);
            if (fs_1.default.existsSync(nodeModulesDirPath)) {
                logger_util_1.LoggerUtil.printStep(`Deleting ${BuildService._NODE_MODULES_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
                (0, rimraf_1.rimrafSync)(nodeModulesDirPath, { preserveRoot: false });
            }
            else {
                logger_util_1.LoggerUtil.printInfo(`${BuildService._NODE_MODULES_DIR_NAME} directory not found. Skipping deleting ${BuildService._NODE_MODULES_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
            }
            if (includePackageLock && npmPackage.packageLockJsonPath) {
                if (fs_1.default.existsSync(npmPackage.packageLockJsonPath)) {
                    logger_util_1.LoggerUtil.printStep(`Deleting ${BuildService._PACKAGE_LOCK_FILE_NAME} file in ${npmPackage.packageJson.name}`);
                    (0, rimraf_1.rimrafSync)(npmPackage.packageLockJsonPath);
                }
                else {
                    logger_util_1.LoggerUtil.printInfo(`${BuildService._PACKAGE_LOCK_FILE_NAME} file not found. Skipping deleting ${BuildService._PACKAGE_LOCK_FILE_NAME} in ${npmPackage.packageJson.name}`);
                }
            }
            const distDirPath = path_util_1.PathUtil.join(npmPackage.path, BuildService._DIST_DIR_NAME);
            if (fs_1.default.existsSync(distDirPath)) {
                logger_util_1.LoggerUtil.printStep(`Deleting ${BuildService._DIST_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
                (0, rimraf_1.rimrafSync)(distDirPath, { preserveRoot: false });
            }
            else {
                logger_util_1.LoggerUtil.printInfo(`${BuildService._DIST_DIR_NAME} directory not found. Skipping deleting ${BuildService._DIST_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
            }
        }
    }
}
exports.BuildService = BuildService;
