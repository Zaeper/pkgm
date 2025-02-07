import { IPackageJson } from "../definitions/i-package-json";
import { INpmPackageScopes } from "../definitions/npm/i-npm-package-scopes";
import { INpmPackage } from "../definitions/npm/i-npm-package";
export declare class PackageUtil {
    private static readonly _LOGGER;
    private static readonly _PACKAGE_NAME_SELF;
    private static readonly _PACKAGE_JSON_FILE_NAME;
    private static readonly _PKGM_IGNORE_FILE_NAME;
    private static readonly _IGNORE_LIST;
    static getLookupMap<T extends INpmPackage>(npmPackages: T[]): Record<string, T>;
    static discoverPackagePaths(rootDir: string): Promise<string[]>;
    static getPaths(npmPackages: INpmPackage[]): string[];
    static getNames(npmPackages: INpmPackage[]): string[];
    static writePackageJson(npmPackage: INpmPackage, packageJson: IPackageJson, packageJsonFileName: string): void;
    static filterByScopes<T extends INpmPackage>(npmPackages: T[], npmPackageScopes?: INpmPackageScopes): T[];
    static pruneUnusedNpmPackageScopes<T extends INpmPackage>(npmPackages: T[], npmPackageScopes: INpmPackageScopes): INpmPackageScopes;
}
