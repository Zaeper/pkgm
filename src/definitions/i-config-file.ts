import {NpmClientType} from "./npm/npm-client-type";
import {EVersionConflictStrategy} from "./e-version-conflict-strategy";

export interface IConfigFile {
    npmClient: NpmClientType,
    viteVersion?: string | "latest",
    ngCliVersion?: string | "latest",
    workspaces?: string[];
    projects: string[];
    excludeSymlinks?: string[];
    versions?: Record<string, string>,
    versionConflictStrategy?: EVersionConflictStrategy
}