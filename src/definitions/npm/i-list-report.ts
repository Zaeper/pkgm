export interface IListDependency {
    version: string,
    resolved: string,
    overridden: boolean,
    dependencies: Record<string, IListDependency>
}

export interface IListReport {
    name: string;
    version?: string;
    dependencies?: Record<string, IListDependency>
}