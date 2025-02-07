import { INpmProject } from "./npm/i-npm-project";
import { INpmWorkspace } from "./npm/i-npm-workspace";
import { INpmPackage } from "./npm/i-npm-package";
export declare class NpmPackageCollection {
    private readonly _projects;
    private readonly _workspaces;
    private readonly _projectPaths;
    private readonly _workspacePaths;
    private readonly _projectNames;
    private readonly _workspaceNames;
    private readonly _projectsLookupMap;
    private readonly _workspacesLookupMap;
    constructor(projects: INpmProject[], workspaces: INpmWorkspace[]);
    get projects(): INpmProject[];
    get workspaces(): INpmWorkspace[];
    get projectPaths(): string[];
    get workspacePaths(): string[];
    get packagePaths(): string[];
    get packages(): INpmPackage[];
    get projectNames(): string[];
    get workspaceNames(): string[];
    get packageNames(): string[];
    get projectsLookupMap(): Record<string, INpmProject>;
    get workspacesLookupMap(): Record<string, INpmWorkspace>;
    get packagesLookupMap(): Record<string, INpmPackage>;
}
