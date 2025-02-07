import { IVersionManagerService } from "./i-version-manager.service";
import { IConfigFile } from "../definitions/i-config-file";
import { IExecutionService } from "./i-execution.service";
import { IAuditReport } from "../definitions/npm/i-audit-report";
import { IDependencyRecommendations, IRecommendedDependency } from "../definitions/npm/i-recommended-dependency";
import { INpmDependencyService } from "./npm/i-npm-dependency.service";
import { NpmPackageCollection } from "../definitions/npm-package-collection";
import { INpmPackage } from "../definitions/npm/i-npm-package";
import { INpmPackageOutdatedState } from "./npm/i-npm-package-outdated-state";
import { INpmPackageService } from "./npm/i-npm-package.service";
export interface INpmPackageDependencyCheckResult {
    outdatedDependenciesReport: Record<string, INpmPackageOutdatedState>;
    auditReport: IAuditReport;
    recommendedDependencies: Record<string, IRecommendedDependency>;
}
export interface INpmPackageDependencyVersionPointerData {
    lastModifiedByMap: Record<string, string>;
    requiredByMap: Record<string, string[]>;
    modifiedThroughMap: Record<string, string>;
    versionPointerMap: Record<string, number>;
    qualifiedRangeMap: Record<string, string>;
}
export declare class VersionManagerService implements IVersionManagerService {
    private readonly _executionService;
    private readonly _npmDependencyService;
    private readonly _npmPackageService;
    private static readonly _LOGGER;
    private static readonly _PACKAGE_JSON_FILE_NAME;
    private _remoteNpmPackageInfoCache;
    constructor(_executionService: IExecutionService, _npmDependencyService: INpmDependencyService, _npmPackageService: INpmPackageService<INpmPackage>);
    installRecommendedDependencies(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, dependencyRecommendationsMap: Record<string, IDependencyRecommendations>, cleanProjects: boolean, runNpmInstall: boolean): Promise<void>;
    syncVersions(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, configFile: IConfigFile): Promise<void>;
    getPackageVersionRecommendations(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): Promise<Record<string, IDependencyRecommendations>>;
    private _checkPackages;
    private _getRecommendedDependencies;
    private _printDependencyTable;
    private _runNpmAudit;
    private _getInstalledVersion;
    private _buildRecommendedPackageLookupMap;
    private _getDependencyType;
    private _getNpmPackageDependencies;
    private _getAdditionalNpmPackageDependenciesToAdd;
    private _getNpmPackageLocalDependencies;
    private _getNpmPackageDependencyVersionPointerMap;
    private _getNpmPackageDependency;
    private _getNpmPackageDependencyVersions;
    private _getNpmPackageInfo;
    private _fetchNpmPackageInfo;
    private _executeTerminalCommand;
    private _getInstalledPackages;
}
