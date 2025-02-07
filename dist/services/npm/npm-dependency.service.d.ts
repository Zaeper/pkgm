import { INpmDependencyService } from "./i-npm-dependency.service";
import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { NpmPackageCollection } from "../../definitions/npm-package-collection";
export declare class NpmDependencyService implements INpmDependencyService {
    private static readonly _LOGGER;
    getSortedNpmPackagesByInternalDependencies(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): INpmPackage[];
    listInternalDependencies(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): void;
    getNpmPackageInternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
    getNpmPackageDependencies(npmPackage: INpmPackage): Record<string, string>;
    getNpmPackageExternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
    getNpmPackagePeerInternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
    getNpmPackagePeerDependencies(npmPackage: INpmPackage): Record<string, string>;
    getNpmPackagePeerExternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
    getNpmPackageDevInternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
    getNpmPackageDevDependencies(npmPackage: INpmPackage): Record<string, string>;
    getNpmPackageDevExternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
    getSummarizedNpmPackageInternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
    getSummarizedNpmPackageExternalDependencies(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Record<string, string>;
}
