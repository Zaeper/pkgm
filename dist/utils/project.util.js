"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectUtil = void 0;
const path_util_1 = require("./path.util");
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("@ptkdev/logger"));
class ProjectUtil {
    static getLookupMap(projects) {
        return projects.reduce((acc, curr) => {
            return {
                ...acc,
                [curr.packageJson.name]: curr
            };
        }, {});
    }
    static writePackageJson(project, packageJson, packageJsonFileName) {
        const packageJsonFilePath = path_util_1.PathUtil.join(project.path, packageJsonFileName);
        const data = JSON.stringify(packageJson, null, 2);
        try {
            fs_1.default.writeFileSync(packageJsonFilePath, data);
        }
        catch (e) {
            ProjectUtil._LOGGER.warning(`Could not overwrite package.json for ${project.packageJson.name}`);
        }
    }
    static async getProjectProcessList(projects, workspaces, allProjects, dependencyService, options) {
        const sortedProjectsByDependencies = dependencyService.getSortedProjectsByInternalDependencies(allProjects, workspaces);
        return sortedProjectsByDependencies.reduce((acc, curr) => {
            var _a;
            const isSymlinked = !((_a = options === null || options === void 0 ? void 0 : options.excludedProjectPaths) !== null && _a !== void 0 ? _a : []).includes(curr.path);
            if (!isSymlinked) {
                const dependencyList = dependencyService.getSummarizedProjectInternalDependencies(curr, allProjects);
                const projectNames = projects.map(project => project.packageJson.name);
                const hasScopedDependencies = !projectNames.every((project) => !dependencyList.includes(project));
                if (hasScopedDependencies) {
                    acc.push(curr);
                }
            }
            else {
                acc.push(curr);
            }
            return acc;
        }, []);
    }
}
exports.ProjectUtil = ProjectUtil;
ProjectUtil._LOGGER = new logger_1.default();
