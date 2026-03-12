import {INpmPackage} from "../../definitions/npm/i-npm-package";
import {NpmPackageCollection} from "../../definitions/npm-package-collection";

/**
 * Service interface for analyzing and managing npm package dependencies
 */
export interface INpmDependencyService {
    /**
     * Sorts packages by their internal dependency count (least dependencies first)
     */
    getSortedNpmPackagesByInternalDependencies(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): INpmPackage[];

    /**
     * Lists all internal dependencies for packages in the collection
     */
    listInternalDependencies(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): void

    /**
     * Gets internal dependencies from the dependencies field
     */
    getNpmPackageInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Gets all dependencies from the dependencies field
     */
    getNpmPackageDependencies(npmPackage: INpmPackage): Record<string, string>;

    /**
     * Gets external dependencies from the dependencies field
     */
    getNpmPackageExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Gets internal peer dependencies
     */
    getNpmPackagePeerInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Gets all peer dependencies
     */
    getNpmPackagePeerDependencies(npmPackage: INpmPackage): Record<string, string>;

    /**
     * Gets external peer dependencies
     */
    getNpmPackagePeerExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Gets internal dev dependencies
     */
    getNpmPackageDevInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Gets all dev dependencies
     */
    getNpmPackageDevDependencies(npmPackage: INpmPackage): Record<string, string>;

    /**
     * Gets external dev dependencies
     */
    getNpmPackageDevExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Gets all internal dependencies (dependencies + devDependencies + peerDependencies)
     */
    getSummarizedNpmPackageInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Gets all external dependencies (dependencies + devDependencies + peerDependencies)
     */
    getSummarizedNpmPackageExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string>;

    /**
     * Finds all publishable packages (those with publish: scripts) that are
     * transitively affected by changes in the given paths.
     * Uses BFS through the reverse internal dependency graph.
     * @param changedPaths Paths (absolute or relative) of changed packages/libraries
     * @param npmPackageCollection Collection of all npm packages
     * @param rootDir Root directory for resolving relative paths
     * @returns Array of affected publishable packages
     */
    getAffectedPublishablePackages(
        changedPaths: string[],
        npmPackageCollection: NpmPackageCollection,
        rootDir: string
    ): INpmPackage[];
}