"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = void 0;
const logger_1 = __importDefault(require("@ptkdev/logger"));
const glob_1 = require("glob");
const json_util_1 = require("../utils/json.util");
const logger_util_1 = require("../utils/logger.util");
const node_path_1 = __importDefault(require("node:path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const list_util_1 = require("../utils/list.util");
const path_util_1 = require("../utils/path.util");
const e_command_type_1 = require("../definitions/e-command-type");
class PackageService {
    constructor(_fileService, _executionService, _linkerService, _dependencyService, _rootDir) {
        this._fileService = _fileService;
        this._executionService = _executionService;
        this._linkerService = _linkerService;
        this._dependencyService = _dependencyService;
        this._rootDir = _rootDir;
    }
    async discoverProjects(options) {
        const searchPatterns = [path_util_1.PathUtil.join(this._rootDir, "**")];
        const packageJsonFilePaths = await (0, glob_1.glob)(searchPatterns, { ignore: PackageService._IGNORE_LIST });
        const configs = {
            packages: packageJsonFilePaths.map(packageJsonFilePath => path_util_1.PathUtil.relative(this._rootDir, packageJsonFilePath))
        };
        return this.getProjects(configs, options);
    }
    async list(configs, options) {
        const fetchingProjectsInfoSpinner = (0, ora_1.default)('Fetching project info').start();
        const projects = await this.getProjects(configs, options);
        const sortedProjectsListByName = projects.sort(((a, b) => {
            if (a.packageJson.name < b.packageJson.name) {
                return -1;
            }
            if (a.packageJson.name > b.packageJson.name) {
                return 1;
            }
            return 0;
        }));
        fetchingProjectsInfoSpinner.stop();
        logger_util_1.LoggerUtil.printInfo(`Found ${sortedProjectsListByName.length} ${sortedProjectsListByName.length === 1 ? 'project' : 'projects'}. Listed in alphabetical order.`);
        logger_util_1.LoggerUtil.printOutputTitle("Projects");
        if (sortedProjectsListByName.length > 0) {
            sortedProjectsListByName.forEach((project) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(project.packageJson.name)} ${chalk_1.default.gray(project.path)}`, 2);
            });
        }
        else {
            logger_util_1.LoggerUtil.printNote("No projects found");
        }
    }
    async listDependencies(configs, options) {
        const fetchingProjectsInfoSpinner = (0, ora_1.default)('Fetching project info').start();
        const projects = await this.getProjects(configs, options);
        const allProjects = await this.getProjects(configs);
        const sortedProjects = this._dependencyService.getSortedProjectsByInternalDependencies(projects, []);
        fetchingProjectsInfoSpinner.stop();
        logger_util_1.LoggerUtil.printSpacing();
        logger_util_1.LoggerUtil.printInfo(`Found ${sortedProjects.length} ${sortedProjects.length === 1 ? 'project' : 'projects'}. Listed in processing order.`);
        logger_util_1.LoggerUtil.printOutputTitle("Projects");
        sortedProjects.forEach((project) => {
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(project.packageJson.name)} ${chalk_1.default.gray(project.path)}`, 2);
            const projectDependencies = this._dependencyService.getSummarizedProjectInternalDependencies(project, allProjects);
            projectDependencies.forEach((projectDependency, index) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.white(projectDependency)} ${project.packageJson.private ? `${chalk_1.default.white(`->`)} ${chalk_1.default.red(`(Private)`)}` : null}`, 3);
            });
        });
    }
    async listScripts(configs, options) {
        const fetchingProjectsInfoSpinner = (0, ora_1.default)('Fetching project info').start();
        const projects = await this.getProjects(configs, options);
        fetchingProjectsInfoSpinner.stop();
        logger_util_1.LoggerUtil.printSpacing();
        logger_util_1.LoggerUtil.printInfo(`Found ${projects.length} ${projects.length === 1 ? 'project' : 'projects'}. Listed in alphabetical order.`);
        logger_util_1.LoggerUtil.printOutputTitle("Projects");
        projects.forEach((project) => {
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(project.packageJson.name)} ${chalk_1.default.gray(project.path)}`, 2);
            const scripts = project.packageJson.scripts;
            Object.entries(scripts !== null && scripts !== void 0 ? scripts : []).forEach(([key, value]) => {
                logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.yellow(key)} ${value}`, 3);
            });
        });
    }
    async link(configs, options) {
        logger_util_1.LoggerUtil.printAction("Linking Projects");
        const linkingProjectsSpinner = (0, ora_1.default)('Linking projects').start();
        const projects = await this.getProjects(configs, options);
        const allProjects = await this.getProjects(configs);
        await this._fileService.createSymlinks(projects);
        await this._linkerService.link("Project", projects, allProjects);
        linkingProjectsSpinner.stop();
    }
    async unlink(configs, options) {
        logger_util_1.LoggerUtil.printAction("Unlinking Projects");
        const unlinkingProjectsSpinner = (0, ora_1.default)('Unlinking projects').start();
        const projects = await this.getProjects(configs, options);
        const allProjects = await this.getProjects(configs);
        await this._linkerService.unlink("Project", projects, allProjects);
        unlinkingProjectsSpinner.stop();
    }
    async run(command, commandType, runAsync, options) {
        logger_util_1.LoggerUtil.printAction(`Running ${commandType} ${command} in target projects`);
        return this._executeScript(`${command}`, commandType, runAsync, options);
    }
    async build(options) {
        logger_util_1.LoggerUtil.printAction(`Running npm build in target projects`);
        return this.run("build", e_command_type_1.ECommandType.NPM_SCRIPT, false, options);
    }
    async buildWatch(options) {
        logger_util_1.LoggerUtil.printAction(`Running npm build:watch in target projects`);
        return this.run("build:watch", e_command_type_1.ECommandType.NPM_SCRIPT, true, options);
    }
    async install(packageName, options) {
        logger_util_1.LoggerUtil.printAction(`Running npm install in target projects`);
        const npmCommand = ['install', packageName].filter(Boolean).join(" ");
        return this._executeScript(npmCommand, e_command_type_1.ECommandType.NPM, false, options);
    }
    async getProjects(configs, options) {
        const projectPaths = configs.packages;
        const directlyDeclaredProjects = await this._findProjects(projectPaths, options);
        //const projectsDeclaredInWorkspaces: IProject[] = await this._getWorkspaceProjects(configs, packageNameScopes, pathScopes);
        return [...directlyDeclaredProjects];
    }
    async _findProjects(projectPaths, options, searchInSubdirectoriesOnly = false) {
        const searchPatterns = projectPaths.map((projectPath) => {
            return path_util_1.PathUtil.join(projectPath, PackageService._PACKAGE_JSON_FILE_NAME);
        });
        const pgkmIgnoreFilePath = path_util_1.PathUtil.join(this._rootDir, PackageService._PKGM_IGNORE_FILE_NAME);
        const pkgmIgnoreEntries = await list_util_1.ListUtil.readList(pgkmIgnoreFilePath);
        const ignoreList = [...PackageService._IGNORE_LIST, ...pkgmIgnoreEntries];
        const packageJsonFilePaths = await (0, glob_1.glob)(searchPatterns, { ignore: ignoreList });
        const packageJsonFiles = packageJsonFilePaths.map((packageJsonPath) => {
            try {
                const projectPath = node_path_1.default.dirname(packageJsonPath);
                if (searchInSubdirectoriesOnly && projectPaths.map((p) => node_path_1.default.dirname(p)).includes(projectPath)) {
                    return;
                }
                const packageJson = json_util_1.JsonUtil.readJson(packageJsonPath);
                return {
                    path: projectPath,
                    packageJsonPath: packageJsonPath,
                    packageJson: packageJson
                };
            }
            catch (e) {
                PackageService._LOGGER.warning(`Tried to parse ${packageJsonPath} but failed. Skipping this file`);
            }
        });
        return packageJsonFiles.filter(Boolean).filter((project) => {
            var _a, _b, _c, _d, _e;
            const considerOnlySelected = (((_a = options === null || options === void 0 ? void 0 : options.projectPaths) !== null && _a !== void 0 ? _a : []).length) > 0;
            const isSelected = (_c = (_b = options === null || options === void 0 ? void 0 : options.projectPaths) === null || _b === void 0 ? void 0 : _b.includes(project.path)) !== null && _c !== void 0 ? _c : false;
            const isSelf = project.packageJson.name === PackageService._PACKAGE_NAME_SELF;
            if (considerOnlySelected) {
                return isSelected && !isSelf;
            }
            let isPackageNameInScope = true;
            let isProjectPathInScope = true;
            const projectShouldBeExcluded = (_e = (_d = options === null || options === void 0 ? void 0 : options.excludedProjectPaths) === null || _d === void 0 ? void 0 : _d.includes(project.path)) !== null && _e !== void 0 ? _e : false;
            if (!!(options === null || options === void 0 ? void 0 : options.packageNameScopes)) {
                isProjectPathInScope = !!options.packageNameScopes.find((packageNameScope) => {
                    return project.packageJson.name.startsWith(packageNameScope);
                });
            }
            if (!!(options === null || options === void 0 ? void 0 : options.pathScopes)) {
                isProjectPathInScope = !!options.pathScopes.find((pathScope) => {
                    return project.path.startsWith(pathScope);
                });
            }
            return isPackageNameInScope && isProjectPathInScope && !projectShouldBeExcluded && !isSelf;
        });
    }
    async _executeScript(command, commandType, runAsync = false, options) {
        const configs = this._fileService.readConfigFile();
        const projects = await this.getProjects(configs, options);
        const sortedProjects = this._dependencyService.getSortedProjectsByInternalDependencies(projects, []);
        return this._executionService.executeScript("Project", sortedProjects, command, commandType, runAsync);
    }
}
exports.PackageService = PackageService;
PackageService._PACKAGE_NAME_SELF = "@zaeper/pkgm";
PackageService._LOGGER = new logger_1.default();
PackageService._IGNORE_LIST = ['**/node_modules/**', '**/dist/**', '**/.pkgm/**'];
PackageService._PACKAGE_JSON_FILE_NAME = "package.json";
PackageService._PKGM_IGNORE_FILE_NAME = "pkgm.ignore";
