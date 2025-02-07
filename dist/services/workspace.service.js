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
exports.WorkspaceService = void 0;
const glob_1 = require("glob");
const json_util_1 = require("../utils/json.util");
const logger_1 = __importDefault(require("@ptkdev/logger"));
const path = __importStar(require("path"));
const logger_util_1 = require("../utils/logger.util");
const fs_1 = __importDefault(require("fs"));
const rimraf_1 = require("rimraf");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const e_command_type_1 = require("../definitions/e-command-type");
const list_util_1 = require("../utils/list.util");
const path_util_1 = require("../utils/path.util");
class WorkspaceService {
    constructor(_fileService, _executionService, _linkerService, _packageService, _dependencyService, _rootDir) {
        this._fileService = _fileService;
        this._executionService = _executionService;
        this._linkerService = _linkerService;
        this._packageService = _packageService;
        this._dependencyService = _dependencyService;
        this._rootDir = _rootDir;
    }
    async list(configs, options) {
        const fetchingWorkspaceInfoSpinner = (0, ora_1.default)('Fetching workspace info').start();
        const workspaces = await this.getWorkspaces(configs, options);
        if (workspaces.length === 0) {
            fetchingWorkspaceInfoSpinner.stop();
            logger_util_1.LoggerUtil.printNote("No workspaces found");
            return;
        }
        const sortedWorkspacesListByName = workspaces.sort(((a, b) => {
            if (a.packageJson.name < b.packageJson.name) {
                return -1;
            }
            if (a.packageJson.name > b.packageJson.name) {
                return 1;
            }
            return 0;
        }));
        fetchingWorkspaceInfoSpinner.stop();
        logger_util_1.LoggerUtil.printInfo(`Found ${sortedWorkspacesListByName.length} ${sortedWorkspacesListByName.length === 1 ? 'workspace' : 'workspaces'}. Listed in alphabetical order.`);
        logger_util_1.LoggerUtil.printOutputTitle("Workspaces");
        if (sortedWorkspacesListByName.length > 0) {
            sortedWorkspacesListByName.forEach((workspace) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(workspace.packageJson.name)} ${chalk_1.default.gray(workspace.path)}`, 2);
            });
        }
        else {
            logger_util_1.LoggerUtil.printNote("No workspaces found");
        }
    }
    async listDependencies(configs, options) {
        const fetchingWorkspaceInfoSpinner = (0, ora_1.default)('Fetching workspace info').start();
        const workspaces = await this.getWorkspaces(configs, options);
        if (workspaces.length === 0) {
            fetchingWorkspaceInfoSpinner.stop();
            logger_util_1.LoggerUtil.printNote("No workspaces found");
            return;
        }
        const projects = await this._packageService.getProjects(configs, options);
        const sortedWorkspaces = this._dependencyService.getSortedProjectsByInternalDependencies([], workspaces);
        fetchingWorkspaceInfoSpinner.stop();
        logger_util_1.LoggerUtil.printInfo(`Found ${sortedWorkspaces.length} ${sortedWorkspaces.length === 1 ? 'workspace' : 'workspaces'}.`);
        logger_util_1.LoggerUtil.printOutputTitle("Workspaces");
        sortedWorkspaces.forEach((workspace) => {
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(workspace.packageJson.name)} ${chalk_1.default.gray(workspace.path)}`, 2);
            const projectDependencies = this._dependencyService.getSummarizedProjectInternalDependencies(workspace, projects);
            projectDependencies.forEach((projectDependency, index) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.white(projectDependency)} ${workspace.packageJson.private ? `${chalk_1.default.white(`->`)} ${chalk_1.default.red(`(Private)`)}` : null}`, 3);
            });
        });
    }
    async listScripts(configs, options) {
        const fetchingWorkspaceInfoSpinner = (0, ora_1.default)('Fetching project info').start();
        const workspaces = await this.getWorkspaces(configs, options);
        fetchingWorkspaceInfoSpinner.stop();
        logger_util_1.LoggerUtil.printInfo(`Found ${workspaces.length} ${workspaces.length === 1 ? 'workspace' : 'workspaces'}. Listed in alphabetical order.`);
        logger_util_1.LoggerUtil.printOutputTitle("Workspaces");
        workspaces.forEach((workspace) => {
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(workspace.packageJson.name)} ${chalk_1.default.gray(workspace.path)}`, 2);
            const scripts = workspace.packageJson.scripts;
            Object.entries(scripts !== null && scripts !== void 0 ? scripts : []).forEach(([key, value]) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.yellow(key)} ${value}`, 3);
            });
        });
    }
    async install(options) {
        logger_util_1.LoggerUtil.printAction(`Running npm install in target workspaces`);
        return this._executeScript(`install`, e_command_type_1.ECommandType.NPM, options);
    }
    async rebuild(configs, includePackageLock = false, options) {
        logger_util_1.LoggerUtil.printAction(`Running a rebuild in target workspaces. This includes deleting node_modules and dist directory.`);
        const workspaces = await this.getWorkspaces(configs, options);
        if (workspaces.length === 0) {
            logger_util_1.LoggerUtil.printNote("No workspaces affected");
            logger_util_1.LoggerUtil.printSpacing();
            return;
        }
        for (const [index, workspace] of workspaces.entries()) {
            logger_util_1.LoggerUtil.printSection(`Workspace ${index + 1}/${workspaces.length}: ${workspace.packageJson.name}`);
            const nodeModulesDirPath = path_util_1.PathUtil.join(workspace.path, WorkspaceService._NODE_MODULES_DIR_NAME);
            const distDirPath = path_util_1.PathUtil.join(workspace.path, WorkspaceService._DIST_DIR_NAME);
            const packageLockFilePath = path_util_1.PathUtil.join(workspace.path, WorkspaceService._PACKAGE_LOCK_FILE_NAME);
            if (fs_1.default.existsSync(nodeModulesDirPath)) {
                logger_util_1.LoggerUtil.printStep(`Deleting ${WorkspaceService._NODE_MODULES_DIR_NAME} directory in ${workspace.packageJson.name}`);
                (0, rimraf_1.rimrafSync)(nodeModulesDirPath, { preserveRoot: false });
            }
            else {
                logger_util_1.LoggerUtil.printInfo(`${WorkspaceService._NODE_MODULES_DIR_NAME} directory not found. Skipping deleting ${WorkspaceService._NODE_MODULES_DIR_NAME} directory in ${workspace.packageJson.name}`);
            }
            if (fs_1.default.existsSync(distDirPath)) {
                logger_util_1.LoggerUtil.printStep(`Deleting ${WorkspaceService._DIST_DIR_NAME} directory in ${workspace.packageJson.name}`);
                (0, rimraf_1.rimrafSync)(distDirPath, { preserveRoot: false });
            }
            else {
                logger_util_1.LoggerUtil.printInfo(`${WorkspaceService._DIST_DIR_NAME} directory not found. Skipping deleting ${WorkspaceService._DIST_DIR_NAME} directory in ${workspace.packageJson.name}`);
            }
            if (includePackageLock) {
                if (fs_1.default.existsSync(packageLockFilePath)) {
                    logger_util_1.LoggerUtil.printStep(`Deleting ${WorkspaceService._PACKAGE_LOCK_FILE_NAME} file in ${workspace.packageJson.name}`);
                    (0, rimraf_1.rimrafSync)(packageLockFilePath);
                }
                else {
                    logger_util_1.LoggerUtil.printInfo(`${WorkspaceService._PACKAGE_LOCK_FILE_NAME} file not found. Skipping deleting ${WorkspaceService._PACKAGE_LOCK_FILE_NAME} in ${workspace.packageJson.name}`);
                }
            }
        }
        return this.install(options);
    }
    async link(configs, options) {
        logger_util_1.LoggerUtil.printAction("Linking workspaces");
        const workspaces = await this.getWorkspaces(configs, options);
        if (workspaces.length === 0) {
            logger_util_1.LoggerUtil.printNote("No workspaces affected");
            logger_util_1.LoggerUtil.printSpacing();
            return;
        }
        const projects = await this._packageService.getProjects(configs, options);
        return await this._linkerService.link("Workspace", workspaces, projects);
    }
    async unlink(configs, options) {
        logger_util_1.LoggerUtil.printAction("Unlinking workspaces");
        const workspaces = await this.getWorkspaces(configs, options);
        if (workspaces.length === 0) {
            logger_util_1.LoggerUtil.printNote("No workspaces affected");
            logger_util_1.LoggerUtil.printSpacing();
            return;
        }
        const projects = await this._packageService.getProjects(configs, options);
        return await this._linkerService.unlink("Workspace", workspaces, projects);
    }
    async getWorkspaces(configs, options, onlyIncludeAffectedWorkspaces = true) {
        var _a;
        const workspacePaths = (_a = configs.workspaces) !== null && _a !== void 0 ? _a : [];
        const searchPatterns = workspacePaths.map((workspacePath) => {
            return path_util_1.PathUtil.join(workspacePath, WorkspaceService._PACKAGE_JSON_FILE_NAME);
        });
        const pgkmIgnoreFilePath = path_util_1.PathUtil.join(this._rootDir, WorkspaceService._PKGM_IGNORE_FILE_NAME);
        const pkgmIgnoreEntries = await list_util_1.ListUtil.readList(pgkmIgnoreFilePath);
        const ignoreList = [...WorkspaceService._IGNORE_LIST, ...pkgmIgnoreEntries];
        const packageJsonFilePaths = await (0, glob_1.glob)(searchPatterns, { ignore: ignoreList });
        const workspaces = packageJsonFilePaths.map((packageJsonPath) => {
            try {
                return {
                    path: path.dirname(packageJsonPath),
                    packageJsonPath: packageJsonPath,
                    packageJson: json_util_1.JsonUtil.readJson(packageJsonPath)
                };
            }
            catch (e) {
                WorkspaceService._LOGGER.warning(`Tried to parse ${packageJsonPath} but failed. Skipping this file`);
            }
        });
        let foundWorkspaces = [];
        for (const workspace of workspaces) {
            if (!workspace)
                continue;
            if (onlyIncludeAffectedWorkspaces) {
                if (await this._checkIfWorkspaceIsAffected(workspace, configs, options)) {
                    foundWorkspaces.push(workspace);
                }
            }
            else {
                foundWorkspaces.push(workspace);
            }
        }
        return foundWorkspaces;
    }
    async _checkIfWorkspaceIsAffected(workspace, configs, options) {
        const scopedProjects = await this._packageService.getProjects(configs, options);
        const scopedProjectPaths = scopedProjects.map(scopedProject => scopedProject.path);
        for (let scopedProjectPath of scopedProjectPaths) {
            if (scopedProjectPath.includes(workspace.path)) {
                return true;
            }
        }
        return false;
    }
    async _executeScript(command, commandType, options) {
        const configs = this._fileService.readConfigFile();
        const workspaces = await this.getWorkspaces(configs, options);
        if (workspaces.length === 0) {
            logger_util_1.LoggerUtil.printNote("No workspaces affected");
            logger_util_1.LoggerUtil.printSpacing();
            return;
        }
        return this._executionService.executeScript("Workspace", workspaces, command, commandType);
    }
}
exports.WorkspaceService = WorkspaceService;
WorkspaceService._LOGGER = new logger_1.default();
WorkspaceService._IGNORE_LIST = ['**/node_modules/**', '**/dist/**'];
WorkspaceService._PACKAGE_JSON_FILE_NAME = "package.json";
WorkspaceService._NODE_MODULES_DIR_NAME = "node_modules";
WorkspaceService._DIST_DIR_NAME = "dist";
WorkspaceService._PACKAGE_LOCK_FILE_NAME = "package-lock.json";
WorkspaceService._PKGM_IGNORE_FILE_NAME = "pkgm.ignore";
