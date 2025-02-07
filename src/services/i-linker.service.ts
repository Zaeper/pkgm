import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import {IConfigFile} from "../definitions/i-config-file";

export interface ILinkerService {
    applyLinks(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void>

    link(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void>

    unlink(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Promise<void>
}