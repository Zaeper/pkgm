/**
 * This service provides methods to manage dependency versions of a package.
 * @author Dennis Brönnimann
 * @license MIT
 */

import Table from "cli-table3";
import chalk from "chalk";
import ora, {Ora} from "ora";
import {IVersionManagerService} from "./i-version-manager.service";
import {IConfigFile} from "../definitions/i-config-file";
import {PackageUtil} from "../utils/packageUtil";
import {IPackageJson} from "../definitions/i-package-json";
import {IExecutionService} from "./i-execution.service";
import {ECommandType} from "../definitions/e-command-type";
import {LoggerUtil} from "../utils/logger.util";
import {DependencyMap} from "../definitions/dependency-map";
import child_process from "child_process";
import {EAuditVulnerabilitySeverity, IAuditReport, IAuditVulnerability} from "../definitions/npm/i-audit-report";
import {IDependencyRecommendations, IRecommendedDependency} from "../definitions/npm/i-recommended-dependency";
import {INpmDependencyService} from "./npm/i-npm-dependency.service";
import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import semver from "semver/preload";
import {INpmPackageOutdatedState} from "./npm/i-npm-package-outdated-state";
import Path from "path";
import {VersionUtil} from "../utils/version.util";
import {INpmPackageService} from "./npm/i-npm-package.service";
import {
    INpmPackageDependencyVersionEntry,
    INpmPackagePeerDependency,
    NpmPackageDependency
} from "../definitions/npm/npm-package-dependency";
import {rimrafSync} from "rimraf";
import Logger from "@ptkdev/logger";
import {EDependencyType} from "./npm/e-dependency-type";
import {INpmInfo} from "./npm/i-npm-info";

export interface INpmPackageDependencyCheckResult {
    outdatedDependenciesReport: Record<string, INpmPackageOutdatedState>
    auditReport: IAuditReport,
    recommendedDependencies: Record<string, IRecommendedDependency>
}

export interface INpmPackageDependencyVersionPointerData {
    lastModifiedByMap: Record<string, string>;
    requiredByMap: Record<string, string[]>;
    modifiedThroughMap: Record<string, string>;
    versionPointerMap: Record<string, number>;
    qualifiedRangeMap: Record<string, string>;
}

export class VersionManagerService implements IVersionManagerService {
    private static readonly _LOGGER: Logger = new Logger();
    private static readonly _PACKAGE_JSON_FILE_NAME: string = "package.json";
    private _remoteNpmPackageInfoCache: Record<string, INpmInfo[]> = {};

    constructor(private readonly _executionService: IExecutionService, private readonly _npmDependencyService: INpmDependencyService, private readonly _npmPackageService: INpmPackageService<INpmPackage>) {
    }

    public async installRecommendedDependencies(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, configFile: IConfigFile, dependencyRecommendationsMap: Record<string, IDependencyRecommendations>, cleanProjects: boolean, runNpmInstall: boolean): Promise<void> {
        LoggerUtil.printAction("Applying recommended dependencies");

        const npmPackageProcessingList: INpmPackage[] = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);

        for (let npmPackage of npmPackageProcessingList) {
            LoggerUtil.printProject(npmPackage);
            const dependencyRecommendations = dependencyRecommendationsMap[npmPackage.packageJson.name];
            const recommendedDependencies: Record<string, IRecommendedDependency> = dependencyRecommendations.dependencies;


            const dependencyEntries: Record<string, IRecommendedDependency> = this._getRecommendedDependencies(recommendedDependencies, EDependencyType.DEPENDENCY);
            const devDependencyEntries: Record<string, IRecommendedDependency> = this._getRecommendedDependencies(recommendedDependencies, EDependencyType.DEV_DEPENDENCY);
            const peerDependencyEntries: Record<string, IRecommendedDependency> = this._getRecommendedDependencies(recommendedDependencies, EDependencyType.PEER_DEPENDENCY);

            const applyRecommendedPackageVersionToDependencyMap = (currentDependencies: Record<string, string> | undefined, recommendedDependencies: Record<string, IRecommendedDependency>): Record<string, string> | undefined => {
                const updatedDependencies: Record<string, string> = {};

                Object.entries(currentDependencies ?? {}).forEach(([dependencyName, dependencyVersion]: [string, string]): void => {
                    const recommendedDependencyVersion: string | undefined = recommendedDependencies[dependencyName]?.version;

                    if (!semver.valid(dependencyVersion) || recommendedDependencyVersion === undefined) {
                        updatedDependencies[dependencyName] = dependencyVersion;
                    } else {
                        const recommendedDependencySemanticOperator: string | null = recommendedDependencies[dependencyName].semanticOperator;

                        if (recommendedDependencyVersion) {
                            updatedDependencies[dependencyName] = [recommendedDependencySemanticOperator, recommendedDependencyVersion].filter(Boolean).join("");
                        }
                    }
                });


                Object.entries(recommendedDependencies ?? {}).forEach(([recommendedDependencyName, recommendedDependency]: [string, IRecommendedDependency]) => {
                    const recommendedDependencyVersion: string = recommendedDependency.version;
                    const recommendedDependencySemanticOperator: string | null = recommendedDependency.semanticOperator;

                    if (updatedDependencies[recommendedDependencyName] !== undefined) {
                        updatedDependencies[recommendedDependencyName] = [recommendedDependencySemanticOperator, recommendedDependencyVersion].filter(Boolean).join("");
                    }
                })

                return updatedDependencies;
            }

            const updatedDependencies: Record<string, string> | undefined = applyRecommendedPackageVersionToDependencyMap(npmPackage.packageJson.dependencies, dependencyEntries);
            const updatedDevDependencies: Record<string, string> | undefined = applyRecommendedPackageVersionToDependencyMap(npmPackage.packageJson.devDependencies, devDependencyEntries);
            const updatedPeerDependencies: Record<string, string> | undefined = applyRecommendedPackageVersionToDependencyMap(npmPackage.packageJson.peerDependencies, peerDependencyEntries);


            const updatedPackageJson: IPackageJson = {
                ...npmPackage.packageJson,
                dependencies: updatedDependencies,
                devDependencies: updatedDevDependencies,
                peerDependencies: updatedPeerDependencies
            }

            LoggerUtil.printStep(`Updating package.json`);
            PackageUtil.writePackageJson(npmPackage, updatedPackageJson, VersionManagerService._PACKAGE_JSON_FILE_NAME);

            if (cleanProjects) {
                if (!!npmPackage.nodeModulesPath) {
                    LoggerUtil.printStep(`Deleting node_modules`);
                    if (!rimrafSync(npmPackage.nodeModulesPath, {preserveRoot: false})) {
                        VersionManagerService._LOGGER.error(`Can't delete node_modules. Please make sure the permissions are set correctly. Tried to delete ${npmPackage.nodeModulesPath}`);
                    }
                }

                if (!!npmPackage.packageLockJsonPath) {
                    LoggerUtil.printStep(`Deleting package-lock.json`);
                    if (!rimrafSync(npmPackage.packageLockJsonPath)) {
                        VersionManagerService._LOGGER.error(`Can't delete package-lock.json. Please make sure the permissions are set correctly. Tried to delete ${npmPackage.packageLockJsonPath}`);
                    }
                }
            }
        }

