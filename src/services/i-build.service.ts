import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {IConfigFile} from "../definitions/i-config-file";

/**
 * Service interface for building and cleaning npm packages
 */
export interface IBuildService {
    /**
     * Builds all npm packages in dependency order
     * @param npmPackageCollection - Collection of scoped npm packages to build
     * @param unscopedNpmPackageCollection - Collection of all npm packages for dependency resolution
     * @param configFile - The pkgm configuration
     */
    build(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void>;

    /**
     * Cleans build artifacts from npm packages
     * @param npmPackageCollection - Collection of scoped npm packages to clean
     * @param unscopedNpmPackageCollection - Collection of all npm packages for dependency resolution
     * @param includePackageLock - Whether to also delete package-lock.json files
     */
    clean(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        includePackageLock?: boolean
    ): Promise<void>;
}