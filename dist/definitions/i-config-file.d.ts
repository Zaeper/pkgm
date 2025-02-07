export interface IConfigFile {
    workspaces?: string[];
    projects: string[];
    excludeSymlinks?: string[];
    versions?: Record<string, string>;
}
