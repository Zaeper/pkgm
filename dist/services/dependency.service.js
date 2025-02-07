"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyService = void 0;
const logger_1 = __importDefault(require("@ptkdev/logger"));
class DependencyService {
    getSortedProjectsByInternalDependencies(projects, workspaces) {
        const workspacePendingList = workspaces.reduce((acc, curr) => acc.set(curr.packageJson.name, curr), new Map());
        const projectPendingList = projects.reduce((acc, curr) => acc.set(curr.packageJson.name, curr), new Map());
        const addedList = [];
        const addDependencyFreeProject = (project) => {
            const projectDependencyNames = this.getSummarizedProjectInternalDependencies(project, projects);
            if (projectDependencyNames.every((projectDependencyName) => {
                return addedList.map(a => a.packageJson.name).includes(projectDependencyName);
            })) {
                addedList.push(project);
                projectPendingList.delete(project.packageJson.name);
            }
            else {
                if (!projectPendingList.has(project.packageJson.name)) {
                    projectPendingList.set(project.packageJson.name, project);
                }
            }
        };
        const addDependencyFreeWorkspace = (workspace) => {
            const projectDependencyNames = this.getSummarizedProjectInternalDependencies(workspace, projects);
            if (projectDependencyNames.every((projectDependencyName) => {
                return addedList.map(a => a.packageJson.name).includes(projectDependencyName);
            })) {
                addedList.push(workspace);
                workspacePendingList.delete(workspace.packageJson.name);
            }
            else {
                if (!workspacePendingList.has(workspace.packageJson.name)) {
                    workspacePendingList.set(workspace.packageJson.name, workspace);
                }
            }
        };
        let prevIterationPendingList = new Map();
        let index = 0;
        while (projectPendingList.size > 0 || addedList.length === 0) {
            if (index > 0 && prevIterationPendingList.size === projectPendingList.size) {
                DependencyService._LOGGER.error("Got stuck in an endless loop while resolving dependencies. This may occur due to circular dependencies.");
                break;
            }
            workspacePendingList.forEach((workspace) => {
                addDependencyFreeWorkspace(workspace);
            });
            projectPendingList.forEach((project) => {
                const isInPendingWorkspace = !![...workspacePendingList.entries()].find(([_, pendingWorkspace]) => project.path.startsWith(pendingWorkspace.path));
                if (!isInPendingWorkspace) {
                    addDependencyFreeProject(project);
                }
            });
            ++index;
        }
        return addedList;
    }
    getProjectInternalDependencies(project, allProjects) {
        var _a;
        const projectNames = allProjects.map((project) => project.packageJson.name);
        return Object.keys((_a = project.packageJson.dependencies) !== null && _a !== void 0 ? _a : {})
            .filter((key) => projectNames.includes(key));
    }
    getProjectDependencies(project) {
        var _a;
        return (_a = project.packageJson.dependencies) !== null && _a !== void 0 ? _a : {};
    }
    getProjectExternalDependencies(project, allProjects) {
        var _a;
        const projectNames = allProjects.map((project) => project.packageJson.name);
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries((_a = project.packageJson.dependencies) !== null && _a !== void 0 ? _a : {})) {
            if (!projectNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getProjectPeerInternalDependencies(project, allProjects) {
        var _a;
        const projectNames = allProjects.map((project) => project.packageJson.name);
        return Object.keys((_a = project.packageJson.peerDependencies) !== null && _a !== void 0 ? _a : {})
            .filter((key) => projectNames.includes(key));
    }
    getProjectPeerDependencies(project) {
        var _a;
        return (_a = project.packageJson.peerDependencies) !== null && _a !== void 0 ? _a : {};
    }
    getProjectPeerExternalDependencies(project, allProjects) {
        var _a;
        const projectNames = allProjects.map((project) => project.packageJson.name);
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries((_a = project.packageJson.peerDependencies) !== null && _a !== void 0 ? _a : {})) {
            if (!projectNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getProjectDevInternalDependencies(project, allProjects) {
        var _a;
        const projectNames = allProjects.map((project) => project.packageJson.name);
        return Object.keys((_a = project.packageJson.devDependencies) !== null && _a !== void 0 ? _a : {})
            .filter((key) => projectNames.includes(key));
    }
    getProjectDevDependencies(project) {
        var _a;
        return (_a = project.packageJson.devDependencies) !== null && _a !== void 0 ? _a : {};
    }
    getProjectDevExternalDependencies(project, allProjects) {
        var _a;
        const projectNames = allProjects.map((project) => project.packageJson.name);
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries((_a = project.packageJson.devDependencies) !== null && _a !== void 0 ? _a : {})) {
            if (!projectNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getSummarizedProjectInternalDependencies(project, allProjects) {
        const dependencies = this.getProjectDependencies(project);
        const devDependencies = this.getProjectDevDependencies(project);
        const peerDependencies = this.getProjectPeerDependencies(project);
        const projectNames = allProjects.map((project) => project.packageJson.name);
        const allDependencies = {
            ...peerDependencies, ...devDependencies, ...dependencies
        };
        return Object.keys(allDependencies)
            .filter((key) => projectNames.includes(key));
    }
}
exports.DependencyService = DependencyService;
DependencyService._LOGGER = new logger_1.default();
