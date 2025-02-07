"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmPackageCollection = void 0;
const packageUtil_1 = require("../utils/packageUtil");
class NpmPackageCollection {
    _projects;
    _workspaces;
    _projectPaths;
    _workspacePaths;
    _projectNames;
    _workspaceNames;
    _projectsLookupMap;
    _workspacesLookupMap;
    constructor(projects, workspaces) {
        this._projects = projects;
        this._workspaces = workspaces;
        this._projectPaths = packageUtil_1.PackageUtil.getPaths(projects);
        this._workspacePaths = packageUtil_1.PackageUtil.getPaths(workspaces);
        this._projectNames = packageUtil_1.PackageUtil.getNames(projects);
        this._workspaceNames = packageUtil_1.PackageUtil.getNames(workspaces);
        this._projectsLookupMap = packageUtil_1.PackageUtil.getLookupMap(projects);
        this._workspacesLookupMap = packageUtil_1.PackageUtil.getLookupMap(workspaces);
    }
    get projects() {
        return this._projects;
    }
    get workspaces() {
        return this._workspaces;
    }
    get projectPaths() {
        return this._projectPaths;
    }
    get workspacePaths() {
        return this._workspacePaths;
    }
    get packagePaths() {
        return [...this._projectPaths, ...this._workspacePaths];
    }
    get packages() {
        return [...this._projects, ...this._workspaces];
    }
    get projectNames() {
        return this._projectNames;
    }
    get workspaceNames() {
        return this._workspaceNames;
    }
    get packageNames() {
        return [...this._projectNames, ...this._workspaceNames];
    }
    get projectsLookupMap() {
        return this._projectsLookupMap;
    }
    get workspacesLookupMap() {
        return this._workspacesLookupMap;
    }
    get packagesLookupMap() {
        return {
            ...this._projectsLookupMap, ...this._workspacesLookupMap
        };
    }
}
exports.NpmPackageCollection = NpmPackageCollection;
