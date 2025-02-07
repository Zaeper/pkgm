import {NpmClientType} from "./npm/npm-client-type";

export interface IConfigFile {
    npmClient: NpmClientType,
    viteVersion?: string | "latest",
    ngCliVersion?: string | "latest",
    workspaces?: string[];
    projects: string[];
    excludeSymlinks?: string[];
    versions?: Record<string, string>
}