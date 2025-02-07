import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {IConfigFile} from "../definitions/i-config-file";

export interface IBuildService {
    build(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void>;

    clean(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        includePackageLock?: boolean
    ): Promise<void>;
}