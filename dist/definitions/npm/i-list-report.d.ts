export interface IListDependency {
    "version": string;
    "resolved": string;
    "overridden": boolean;
    "dependencies": Record<string, IListDependency>;
}
export interface IListReport {
    "version": string;
    "name": string;
    "dependencies": Record<string, IListDependency>;
}