        if (runNpmInstall) {
            await this._npmPackageService.install(npmPackageProcessingList, configFile);
        }
    }


    public async syncVersions(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, configFile: IConfigFile): Promise<void> {
        const packageProcessList: INpmPackage[] = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);

        const configFileVersionList: Record<string, string> | undefined = configFile.versions;

        for (let i = 0; i < packageProcessList.length; i++) {
            const npmPackage = packageProcessList[i];
            const packageJson: IPackageJson = {
                ...npmPackage.packageJson
            }

            let isPackageJsonModified = false;

            for (const packageName in configFileVersionList) {
                if (packageJson.dependencies?.[packageName] && packageJson.dependencies?.[packageName] !== configFileVersionList[packageName]) {
                    packageJson.dependencies[packageName] = configFileVersionList[packageName];
                    isPackageJsonModified = true;
                }

                if (packageJson.devDependencies?.[packageName] && packageJson.devDependencies?.[packageName] !== configFileVersionList[packageName]) {
                    packageJson.devDependencies[packageName] = configFileVersionList[packageName];
                    isPackageJsonModified = true;
                }

                if (packageJson.peerDependencies?.[packageName] && packageJson.peerDependencies?.[packageName] !== configFileVersionList[packageName]) {
                    packageJson.peerDependencies[packageName] = configFileVersionList[packageName];
                    isPackageJsonModified = true;
                }
            }

            if (isPackageJsonModified) {
                LoggerUtil.printSection(`Process ${i + 1}/${packageProcessList.length}: Processing ${npmPackage.type.toLowerCase()}: ${npmPackage.packageJson.name}`);
                PackageUtil.writePackageJson(npmPackage, packageJson, VersionManagerService._PACKAGE_JSON_FILE_NAME);
                await this._executionService.executeScript([npmPackage], "install", ECommandType.NPM, configFile.npmClient, false);
            }
        }
    }

    public async getPackageVersionRecommendations(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): Promise<Record<string, IDependencyRecommendations>> {
        let npmPackageDependencyCheckResultMap: Record<string, INpmPackageDependencyCheckResult> = {};

        const npmPackageProcessingList: INpmPackage[] = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);

        for (let npmPackage of npmPackageProcessingList) {
            LoggerUtil.printProject(npmPackage);

            const dependencyMap: DependencyMap = this._getInstalledPackages(npmPackage, unscopedNpmPackageCollection);
            const npmPackageDependencyCheckResult: INpmPackageDependencyCheckResult = await this._checkPackages(npmPackage, dependencyMap);
            const {
                auditReport, outdatedDependenciesReport, recommendedDependencies
            } = npmPackageDependencyCheckResult;


            const dependencyEntries: Record<string, IRecommendedDependency> = this._getRecommendedDependencies(recommendedDependencies, EDependencyType.DEPENDENCY);
            const devDependencyEntries: Record<string, IRecommendedDependency> = this._getRecommendedDependencies(recommendedDependencies, EDependencyType.DEV_DEPENDENCY);
            const peerDependencyEntries: Record<string, IRecommendedDependency> = this._getRecommendedDependencies(recommendedDependencies, EDependencyType.PEER_DEPENDENCY);

            LoggerUtil.printSpacing();
            LoggerUtil.printIndented(`${chalk.yellow("Dependencies")}`, 1);
            this._printDependencyTable(npmPackage, auditReport, outdatedDependenciesReport, recommendedDependencies, dependencyEntries, dependencyMap.dependencies, "dependencies");

            LoggerUtil.printIndented(`${chalk.yellow("PeerDependencies")}`, 1);
            this._printDependencyTable(npmPackage, auditReport, outdatedDependenciesReport, recommendedDependencies, peerDependencyEntries, dependencyMap.peerDependencies, "peer-dependencies");

            LoggerUtil.printIndented(`${chalk.yellow("DevDependencies")}`, 1);
            this._printDependencyTable(npmPackage, auditReport, outdatedDependenciesReport, recommendedDependencies, devDependencyEntries, dependencyMap.devDependencies, "dev-dependencies");

            npmPackageDependencyCheckResultMap[npmPackage.packageJson.name] = npmPackageDependencyCheckResult;
        }

        return Object.entries(npmPackageDependencyCheckResultMap).reduce((acc: Record<string, IDependencyRecommendations>, [npmPackageName, npmPackageDependencyCheckResult]: [string, INpmPackageDependencyCheckResult]): Record<string, IDependencyRecommendations> => {
            acc[npmPackageName] = {
                dependencies: npmPackageDependencyCheckResult.recommendedDependencies
            }

            return acc;
        }, {});
    }

    private async _checkPackages(npmPackage: INpmPackage, dependencyMap: DependencyMap): Promise<INpmPackageDependencyCheckResult> {
        LoggerUtil.printStep(`Fetching package info.`);
        LoggerUtil.printHint(`This might take a while since every dependency will be checked via the npm repository.`)
        const fetchingPackageInfoSpinner: Ora = ora(`Checking for vulnerabilities and dependency version recommendations`).start();

        const npmPackageDependencies: NpmPackageDependency[] = await this._getNpmPackageDependencies(dependencyMap, npmPackage);

        const fetchAuditReport: Promise<IAuditReport> = this._runNpmAudit(npmPackage);


        const npmPackageDependencyVersionPointerData: INpmPackageDependencyVersionPointerData = await this._getNpmPackageDependencyVersionPointerMap(npmPackageDependencies, npmPackage, dependencyMap);
        const fetchAdditionalPeerDependencies: Promise<NpmPackageDependency[]> = this._getAdditionalNpmPackageDependenciesToAdd(dependencyMap, npmPackageDependencies, npmPackage, npmPackageDependencyVersionPointerData.versionPointerMap);

        return await Promise.all([fetchAdditionalPeerDependencies, fetchAuditReport]).then(async ([additionalPeerDependencies, auditReport]: [NpmPackageDependency[], IAuditReport]): Promise<INpmPackageDependencyCheckResult> => {
            const npmPackageDependencies: NpmPackageDependency[] = await this._getNpmPackageDependencies(dependencyMap, npmPackage, additionalPeerDependencies);
            const recommendedNpmPackageDependencyLookupMap: Record<string, IRecommendedDependency> = this._buildRecommendedPackageLookupMap(dependencyMap, npmPackageDependencies, npmPackageDependencyVersionPointerData);


            const outdatedReport: Record<string, INpmPackageOutdatedState> = npmPackageDependencies.reduce((acc: Record<string, INpmPackageOutdatedState>, npmPackageDependency: NpmPackageDependency): Record<string, INpmPackageOutdatedState> => {
                const currentInstalledVersion: string | undefined = this._getInstalledVersion(npmPackageDependency.name, npmPackage);
                const versionEntry: INpmPackageDependencyVersionEntry | undefined = npmPackageDependency.versionEntries.find((versionEntry: INpmPackageDependencyVersionEntry) => versionEntry.version === currentInstalledVersion);

                acc[npmPackageDependency.name] = {
                    currentVersion: currentInstalledVersion,
                    isOutdated: !!currentInstalledVersion && semver.lt(currentInstalledVersion, recommendedNpmPackageDependencyLookupMap[npmPackageDependency.name].version),
                    latestVersion: npmPackageDependency.versions[0],
                    deprecated: versionEntry?.deprecated
                }

                return acc;
            }, {})

            return {
                outdatedDependenciesReport: outdatedReport,
                auditReport,
                recommendedDependencies: recommendedNpmPackageDependencyLookupMap

            }
        }).finally(() => {
            fetchingPackageInfoSpinner.stop();
        })
    }

    private _getRecommendedDependencies(recommendedDependencies: Record<string, IRecommendedDependency>, dependencyType: EDependencyType): Record<string, IRecommendedDependency> {
        return Object.entries(recommendedDependencies).reduce((acc: Record<string, IRecommendedDependency>, [recommendedDependencyName, recommendedDependency]: [string, IRecommendedDependency]): Record<string, IRecommendedDependency> => {
            if (recommendedDependency.dependencyType === dependencyType) {
                acc[recommendedDependencyName] = recommendedDependency;
            }

            return acc;
        }, {})
    }

    private _printDependencyTable(npmPackage: INpmPackage, auditReport: IAuditReport, outdatedDependencyReport: Record<string, INpmPackageOutdatedState>, unscopedRecommendedDependencyVersions: Record<string, IRecommendedDependency>, recommendedDependencyVersions: Record<string, IRecommendedDependency>, dependencies: Record<string, string>, title: string) {
        const tableHeaders: string[] = ['Package Name', 'Defined', 'Installed', 'Outdated', "Newest version", "Recommended version", "Required by", 'Vulnerability']

        const table = new Table({
            head: tableHeaders
        });

        for (let [recommendedDependencyName, recommendedDependencyVersion] of Object.entries(recommendedDependencyVersions)) {
            if (!dependencies[recommendedDependencyName] && !recommendedDependencyVersion.isNewToAdd) continue;

            const recommendedDependency: IRecommendedDependency = recommendedDependencyVersion;
            const packageJsonPackageVersion: string = dependencies[recommendedDependencyName];
            const recommendedVersion: string = recommendedDependencyVersion.version;

            const getPackageName = () => {
                if (recommendedDependency.isNewToAdd) {
                    return chalk.yellow(recommendedDependencyName);
                }
                if (installedVersion && !semver.satisfies(installedVersion, recommendedVersion)) {
                    return chalk.cyan(recommendedDependencyName);
                }
                return recommendedDependencyName;
            }
            const getDefinedVersion = (): string => {
                if (recommendedDependencyVersion.isNewToAdd) {
                    return chalk.yellow("-");
                }
                return packageJsonPackageVersion;
            };
            const installedVersion: string | undefined = this._getInstalledVersion(recommendedDependencyName, npmPackage);
            const getInstalledVersionText = (): string => {
                if (installedVersion === undefined) {
                    return chalk.red("NOT INSTALLED");
                }
                return installedVersion;
            }

            const outdatedDependency: INpmPackageOutdatedState | undefined = outdatedDependencyReport[recommendedDependencyName];
            const isOutdated: boolean = recommendedDependencyVersion.isNewToAdd ? false : outdatedDependency.isOutdated;
            const getOutdatedText = (): string => {
                const outputText: string[] = [];

                if (isOutdated) {
                    outputText.push(chalk.red("TRUE"))
                } else {
                    outputText.push(chalk.green("FALSE"));
                }

                if (!!outdatedDependency.deprecated) {
                    outputText.push(chalk.bgYellow.black("  DEPRECATED  "));
                }


                return outputText.join("\n");
            }

            const getRequiredByText = (): string => {
                const requiredBySources: string[] = recommendedDependencyVersion.trace;

                return requiredBySources.map((requiredBySource: string) => {
                    if (requiredBySource === VersionManagerService._PACKAGE_JSON_FILE_NAME) {
                        return requiredBySource;
                    }
                    return chalk.yellow([requiredBySource, unscopedRecommendedDependencyVersions[requiredBySource].version].join("@"));
                }).join("\n");
            }

            const getNewestVersionText = () => {
                if (outdatedDependency.isOutdated) {
                    return outdatedDependency.latestVersion
                }
                return chalk.cyan(outdatedDependency.latestVersion)
            }

            const getRecommendedVersionText = () => {
                const semanticOperator: string | null = recommendedDependencyVersion.semanticOperator;

                let versionDeclaration: string;
                if (semanticOperator === null) {
                    versionDeclaration = recommendedVersion;
                } else {
                    versionDeclaration = `${semanticOperator}${recommendedVersion}`;
                }

                if (installedVersion && semver.satisfies(installedVersion, recommendedVersion)) {
                    return chalk.green(versionDeclaration);
                }
                return chalk.cyan(`-> ${versionDeclaration}`)
            }

            const vulnerabilityReport: IAuditVulnerability | undefined = auditReport.vulnerabilities?.[recommendedDependencyName];
            const vulnerabilitySeverity: EAuditVulnerabilitySeverity = !!vulnerabilityReport ? vulnerabilityReport.severity : EAuditVulnerabilitySeverity.NONE;

            let vulnerabilitySeverityText: string;
            switch (vulnerabilitySeverity) {
                case EAuditVulnerabilitySeverity.HIGH:
                    vulnerabilitySeverityText = chalk.bgRedBright.white.bold("  HIGH  ");
                    break;
                case EAuditVulnerabilitySeverity.MEDIUM:
                    vulnerabilitySeverityText = chalk.bgYellow.white.bold("  MEDIUM  ");
                    break;
                case EAuditVulnerabilitySeverity.LOW:
                    vulnerabilitySeverityText = chalk.bgCyan.white.bold("  MEDIUM  ");
                    break;
                default:
                    vulnerabilitySeverityText = chalk.green("  NONE FOUND  ");
            }

            table.push([getPackageName(), getDefinedVersion(), getInstalledVersionText(), getOutdatedText(), getNewestVersionText(), getRecommendedVersionText(), getRequiredByText(), vulnerabilitySeverityText]);

            const versionNotes: string[] = [];

            if (!!outdatedDependency.deprecated) {
                versionNotes.push(`${chalk.bgMagenta("  Deprecation warning  ")} ${chalk.magenta(outdatedDependency.deprecated.replaceAll(". ", ".\n"))}`);
            }

            if (recommendedDependencyVersion.isNewToAdd) {
                const peerDependencyFrom: string = [recommendedDependencyVersion.trace[0], unscopedRecommendedDependencyVersions[recommendedDependencyVersion.trace[0]].version].join("@");
                versionNotes.push(`${chalk.bgMagenta("  New package  ")} ${chalk.magenta(`This package will be added to your package.json as it is a required peerDependency of ${peerDependencyFrom}.`)}`);
            }

            if (!!recommendedDependencyVersion.modifiedThrough) {
                const modifiedThroughSource: string | undefined = recommendedDependencyVersion.modifiedThrough;
                if (!!modifiedThroughSource && installedVersion && !semver.satisfies(installedVersion, recommendedDependencyVersion.version)) {
                    const modifiedThroughPackage: string = [modifiedThroughSource, unscopedRecommendedDependencyVersions[modifiedThroughSource].version].join("@");
                    versionNotes.push(`${chalk.bgMagenta("  Latest version not recommended  ")} ${chalk.magenta(`A lower version of this package is recommended to align with the peerDependencies definitions of ${modifiedThroughPackage}.`)}`);
                }
            }

            if (versionNotes.length > 0) {
                table.push([{
                    colSpan: tableHeaders.length, content: versionNotes.join("\n"), hAlign: "left", vAlign: "center"
                }])
            }
        }

        if (table.length === 0) {
            table.push([{
                colSpan: tableHeaders.length, content: `No ${title} found`, hAlign: "center", vAlign: "center"
            }])
        }
        LoggerUtil.printIndented(table.toString(), 2);
    }

    private async _runNpmAudit(npmPackage: INpmPackage): Promise<IAuditReport> {
        const command: string = "npm audit --json";

        try {
            const output: string = await this._executeTerminalCommand(npmPackage, command, true);
            return JSON.parse(output);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    private _getInstalledVersion(packageJsonPackageName: string, npmPackage: INpmPackage): string | undefined {
        const packageJsonLockPackagePath: string = Path.join("node_modules", packageJsonPackageName);
        const installedVersion: string | undefined = npmPackage.packageLockJson?.packages[packageJsonLockPackagePath]?.version;

        if (installedVersion === undefined) return;

        const coercedInstalledVersion = semver.coerce(installedVersion);

        return coercedInstalledVersion!.toString();
    }

    private _buildRecommendedPackageLookupMap(dependencyMap: DependencyMap, npmPackageDependencies: NpmPackageDependency[], npmPackageDependencyVersionPointerData: INpmPackageDependencyVersionPointerData): Record<string, IRecommendedDependency> {
        const dependencyNames: string[] = Object.keys(dependencyMap.summarizedDependencies);

        return npmPackageDependencies.reduce((acc: Record<string, IRecommendedDependency>, npmPackageDependency: NpmPackageDependency): Record<string, IRecommendedDependency> => {
            const {
                versionPointerMap, requiredByMap, modifiedThroughMap, qualifiedRangeMap
            } = npmPackageDependencyVersionPointerData;
            const npmPackageDependencyName: string = npmPackageDependency.name;
            const npmPackageDependencyVersionPointer: number = versionPointerMap[npmPackageDependencyName] ?? 0;
            const npmPackageDependencyVersionEntry: INpmPackageDependencyVersionEntry = npmPackageDependency.versionEntries[npmPackageDependencyVersionPointer];
            const npmPackageDependencyVersion: string = npmPackageDependencyVersionEntry.version;
            const npmPackageDependencyQualifiedVersionRange: string | undefined = qualifiedRangeMap[npmPackageDependencyName];
            const npmPackageDependencyRequiredBy: string[] = requiredByMap[npmPackageDependencyName] ?? [npmPackageDependency.addedBy];
            const npmPackageDependencyModifiedThrough: string | undefined = modifiedThroughMap[npmPackageDependencyName];
            const npmPackageSemanticOperator: string | null = npmPackageDependencyQualifiedVersionRange ? VersionUtil.getVersionOperator(npmPackageDependencyVersionEntry.version, npmPackageDependencyQualifiedVersionRange) : "^";
            const npmPackageDependencyType: EDependencyType = this._getDependencyType(dependencyMap, npmPackageDependency, npmPackageDependencyVersionEntry, npmPackageDependencies, versionPointerMap);
            const npmPackageDependencyIsNewToAdd: boolean = !dependencyNames.includes(npmPackageDependencyName);

            acc[npmPackageDependencyName] = {
                dependencyType: npmPackageDependencyType,
                version: npmPackageDependencyVersion,
                semanticOperator: npmPackageSemanticOperator,
                trace: npmPackageDependencyRequiredBy,
                isNewToAdd: npmPackageDependencyIsNewToAdd,
                modifiedThrough: npmPackageDependencyModifiedThrough,
                deprecated: npmPackageDependencyVersionEntry.deprecated
            }

            return acc;
        }, {})
    }

    private _getDependencyType(dependencyMap: DependencyMap, npmPackageDependency: NpmPackageDependency, versionEntry: INpmPackageDependencyVersionEntry, npmPackageDependencies: NpmPackageDependency[], versionPointerMap: Record<string, number>): EDependencyType {
        const npmPackageDependencyName: string = npmPackageDependency.name;
        const hasBin: boolean = Object.entries(versionEntry.bins).length > 0;
        const isTypeDeclarationPackage: boolean = npmPackageDependency.isTypeDeclarationPackage;

        if (Object.keys(dependencyMap.dependencies).includes(npmPackageDependencyName)) {
            return EDependencyType.DEPENDENCY;
        }
        if (Object.keys(dependencyMap.peerDependencies).includes(npmPackageDependencyName)) {
            return EDependencyType.PEER_DEPENDENCY;
        }
        if (Object.keys(dependencyMap.devDependencies).includes(npmPackageDependencyName) || hasBin || isTypeDeclarationPackage) {
            return EDependencyType.DEV_DEPENDENCY;
        }

        if (npmPackageDependency.addedBy !== VersionManagerService._PACKAGE_JSON_FILE_NAME) {
            const addedByPackageDependency: NpmPackageDependency | undefined = npmPackageDependencies.find(p => p.name === npmPackageDependency.addedBy);

            if (!!addedByPackageDependency && addedByPackageDependency) {
                return this._getDependencyType(dependencyMap, addedByPackageDependency, addedByPackageDependency.versionEntries[versionPointerMap[addedByPackageDependency.name] ?? 0], npmPackageDependencies, versionPointerMap)
            }
        }


        return EDependencyType.DEPENDENCY;
    }

    private async _getNpmPackageDependencies(dependencyMap: DependencyMap, npmPackage: INpmPackage, ...additionalNpmPackageDependencies: NpmPackageDependency[][]): Promise<NpmPackageDependency[]> {
        const localNpmPackageDependencies: NpmPackageDependency[] = await this._getNpmPackageLocalDependencies(dependencyMap, npmPackage);

        return [...localNpmPackageDependencies, ...additionalNpmPackageDependencies.flat()].sort((a: NpmPackageDependency, b: NpmPackageDependency) => {
            if (a.name > b.name) return -1;
            if (a.name < b.name) return 1;
            return 0;
        });
    }

    private async _getAdditionalNpmPackageDependenciesToAdd(dependencyMap: DependencyMap, parentNpmPackageDependencies: NpmPackageDependency[], npmPackage: INpmPackage, versionPointerMap: Record<string, number>): Promise<NpmPackageDependency[]> {
        const getNpmPackagePeerDependenciesQueue: Promise<NpmPackageDependency>[] = [];

        const parentNpmPackageDependencyNames: string[] = parentNpmPackageDependencies.map(npmPackageDependency => npmPackageDependency.name);

        for (const npmPackageDependency of parentNpmPackageDependencies) {
            const npmPackageDependencyVersionEntries: INpmPackageDependencyVersionEntry[] = npmPackageDependency.versionEntries;
            const versionPointer = versionPointerMap[npmPackageDependency.name] ?? [0];
            const lastNpmPackageDependencyVersionEntry: INpmPackageDependencyVersionEntry = npmPackageDependencyVersionEntries[versionPointer];

            if (!!dependencyMap.peerDependencies[npmPackageDependency.name]) {
                continue;
            }

            const peerDependencies: Record<string, INpmPackagePeerDependency> = lastNpmPackageDependencyVersionEntry?.peerDependencies ?? [];

            for (const [peerDependencyName, peerDependency] of Object.entries(peerDependencies)) {
                if (!parentNpmPackageDependencyNames.includes(peerDependencyName) && !peerDependency.isOptional) {
                    const npmPeerPackageDependency: Promise<NpmPackageDependency> = this._getNpmPackageDependency(peerDependencyName, npmPackage, npmPackageDependency.name);
                    getNpmPackagePeerDependenciesQueue.push(npmPeerPackageDependency);
                }
            }
        }

        const npmPackagePeerDependencies: NpmPackageDependency[] = await Promise.all(getNpmPackagePeerDependenciesQueue);

        return npmPackagePeerDependencies.reduce((acc: NpmPackageDependency[], curr: NpmPackageDependency): NpmPackageDependency[] => {
            if (!acc.find(npmPackageDependency => npmPackageDependency.name === curr.name)) {
                acc.push(curr);
            }

            return acc;
        }, []);
    }

    private _getNpmPackageLocalDependencies(dependencyMap: DependencyMap, npmPackage: INpmPackage): Promise<NpmPackageDependency[]> {
        const getNpmPackageDependenciesQueue: Promise<NpmPackageDependency>[] = [];

        const dependencyNames: string[] = Object.keys(dependencyMap.summarizedDependencies);

        for (let dependencyName of dependencyNames) {
            getNpmPackageDependenciesQueue.push(this._getNpmPackageDependency(dependencyName, npmPackage));
        }

        return Promise.all(getNpmPackageDependenciesQueue);
    }

    private async _getNpmPackageDependencyVersionPointerMap(localNpmPackageDependencies: NpmPackageDependency[], npmPackage: INpmPackage, dependencyMap: DependencyMap): Promise<INpmPackageDependencyVersionPointerData> {
        const npmPackageDependencyVersionPointerMap: Record<string, number> = {};
        const lastModifiedByMap: Record<string, string> = {};
        let requiredByMap: Record<string, string[]> = {};
        const modifiedThroughMap: Record<string, string> = {};
        const qualifiedRangeMap: Record<string, string> = {};

        const satisfyNpmPackageVersions = async () => {
            requiredByMap = {};

            const additionalNpmPackagePeerDependencies: NpmPackageDependency[] = await this._getAdditionalNpmPackageDependenciesToAdd(dependencyMap, localNpmPackageDependencies, npmPackage, npmPackageDependencyVersionPointerMap)
            const npmPackageDependencies: NpmPackageDependency[] = [...localNpmPackageDependencies, ...additionalNpmPackagePeerDependencies];

            let isMadeVersionAdjustments: boolean = false;

            for (let i = 0; i < npmPackageDependencies.length; i++) {
                const dependingTargetNpmPackageDependencyIndices: number[] = [];

                const sourceNpmPackageDependency: NpmPackageDependency = npmPackageDependencies[i];
                const sourceNpmPackageDependencyName: string = sourceNpmPackageDependency.name;
                const sourceNpmPackageDependencyVersionPointer: number = npmPackageDependencyVersionPointerMap[sourceNpmPackageDependencyName] ?? 0;
                const sourceNpmPackageDependencyVersion: string = sourceNpmPackageDependency.versions[sourceNpmPackageDependencyVersionPointer];

                let preferredVersions: (string | null)[] = [];

                for (let j = 0; j < npmPackageDependencies.length; j++) {
                    if (i === j) continue;

                    const targetNpmPackageDependency: NpmPackageDependency = npmPackageDependencies[j];
                    const targetNpmPackageDependencyName: string = targetNpmPackageDependency.name;
                    const targetNpmPackageDependencyVersionEntryPointer: number = npmPackageDependencyVersionPointerMap[targetNpmPackageDependencyName] ?? 0;
                    const targetNpmPackageDependencySourceVersionRange: string | undefined = targetNpmPackageDependency.versionEntries[targetNpmPackageDependencyVersionEntryPointer]?.peerDependencies?.[sourceNpmPackageDependencyName]?.version;
                    if (targetNpmPackageDependencySourceVersionRange === undefined) {
                        continue;
                    }
                    requiredByMap[sourceNpmPackageDependencyName] = [...new Set([...(requiredByMap[sourceNpmPackageDependencyName] ?? []), targetNpmPackageDependencyName])];
                    dependingTargetNpmPackageDependencyIndices.push(j);
                    const maxSatisfyingSourceNpmPackageDependencyVersion: string | null = semver.maxSatisfying(sourceNpmPackageDependency.versions, targetNpmPackageDependencySourceVersionRange);
                    preferredVersions.push(maxSatisfyingSourceNpmPackageDependencyVersion);
                }

                const smallestPreferredVersionIndex: number = preferredVersions.reduce((smallestPreferredVersionIndex: number, preferredVersion: string | null, currentIndex: number): number => {
                    if (preferredVersion === null || semver.lte(sourceNpmPackageDependencyVersion, preferredVersion) || (smallestPreferredVersionIndex > -1 && semver.lte(preferredVersions[smallestPreferredVersionIndex]!, preferredVersion))) {
                        return smallestPreferredVersionIndex;
                    }

                    return currentIndex;
                }, -1);

                if (smallestPreferredVersionIndex > -1) {
                    const lastSourceNpmPackageDependencyModifier: NpmPackageDependency = npmPackageDependencies[dependingTargetNpmPackageDependencyIndices[smallestPreferredVersionIndex]];

                    lastModifiedByMap[sourceNpmPackageDependencyName] = lastSourceNpmPackageDependencyModifier.name;
                    qualifiedRangeMap[sourceNpmPackageDependencyName] = lastSourceNpmPackageDependencyModifier.versionEntries[npmPackageDependencyVersionPointerMap[lastSourceNpmPackageDependencyModifier.name] ?? 0]?.peerDependencies?.[sourceNpmPackageDependencyName]?.version;
                    isMadeVersionAdjustments = true;

                    const sourceNpmPackageDependencyPreferredVersionIndex: number = sourceNpmPackageDependency.versions.findIndex((version: string) => version === preferredVersions[smallestPreferredVersionIndex])
                    npmPackageDependencyVersionPointerMap[sourceNpmPackageDependencyName] = sourceNpmPackageDependencyPreferredVersionIndex;
                    const sourceNpmPackageDependencyPreferredVersion: string = sourceNpmPackageDependency.versions[sourceNpmPackageDependencyPreferredVersionIndex];

                    for (let dependingTargetNpmPackageDependencyIndex of dependingTargetNpmPackageDependencyIndices) {
                        const targetNpmPackageDependency: NpmPackageDependency = npmPackageDependencies[dependingTargetNpmPackageDependencyIndex];
                        const targetNpmPackageDependencyName: string = targetNpmPackageDependency.name;
                        const targetNpmPackageDependencyPeerDependencyEntries: Record<string, INpmPackagePeerDependency>[] = targetNpmPackageDependency.versionEntries.map((versionEntry: INpmPackageDependencyVersionEntry) => versionEntry.peerDependencies);
                        const targetNpmPackageDependencyVersionPointer: -1 | number = targetNpmPackageDependencyPeerDependencyEntries.findIndex(targetNpmPackageDependencyPeerDependencyEntry => semver.satisfies(sourceNpmPackageDependencyPreferredVersion, targetNpmPackageDependencyPeerDependencyEntry[sourceNpmPackageDependencyName]?.version));

                        if (targetNpmPackageDependencyVersionPointer > -1) {
                            npmPackageDependencyVersionPointerMap[targetNpmPackageDependencyName] = targetNpmPackageDependencyVersionPointer;
                            if (targetNpmPackageDependencyVersionPointer > 0) {
                                modifiedThroughMap[targetNpmPackageDependencyName] = sourceNpmPackageDependencyName;
                            }
                        }
                    }
                }
            }

            if (isMadeVersionAdjustments) {
                await satisfyNpmPackageVersions();
            }
        }

        await satisfyNpmPackageVersions();

        return {
            lastModifiedByMap,
            requiredByMap,
            modifiedThroughMap,
            versionPointerMap: npmPackageDependencyVersionPointerMap,
            qualifiedRangeMap
        };
    }

    private async _getNpmPackageDependency(dependencyName: string, npmPackage: INpmPackage, dependsOn?: string): Promise<NpmPackageDependency> {
        const npmPackageDependencyVersions: INpmPackageDependencyVersionEntry[] = await this._getNpmPackageDependencyVersions(dependencyName, npmPackage)

        let isTypeDeclarationPackage: boolean = dependencyName.split("/")[0] === "@types";
        const addedBy: string = dependsOn ?? VersionManagerService._PACKAGE_JSON_FILE_NAME;

        return new NpmPackageDependency(dependencyName, npmPackageDependencyVersions, isTypeDeclarationPackage, addedBy);
    }

    private async _getNpmPackageDependencyVersions(dependencyName: string, npmPackage: INpmPackage): Promise<INpmPackageDependencyVersionEntry[]> {
        const npmPackageInfos: INpmInfo[] = await this._getNpmPackageInfo(dependencyName, npmPackage);
        const npmPackageDependencyVersionEntry: INpmPackageDependencyVersionEntry[] = [];

        for (let i = 0; i < npmPackageInfos.length; i++) {
            const npmPackageInfo: INpmInfo = npmPackageInfos[i];
            const getPeerDependenciesEntries = (): Record<string, INpmPackagePeerDependency> => {
                if (!npmPackageInfo.peerDependencies) return {};

                return Object.entries(npmPackageInfo.peerDependencies).reduce((acc: Record<string, INpmPackagePeerDependency>, [peerDependencyName, peerDependencyVersion]: [string, string]): Record<string, INpmPackagePeerDependency> => {
                    const isOptional: boolean = !!npmPackageInfo.peerDependenciesMeta?.[peerDependencyName]?.optional;

                    acc[peerDependencyName] = {
                        isOptional, version: peerDependencyVersion
                    }

                    return acc;
                }, {})
            }

            npmPackageDependencyVersionEntry.push({
                version: npmPackageInfo.version,
                peerDependencies: getPeerDependenciesEntries(),
                bins: npmPackageInfo.bin ?? {},
                deprecated: npmPackageInfo.deprecated
            })
        }

        return npmPackageDependencyVersionEntry;
    }

    private async _getNpmPackageInfo(dependencyName: string, npmPackage: INpmPackage): Promise<INpmInfo[]> {
        let cachedNpmPackageInfo: INpmInfo[] | undefined = this._remoteNpmPackageInfoCache[dependencyName];
        if (cachedNpmPackageInfo === undefined) {
            this._remoteNpmPackageInfoCache[dependencyName] = await this._fetchNpmPackageInfo(dependencyName, npmPackage);
        }

        return this._remoteNpmPackageInfoCache[dependencyName];
    }

    private async _fetchNpmPackageInfo(npmPackageName: string, npmPackage: INpmPackage): Promise<INpmInfo[]> {
        const command: string = `npm info ${npmPackageName}@">=0" name version deprecated peerDependencies peerDependenciesMeta bin --json`

        function checkBrackets(input: string): boolean {
            // Trim whitespace from the input to avoid false negatives
            const trimmedInput = input.trim();

            // Check if the string starts with "{" and ends with "}"
            const startsWithCurly = trimmedInput.startsWith("[");
            const endsWithCurly = trimmedInput.endsWith("]");

            return startsWithCurly && endsWithCurly;
        }

        function checkCurlyBraces(input: string): boolean {
            // Trim whitespace from the input to avoid false negatives
            const trimmedInput = input.trim();

            // Check if the string starts with "{" and ends with "}"
            const startsWithCurly = trimmedInput.startsWith("{");
            const endsWithCurly = trimmedInput.endsWith("}");

            return startsWithCurly && endsWithCurly;
        }

        try {
            const output: string | undefined = await this._executeTerminalCommand(npmPackage, command, true);

            if (checkCurlyBraces(output)) {
                const parsedOutput: Record<string, string> = JSON.parse(output);

                const error: Record<string, string> | undefined = <Record<string, string>><unknown>(parsedOutput["error"]);

                if (error) {
                    const errorText: string = error["summary"] ?? `Failed to fetch package infos of ${npmPackageName} from the npm repository`;
                    LoggerUtil.printWarning(errorText);
                    return [];
                }
            }

            const parseObject = (input: string): INpmInfo[] => {
                return checkBrackets(input) ? JSON.parse(input) : [JSON.parse(input)]
            };

            return output ? parseObject(output) : [];
        } catch (e) {
            return Promise.reject(e);
        }
    }

    private _executeTerminalCommand(npmPackage: INpmPackage, command: string, ignoreNonZeroExitCode = false): Promise<string> {
        return new Promise((resolve, reject) => {
            child_process.exec(command, {
                encoding: "utf-8", cwd: npmPackage.path
            }, (error, stdout, stderr) => {
                if (!ignoreNonZeroExitCode) {
                    if (error) {
                        reject(error)
                        return;
                    }
                    if (stderr) {
                        console.error(stderr);
                    }
                }
                resolve(stdout)
            });
        });
    }

    private _getInstalledPackages(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection,): DependencyMap {
        const dependencies: Record<string, string> = this._npmDependencyService.getNpmPackageExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const peerDependencies: Record<string, string> = this._npmDependencyService.getNpmPackagePeerExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const devDependencies: Record<string, string> = this._npmDependencyService.getNpmPackageDevExternalDependencies(npmPackage, unscopedNpmPackageCollection);

        return new DependencyMap(dependencies, peerDependencies, devDependencies);
    }
}