import { NpmPackageCollection } from "../definitions/npm-package-collection";
import { INpmPackage } from "../definitions/npm/i-npm-package";
export interface ILinkerService {
    applyLinks(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Promise<void>;
    link(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): Promise<void>;
    unlink(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): Promise<void>;
}
