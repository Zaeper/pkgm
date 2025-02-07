import {IConfigFile} from "../definitions/i-config-file";
import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {IDependencyRecommendations} from "../definitions/npm/i-recommended-dependency";

export interface IVersionManagerService {
    syncVersions(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void>;

    getPackageVersionRecommendations(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Promise<Record<string, IDependencyRecommendations>>;

    installRecommendedDependencies(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile,
        dependencyRecommendationsMap: Record<string, IDependencyRecommendations>,
        cleanProjects: boolean,
        runNpmInstall: boolean
    ): Promise<void>;
}