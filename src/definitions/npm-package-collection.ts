import {INpmProject} from "./npm/i-npm-project";
import {INpmWorkspace} from "./npm/i-npm-workspace";
import {PackageUtil} from "../utils/packageUtil";
import {INpmPackage} from "./npm/i-npm-package";

export class NpmPackageCollection {
    private readonly _projects: INpmProject[];
    private readonly _workspaces: INpmWorkspace[];
    private readonly _projectPaths: string[];
    private readonly _workspacePaths: string[];
    private readonly _projectNames: string[];
    private readonly _workspaceNames: string[];
    private readonly _projectsLookupMap: Record<string, INpmProject>;
    private readonly _workspacesLookupMap: Record<string, INpmWorkspace>;


    constructor(
        projects: INpmProject[],
        workspaces: INpmWorkspace[]
    ) {
        this._projects = projects;
        this._workspaces = workspaces;
        this._projectPaths = PackageUtil.getPaths(projects);
        this._workspacePaths = PackageUtil.getPaths(workspaces);
        this._projectNames = PackageUtil.getNames(projects);
        this._workspaceNames = PackageUtil.getNames(workspaces);
        this._projectsLookupMap = PackageUtil.getLookupMap(projects);
        this._workspacesLookupMap = PackageUtil.getLookupMap(workspaces);
    }

    public get projects(): INpmProject[] {
        return this._projects;
    }

    public get workspaces(): INpmWorkspace[] {
        return this._workspaces;
    }

    public get projectPaths(): string[] {
        return this._projectPaths;
    }

    public get workspacePaths(): string[] {
        return this._workspacePaths;
    }

    public get packagePaths(): string[] {
        return [...this._projectPaths, ...this._workspacePaths];
    }

    public get packages(): INpmPackage[] {
        return [...this._projects, ...this._workspaces];
    }


    public get projectNames(): string[] {
        return this._projectNames;
    }

    public get workspaceNames(): string[] {
        return this._workspaceNames;
    }

    public get packageNames(): string[] {
        return [...this._projectNames, ...this._workspaceNames];
    }


    get projectsLookupMap(): Record<string, INpmProject> {
        return this._projectsLookupMap;
    }

    get workspacesLookupMap(): Record<string, INpmWorkspace> {
        return this._workspacesLookupMap;
    }

    get packagesLookupMap(): Record<string, INpmPackage> {
        return {
            ...this._projectsLookupMap, ...this._workspacesLookupMap
        }
    }
}