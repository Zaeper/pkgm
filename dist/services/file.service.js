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
exports.FileService = void 0;
const logger_1 = __importDefault(require("@ptkdev/logger"));
const fs = __importStar(require("fs"));
const Path = __importStar(require("path"));
const process = __importStar(require("process"));
const logger_util_1 = require("../utils/logger.util");
const e_command_type_1 = require("../definitions/e-command-type");
const json_util_1 = require("../utils/json.util");
const glob_1 = require("glob");
const node_path_1 = __importDefault(require("node:path"));
const list_util_1 = require("../utils/list.util");
const path_util_1 = require("../utils/path.util");
const child_process_1 = __importDefault(require("child_process"));
class FileService {
    _rootDir;
    _executionService;
    static _LOGGER = new logger_1.default();
    static _CONFIG_FILE_NAME = "pkgm.json";
    static _DIST_DIR_NAME = "dist";
    static _PACKAGE_JSON_FILE_NAME = "package.json";
    static _IGNORE_LIST = ['**/node_modules/**', '**/.pkgm/**'];
    static _PKGM_IGNORE_FILE_NAME = "pkgm.ignore";
    _configFilePath;
    constructor(_rootDir, _executionService) {
        this._rootDir = _rootDir;
        this._executionService = _executionService;
        this._configFilePath = path_util_1.PathUtil.resolve(this._rootDir, FileService._CONFIG_FILE_NAME);
    }
    checkIfConfigFileExists() {
        try {
            return fs.existsSync(this._configFilePath);
        }
        catch (e) {
            FileService._LOGGER.error(`Can't read from file-system. Please make sure the permissions are set correctly.`);
            process.exit(1);
        }
    }
    writeConfigFile(configs) {
        logger_util_1.LoggerUtil.printAction(`Writing configuration to ${FileService._CONFIG_FILE_NAME} file.`);
        const data = JSON.stringify(configs, null, 2);
        try {
            fs.writeFileSync(this._configFilePath, data);
        }
        catch (e) {
            FileService._LOGGER.warning(`Could not create ${FileService._CONFIG_FILE_NAME}`);
        }
    }
    readConfigFile() {
        let jsonData;
        try {
            jsonData = fs.readFileSync(this._configFilePath, 'utf-8');
        }
        catch (e) {
            FileService._LOGGER.error(`Can't open config file. Please make sure ${FileService._CONFIG_FILE_NAME} exists and is readable.`);
            process.exit(1);
        }
        try {
            return JSON.parse(jsonData);
        }
        catch (e) {
            FileService._LOGGER.error(`Can't read configs from ${FileService._CONFIG_FILE_NAME}. Please make sure its formatted correctly.`);
            process.exit(1);
        }
    }
    async createSymlinks(npmPackages, configFile) {
        let filteredNpmPackageList = [];
        const excludedSymlinkProjects = configFile.excludeSymlinks;
        for (const npmPackage of npmPackages) {
            const isExcludedByName = !!excludedSymlinkProjects?.includes(npmPackage.packageJson.name);
            const isExcludedByPath = !!excludedSymlinkProjects?.includes(npmPackage.path);
            if (!isExcludedByName && !isExcludedByPath) {
                filteredNpmPackageList.push({
                    ...npmPackage,
                    path: await this._getSymlinkTargetPath(npmPackage) ?? npmPackage.path,
                });
            }
        }
        await this._executionService.executeScript(filteredNpmPackageList, "link", e_command_type_1.ECommandType.NPM, configFile.npmClient);
    }
    async removeSymlinks(npmPackages) {
        const npmPackageNames = npmPackages.map(npmPackage => npmPackage.packageJson.name);
        await this._executeTerminalCommand(`npm unlink -g ${npmPackageNames.join(" ")}`);
    }
    _executeTerminalCommand(command, ignoreNonZeroExitCode = false) {
        return new Promise((resolve, reject) => {
            child_process_1.default.exec(command, {
                encoding: "utf-8"
            }, (error, stdout, stderr) => {
                if (!ignoreNonZeroExitCode) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    if (stderr) {
                        console.error(stderr);
                    }
                }
                resolve(stdout);
            });
        });
    }
    async _getSymlinkTargetPath(npmPackage) {
        let symlinkTargetPath;
        if (npmPackage.packageJson.main) {
            symlinkTargetPath = path_util_1.PathUtil.relative(this._rootDir, npmPackage.path);
        }
        else {
            const distPackageJsonPath = path_util_1.PathUtil.join(npmPackage.path, FileService._DIST_DIR_NAME, FileService._PACKAGE_JSON_FILE_NAME);
            if (fs.existsSync(distPackageJsonPath)) {
                return path_util_1.PathUtil.relative(this._rootDir, node_path_1.default.dirname(distPackageJsonPath));
            }
            else {
                const distDirCandidate = await this._getProjectDistCandidates(npmPackage);
                if (!!distDirCandidate) {
                    return path_util_1.PathUtil.relative(this._rootDir, distDirCandidate);
                }
            }
        }
        return symlinkTargetPath;
    }
    async _getProjectDistCandidates(npmPackage) {
        const searchPatterns = path_util_1.PathUtil.join(this._rootDir, "**", FileService._PACKAGE_JSON_FILE_NAME);
        const pgkmIgnoreFilePath = path_util_1.PathUtil.join(this._rootDir, FileService._PKGM_IGNORE_FILE_NAME);
        const pkgmIgnoreEntries = await list_util_1.ListUtil.readList(pgkmIgnoreFilePath);
        const ignoreList = [...FileService._IGNORE_LIST, ...pkgmIgnoreEntries];
        const packageJsonDistFilePaths = await (0, glob_1.glob)(searchPatterns, { ignore: ignoreList });
        const matchingPackageJsonFilePath = packageJsonDistFilePaths.filter((packageJsonDistFilePath) => {
            const isInDistDirectory = packageJsonDistFilePath.split("/").includes("dist");
            const packageJson = json_util_1.JsonUtil.readJson(packageJsonDistFilePath);
            const hasSamePackageName = packageJson.name === npmPackage.packageJson.name;
            return isInDistDirectory && hasSamePackageName;
        })[0];
        if (!!matchingPackageJsonFilePath) {
            const matchingPackageJsonDirPath = Path.dirname(matchingPackageJsonFilePath);
            return Promise.resolve(matchingPackageJsonDirPath);
        }
        return Promise.resolve(undefined);
    }
}
exports.FileService = FileService;
