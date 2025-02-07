export interface INpmPackagePeerDependency {
    version: string;
    isOptional: boolean;
}
export interface INpmPackageDependencyVersionEntry {
    version: string;
    peerDependencies: Record<string, INpmPackagePeerDependency>;
    bins: Record<string, string>;
    deprecated?: string;
}
export declare class NpmPackageDependency {
    private readonly _name;
    private readonly _versions;
    private readonly _versionEntries;
    private readonly _isTypeDeclarationPackage;
    private readonly _addedBy;
    constructor(name: string, versionEntries: INpmPackageDependencyVersionEntry[], isTypeDeclarationPackage: boolean, addedBy: string);
    get name(): string;
    get versions(): string[];
    get versionEntries(): INpmPackageDependencyVersionEntry[];
    get isTypeDeclarationPackage(): boolean;
    get addedBy(): string;
    private _prepareVersionEntries;
    private _getStableOnlyVersions;
    private _getVersions;
    private _sortVersionEntries;
}
