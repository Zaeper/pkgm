import semver from "semver/preload";

export interface INpmPackagePeerDependency {
    version: string,
    isOptional: boolean
}

export interface INpmPackageDependencyVersionEntry {
    version: string;
    peerDependencies: Record<string, INpmPackagePeerDependency>;
    bins: Record<string, string>;
    deprecated?: string
}

export class NpmPackageDependency {
    private readonly _name: string;
    private readonly _versions: string[];
    private readonly _versionEntries: INpmPackageDependencyVersionEntry[];
    private readonly _isTypeDeclarationPackage: boolean;
    private readonly _addedBy: string

    constructor(
        name: string,
        versionEntries: INpmPackageDependencyVersionEntry[],
        isTypeDeclarationPackage: boolean,
        addedBy: string
    ) {
        this._name = name;
        this._versionEntries = this._prepareVersionEntries(versionEntries);
        this._versions = this._getVersions(this._versionEntries);
        this._isTypeDeclarationPackage = isTypeDeclarationPackage;
        this._addedBy = addedBy;
    }

    public get name(): string {
        return this._name;
    }

    public get versions(): string[] {
        return this._versions;
    }

    public get versionEntries(): INpmPackageDependencyVersionEntry[] {
        return this._versionEntries;
    }

    public get isTypeDeclarationPackage(): boolean {
        return this._isTypeDeclarationPackage;
    }

    get addedBy(): string {
        return this._addedBy;
    }

    private _prepareVersionEntries(versionEntries: INpmPackageDependencyVersionEntry[]) {
        const stableOnlyVersionEntries: INpmPackageDependencyVersionEntry[] = this._getStableOnlyVersions(versionEntries);
        return this._sortVersionEntries(stableOnlyVersionEntries);
    }

    private _getStableOnlyVersions(versionEntries: INpmPackageDependencyVersionEntry[]): INpmPackageDependencyVersionEntry[] {
        return versionEntries.filter(versionEntry => {
            return !!versionEntry.version.match(new RegExp("^\\d+\\.\\d+\\.\\d+$"))
        })
    }

    private _getVersions(versionEntries: INpmPackageDependencyVersionEntry[]): string[] {
        return versionEntries.map((versionInfo: INpmPackageDependencyVersionEntry) => versionInfo.version);
    }

    private _sortVersionEntries(versions: INpmPackageDependencyVersionEntry[]): INpmPackageDependencyVersionEntry[] {
        return [...versions].sort((
            a: INpmPackageDependencyVersionEntry,
            b: INpmPackageDependencyVersionEntry
        ): number => {
            if (semver.lt(a.version, b.version)) return 1;
            if (semver.gt(a.version, b.version)) return -1;
            return 0;
        })
    }
}