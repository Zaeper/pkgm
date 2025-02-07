export interface IPackageJson {
    name: string;
    version?: string;
    main?: string;
    private?: boolean;
    description?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    workspaces?: string[];
}
