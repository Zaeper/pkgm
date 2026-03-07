import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import {IConfigFile} from "../definitions/i-config-file";

/**
 * Service interface for managing npm package links between internal dependencies
 */
export interface ILinkerService {
    /**
     * Applies npm links for internal dependencies of a single package
     * @param npmPackage - The npm package to apply links for
     * @param unscopedNpmPackageCollection - Collection of all npm packages for dependency lookup
     * @param configFile - The pkgm configuration
     */
    applyLinks(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void>

    /**
     * Links all internal dependencies across the package collection
     * @param npmPackageCollection - Collection of scoped npm packages to link
     * @param unscopedNpmPackageCollection - Collection of all npm packages for dependency lookup
     * @param configFile - The pkgm configuration
     */
    link(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void>

    /**
     * Removes npm links and restores version numbers in package.json files
     * @param npmPackageCollection - Collection of scoped npm packages to unlink
     * @param unscopedNpmPackageCollection - Collection of all npm packages for dependency lookup
     */
    unlink(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Promise<void>
}