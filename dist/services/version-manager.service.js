"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionManagerService = void 0;
const cli_table3_1 = __importDefault(require("cli-table3"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const packageUtil_1 = require("../utils/packageUtil");
const e_command_type_1 = require("../definitions/e-command-type");
const logger_util_1 = require("../utils/logger.util");
const dependency_map_1 = require("../definitions/dependency-map");
const child_process_1 = __importDefault(require("child_process"));
const i_audit_report_1 = require("../definitions/npm/i-audit-report");
const preload_1 = __importDefault(require("semver/preload"));
const path_1 = __importDefault(require("path"));
const version_util_1 = require("../utils/version.util");
const npm_package_dependency_1 = require("../definitions/npm/npm-package-dependency");
const rimraf_1 = require("rimraf");
const logger_1 = __importDefault(require("@ptkdev/logger"));
const e_dependency_type_1 = require("./npm/e-dependency-type");
class VersionManagerService {
    _executionService;
    _npmDependencyService;
    _npmPackageService;
    static _LOGGER = new logger_1.default();
    static _PACKAGE_JSON_FILE_NAME = "package.json";
    _remoteNpmPackageInfoCache = {};
    constructor(_executionService, _npmDependencyService, _npmPackageService) {
        this._executionService = _executionService;
        this._npmDependencyService = _npmDependencyService;
        this._npmPackageService = _npmPackageService;
    }
    async installRecommendedDependencies(npmPackageCollection, unscopedNpmPackageCollection, configFile, dependencyRecommendationsMap, cleanProjects, runNpmInstall) {
        logger_util_1.LoggerUtil.printAction("Applying recommended dependencies");
        const npmPackageProcessingList = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
        for (let npmPackage of npmPackageProcessingList) {
            logger_util_1.LoggerUtil.printProject(npmPackage);
            const dependencyRecommendations = dependencyRecommendationsMap[npmPackage.packageJson.name];
            const recommendedDependencies = dependencyRecommendations.dependencies;
            const dependencyEntries = this._getRecommendedDependencies(recommendedDependencies, e_dependency_type_1.EDependencyType.DEPENDENCY);
            const devDependencyEntries = this._getRecommendedDependencies(recommendedDependencies, e_dependency_type_1.EDependencyType.DEV_DEPENDENCY);
            const peerDependencyEntries = this._getRecommendedDependencies(recommendedDependencies, e_dependency_type_1.EDependencyType.PEER_DEPENDENCY);
            const applyRecommendedPackageVersionToDependencyMap = (currentDependencies, recommendedDependencies) => {
                const updatedDependencies = {};
                Object.entries(currentDependencies ?? {}).forEach(([dependencyName, dependencyVersion]) => {
                    const recommendedDependencyVersion = recommendedDependencies[dependencyName]?.version;
                    if (!preload_1.default.valid(dependencyVersion) || recommendedDependencyVersion === undefined) {
                        updatedDependencies[dependencyName] = dependencyVersion;
                    }
                    else {
                        const recommendedDependencySemanticOperator = recommendedDependencies[dependencyName].semanticOperator;
                        if (recommendedDependencyVersion) {
                            updatedDependencies[dependencyName] = [recommendedDependencySemanticOperator, recommendedDependencyVersion].filter(Boolean).join("");
                        }
                    }
                });
                Object.entries(recommendedDependencies ?? {}).forEach(([recommendedDependencyName, recommendedDependency]) => {
                    const recommendedDependencyVersion = recommendedDependency.version;
                    const recommendedDependencySemanticOperator = recommendedDependency.semanticOperator;
                    if (updatedDependencies[recommendedDependencyName] !== undefined) {
                        updatedDependencies[recommendedDependencyName] = [recommendedDependencySemanticOperator, recommendedDependencyVersion].filter(Boolean).join("");
                    }
                });
                return updatedDependencies;
            };
            const updatedDependencies = applyRecommendedPackageVersionToDependencyMap(npmPackage.packageJson.dependencies, dependencyEntries);
            const updatedDevDependencies = applyRecommendedPackageVersionToDependencyMap(npmPackage.packageJson.devDependencies, devDependencyEntries);
            const updatedPeerDependencies = applyRecommendedPackageVersionToDependencyMap(npmPackage.packageJson.peerDependencies, peerDependencyEntries);
            const updatedPackageJson = {
                ...npmPackage.packageJson,
                dependencies: updatedDependencies,
                devDependencies: updatedDevDependencies,
                peerDependencies: updatedPeerDependencies
            };
            logger_util_1.LoggerUtil.printStep(`Updating package.json`);
            packageUtil_1.PackageUtil.writePackageJson(npmPackage, updatedPackageJson, VersionManagerService._PACKAGE_JSON_FILE_NAME);
            if (cleanProjects) {
                if (!!npmPackage.nodeModulesPath) {
                    logger_util_1.LoggerUtil.printStep(`Deleting node_modules`);
                    if (!(0, rimraf_1.rimrafSync)(npmPackage.nodeModulesPath, { preserveRoot: false })) {
                        VersionManagerService._LOGGER.error(`Can't delete node_modules. Please make sure the permissions are set correctly. Tried to delete ${npmPackage.nodeModulesPath}`);
                    }
                }
                if (!!npmPackage.packageLockJsonPath) {
                    logger_util_1.LoggerUtil.printStep(`Deleting package-lock.json`);
                    if (!(0, rimraf_1.rimrafSync)(npmPackage.packageLockJsonPath)) {
                        VersionManagerService._LOGGER.error(`Can't delete package-lock.json. Please make sure the permissions are set correctly. Tried to delete ${npmPackage.packageLockJsonPath}`);
                    }
                }
            }
        }
        if (runNpmInstall) {
            await this._npmPackageService.install(npmPackageProcessingList, configFile);
        }
    }
    async syncVersions(npmPackageCollection, unscopedNpmPackageCollection, configFile) {
        const packageProcessList = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
        const configFileVersionList = configFile.versions;
        for (let i = 0; i < packageProcessList.length; i++) {
            const npmPackage = packageProcessList[i];
            const packageJson = {
                ...npmPackage.packageJson
            };
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
                logger_util_1.LoggerUtil.printSection(`Process ${i + 1}/${packageProcessList.length}: Processing ${npmPackage.type.toLowerCase()}: ${npmPackage.packageJson.name}`);
                packageUtil_1.PackageUtil.writePackageJson(npmPackage, packageJson, VersionManagerService._PACKAGE_JSON_FILE_NAME);
                await this._executionService.executeScript([npmPackage], "install", e_command_type_1.ECommandType.NPM, configFile.npmClient, false);
            }
        }
    }
    async getPackageVersionRecommendations(npmPackageCollection, unscopedNpmPackageCollection) {
        let npmPackageDependencyCheckResultMap = {};
        const npmPackageProcessingList = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
        for (let npmPackage of npmPackageProcessingList) {
            logger_util_1.LoggerUtil.printProject(npmPackage);
            const dependencyMap = this._getInstalledPackages(npmPackage, unscopedNpmPackageCollection);
            const npmPackageDependencyCheckResult = await this._checkPackages(npmPackage, dependencyMap);
            const { auditReport, outdatedDependenciesReport, recommendedDependencies } = npmPackageDependencyCheckResult;
            const dependencyEntries = this._getRecommendedDependencies(recommendedDependencies, e_dependency_type_1.EDependencyType.DEPENDENCY);
            const devDependencyEntries = this._getRecommendedDependencies(recommendedDependencies, e_dependency_type_1.EDependencyType.DEV_DEPENDENCY);
            const peerDependencyEntries = this._getRecommendedDependencies(recommendedDependencies, e_dependency_type_1.EDependencyType.PEER_DEPENDENCY);
            logger_util_1.LoggerUtil.printSpacing();
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.yellow("Dependencies")}`, 1);
            this._printDependencyTable(npmPackage, auditReport, outdatedDependenciesReport, recommendedDependencies, dependencyEntries, dependencyMap.dependencies, "dependencies");
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.yellow("PeerDependencies")}`, 1);
            this._printDependencyTable(npmPackage, auditReport, outdatedDependenciesReport, recommendedDependencies, peerDependencyEntries, dependencyMap.peerDependencies, "peer-dependencies");
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.yellow("DevDependencies")}`, 1);
            this._printDependencyTable(npmPackage, auditReport, outdatedDependenciesReport, recommendedDependencies, devDependencyEntries, dependencyMap.devDependencies, "dev-dependencies");
            npmPackageDependencyCheckResultMap[npmPackage.packageJson.name] = npmPackageDependencyCheckResult;
        }
        return Object.entries(npmPackageDependencyCheckResultMap).reduce((acc, [npmPackageName, npmPackageDependencyCheckResult]) => {
            acc[npmPackageName] = {
                dependencies: npmPackageDependencyCheckResult.recommendedDependencies
            };
            return acc;
        }, {});
    }
    async _checkPackages(npmPackage, dependencyMap) {
        logger_util_1.LoggerUtil.printStep(`Fetching package info.`);
        logger_util_1.LoggerUtil.printHint(`This might take a while since every dependency will be checked via the npm repository.`);
        const fetchingPackageInfoSpinner = (0, ora_1.default)(`Checking for vulnerabilities and dependency version recommendations`).start();
        const npmPackageDependencies = await this._getNpmPackageDependencies(dependencyMap, npmPackage);
        const fetchAuditReport = this._runNpmAudit(npmPackage);
        const npmPackageDependencyVersionPointerData = await this._getNpmPackageDependencyVersionPointerMap(npmPackageDependencies, npmPackage, dependencyMap);
        const fetchAdditionalPeerDependencies = this._getAdditionalNpmPackageDependenciesToAdd(dependencyMap, npmPackageDependencies, npmPackage, npmPackageDependencyVersionPointerData.versionPointerMap);
        return await Promise.all([fetchAdditionalPeerDependencies, fetchAuditReport]).then(async ([additionalPeerDependencies, auditReport]) => {
            const npmPackageDependencies = await this._getNpmPackageDependencies(dependencyMap, npmPackage, additionalPeerDependencies);
            const recommendedNpmPackageDependencyLookupMap = this._buildRecommendedPackageLookupMap(dependencyMap, npmPackageDependencies, npmPackageDependencyVersionPointerData);
            const outdatedReport = npmPackageDependencies.reduce((acc, npmPackageDependency) => {
                const currentInstalledVersion = this._getInstalledVersion(npmPackageDependency.name, npmPackage);
                const versionEntry = npmPackageDependency.versionEntries.find((versionEntry) => versionEntry.version === currentInstalledVersion);
                acc[npmPackageDependency.name] = {
                    currentVersion: currentInstalledVersion,
                    isOutdated: !!currentInstalledVersion && preload_1.default.lt(currentInstalledVersion, recommendedNpmPackageDependencyLookupMap[npmPackageDependency.name].version),
                    latestVersion: npmPackageDependency.versions[0],
                    deprecated: versionEntry?.deprecated
                };
                return acc;
            }, {});
            return {
                outdatedDependenciesReport: outdatedReport,
                auditReport,
                recommendedDependencies: recommendedNpmPackageDependencyLookupMap
            };
        }).finally(() => {
            fetchingPackageInfoSpinner.stop();
        });
    }
    _getRecommendedDependencies(recommendedDependencies, dependencyType) {
        return Object.entries(recommendedDependencies).reduce((acc, [recommendedDependencyName, recommendedDependency]) => {
            if (recommendedDependency.dependencyType === dependencyType) {
                acc[recommendedDependencyName] = recommendedDependency;
            }
            return acc;
        }, {});
    }
    _printDependencyTable(npmPackage, auditReport, outdatedDependencyReport, unscopedRecommendedDependencyVersions, recommendedDependencyVersions, dependencies, title) {
        const tableHeaders = ['Package Name', 'Defined', 'Installed', 'Outdated', "Newest version", "Recommended version", "Required by", 'Vulnerability'];
        const table = new cli_table3_1.default({
            head: tableHeaders
        });
        for (let [recommendedDependencyName, recommendedDependencyVersion] of Object.entries(recommendedDependencyVersions)) {
            if (!dependencies[recommendedDependencyName] && !recommendedDependencyVersion.isNewToAdd)
                continue;
            const recommendedDependency = recommendedDependencyVersion;
            const packageJsonPackageVersion = dependencies[recommendedDependencyName];
            const recommendedVersion = recommendedDependencyVersion.version;
            const getPackageName = () => {
                if (recommendedDependency.isNewToAdd) {
                    return chalk_1.default.yellow(recommendedDependencyName);
                }
                if (installedVersion && !preload_1.default.satisfies(installedVersion, recommendedVersion)) {
                    return chalk_1.default.cyan(recommendedDependencyName);
                }
                return recommendedDependencyName;
            };
            const getDefinedVersion = () => {
                if (recommendedDependencyVersion.isNewToAdd) {
                    return chalk_1.default.yellow("-");
                }
                return packageJsonPackageVersion;
            };
            const installedVersion = this._getInstalledVersion(recommendedDependencyName, npmPackage);
            const getInstalledVersionText = () => {
                if (installedVersion === undefined) {
                    return chalk_1.default.red("NOT INSTALLED");
                }
                return installedVersion;
            };
            const outdatedDependency = outdatedDependencyReport[recommendedDependencyName];
            const isOutdated = recommendedDependencyVersion.isNewToAdd ? false : outdatedDependency.isOutdated;
            const getOutdatedText = () => {
                const outputText = [];
                if (isOutdated) {
                    outputText.push(chalk_1.default.red("TRUE"));
                }
                else {
                    outputText.push(chalk_1.default.green("FALSE"));
                }
                if (!!outdatedDependency.deprecated) {
                    outputText.push(chalk_1.default.bgYellow.black("  DEPRECATED  "));
                }
                return outputText.join("\n");
            };
            const getRequiredByText = () => {
                const requiredBySources = recommendedDependencyVersion.trace;
                return requiredBySources.map((requiredBySource) => {
                    if (requiredBySource === VersionManagerService._PACKAGE_JSON_FILE_NAME) {
                        return requiredBySource;
                    }
                    return chalk_1.default.yellow([requiredBySource, unscopedRecommendedDependencyVersions[requiredBySource].version].join("@"));
                }).join("\n");
            };
            const getNewestVersionText = () => {
                if (outdatedDependency.isOutdated) {
                    return outdatedDependency.latestVersion;
                }
                return chalk_1.default.cyan(outdatedDependency.latestVersion);
            };
            const getRecommendedVersionText = () => {
                const semanticOperator = recommendedDependencyVersion.semanticOperator;
                let versionDeclaration;
                if (semanticOperator === null) {
                    versionDeclaration = recommendedVersion;
                }
                else {
                    versionDeclaration = `${semanticOperator}${recommendedVersion}`;
                }
                if (installedVersion && preload_1.default.satisfies(installedVersion, recommendedVersion)) {
                    return chalk_1.default.green(versionDeclaration);
                }
                return chalk_1.default.cyan(`-> ${versionDeclaration}`);
            };
            const vulnerabilityReport = auditReport.vulnerabilities?.[recommendedDependencyName];
            const vulnerabilitySeverity = !!vulnerabilityReport ? vulnerabilityReport.severity : i_audit_report_1.EAuditVulnerabilitySeverity.NONE;
            let vulnerabilitySeverityText;
            switch (vulnerabilitySeverity) {
                case i_audit_report_1.EAuditVulnerabilitySeverity.HIGH:
                    vulnerabilitySeverityText = chalk_1.default.bgRedBright.white.bold("  HIGH  ");
                    break;
                case i_audit_report_1.EAuditVulnerabilitySeverity.MEDIUM:
                    vulnerabilitySeverityText = chalk_1.default.bgYellow.white.bold("  MEDIUM  ");
                    break;
                case i_audit_report_1.EAuditVulnerabilitySeverity.LOW:
                    vulnerabilitySeverityText = chalk_1.default.bgCyan.white.bold("  MEDIUM  ");
                    break;
                default:
                    vulnerabilitySeverityText = chalk_1.default.green("  NONE FOUND  ");
            }
            table.push([getPackageName(), getDefinedVersion(), getInstalledVersionText(), getOutdatedText(), getNewestVersionText(), getRecommendedVersionText(), getRequiredByText(), vulnerabilitySeverityText]);
            const versionNotes = [];
            if (!!outdatedDependency.deprecated) {
                versionNotes.push(`${chalk_1.default.bgMagenta("  Deprecation warning  ")} ${chalk_1.default.magenta(outdatedDependency.deprecated.replaceAll(". ", ".\n"))}`);
            }
            if (recommendedDependencyVersion.isNewToAdd) {
                const peerDependencyFrom = [recommendedDependencyVersion.trace[0], unscopedRecommendedDependencyVersions[recommendedDependencyVersion.trace[0]].version].join("@");
                versionNotes.push(`${chalk_1.default.bgMagenta("  New package  ")} ${chalk_1.default.magenta(`This package will be added to your package.json as it is a required peerDependency of ${peerDependencyFrom}.`)}`);
            }
            if (!!recommendedDependencyVersion.modifiedThrough) {
                const modifiedThroughSource = recommendedDependencyVersion.modifiedThrough;
                if (!!modifiedThroughSource && installedVersion && !preload_1.default.satisfies(installedVersion, recommendedDependencyVersion.version)) {
                    const modifiedThroughPackage = [modifiedThroughSource, unscopedRecommendedDependencyVersions[modifiedThroughSource].version].join("@");
                    versionNotes.push(`${chalk_1.default.bgMagenta("  Latest version not recommended  ")} ${chalk_1.default.magenta(`A lower version of this package is recommended to align with the peerDependencies definitions of ${modifiedThroughPackage}.`)}`);
                }
            }
            if (versionNotes.length > 0) {
                table.push([{
                        colSpan: tableHeaders.length, content: versionNotes.join("\n"), hAlign: "left", vAlign: "center"
                    }]);
            }
        }
        if (table.length === 0) {
            table.push([{
                    colSpan: tableHeaders.length, content: `No ${title} found`, hAlign: "center", vAlign: "center"
                }]);
        }
        logger_util_1.LoggerUtil.printIndented(table.toString(), 2);
    }
    async _runNpmAudit(npmPackage) {
        const command = "npm audit --json";
        try {
            const output = await this._executeTerminalCommand(npmPackage, command, true);
            return JSON.parse(output);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    _getInstalledVersion(packageJsonPackageName, npmPackage) {
        const packageJsonLockPackagePath = path_1.default.join("node_modules", packageJsonPackageName);
        const installedVersion = npmPackage.packageLockJson?.packages[packageJsonLockPackagePath]?.version;
        if (installedVersion === undefined)
            return;
        const coercedInstalledVersion = preload_1.default.coerce(installedVersion);
        return coercedInstalledVersion.toString();
    }
    _buildRecommendedPackageLookupMap(dependencyMap, npmPackageDependencies, npmPackageDependencyVersionPointerData) {
        const dependencyNames = Object.keys(dependencyMap.summarizedDependencies);
        return npmPackageDependencies.reduce((acc, npmPackageDependency) => {
            const { versionPointerMap, requiredByMap, modifiedThroughMap, qualifiedRangeMap } = npmPackageDependencyVersionPointerData;
            const npmPackageDependencyName = npmPackageDependency.name;
            const npmPackageDependencyVersionPointer = versionPointerMap[npmPackageDependencyName] ?? 0;
            const npmPackageDependencyVersionEntry = npmPackageDependency.versionEntries[npmPackageDependencyVersionPointer];
            const npmPackageDependencyVersion = npmPackageDependencyVersionEntry.version;
            const npmPackageDependencyQualifiedVersionRange = qualifiedRangeMap[npmPackageDependencyName];
            const npmPackageDependencyRequiredBy = requiredByMap[npmPackageDependencyName] ?? [npmPackageDependency.addedBy];
            const npmPackageDependencyModifiedThrough = modifiedThroughMap[npmPackageDependencyName];
            const npmPackageSemanticOperator = npmPackageDependencyQualifiedVersionRange ? version_util_1.VersionUtil.getVersionOperator(npmPackageDependencyVersionEntry.version, npmPackageDependencyQualifiedVersionRange) : "^";
            const npmPackageDependencyType = this._getDependencyType(dependencyMap, npmPackageDependency, npmPackageDependencyVersionEntry, npmPackageDependencies, versionPointerMap);
            const npmPackageDependencyIsNewToAdd = !dependencyNames.includes(npmPackageDependencyName);
            acc[npmPackageDependencyName] = {
                dependencyType: npmPackageDependencyType,
                version: npmPackageDependencyVersion,
                semanticOperator: npmPackageSemanticOperator,
                trace: npmPackageDependencyRequiredBy,
                isNewToAdd: npmPackageDependencyIsNewToAdd,
                modifiedThrough: npmPackageDependencyModifiedThrough,
                deprecated: npmPackageDependencyVersionEntry.deprecated
            };
            return acc;
        }, {});
    }
    _getDependencyType(dependencyMap, npmPackageDependency, versionEntry, npmPackageDependencies, versionPointerMap) {
        const npmPackageDependencyName = npmPackageDependency.name;
        const hasBin = Object.entries(versionEntry.bins).length > 0;
        const isTypeDeclarationPackage = npmPackageDependency.isTypeDeclarationPackage;
        if (Object.keys(dependencyMap.dependencies).includes(npmPackageDependencyName)) {
            return e_dependency_type_1.EDependencyType.DEPENDENCY;
        }
        if (Object.keys(dependencyMap.peerDependencies).includes(npmPackageDependencyName)) {
            return e_dependency_type_1.EDependencyType.PEER_DEPENDENCY;
        }
        if (Object.keys(dependencyMap.devDependencies).includes(npmPackageDependencyName) || hasBin || isTypeDeclarationPackage) {
            return e_dependency_type_1.EDependencyType.DEV_DEPENDENCY;
        }
        if (npmPackageDependency.addedBy !== VersionManagerService._PACKAGE_JSON_FILE_NAME) {
            const addedByPackageDependency = npmPackageDependencies.find(p => p.name === npmPackageDependency.addedBy);
            if (!!addedByPackageDependency && addedByPackageDependency) {
                return this._getDependencyType(dependencyMap, addedByPackageDependency, addedByPackageDependency.versionEntries[versionPointerMap[addedByPackageDependency.name] ?? 0], npmPackageDependencies, versionPointerMap);
            }
        }
        return e_dependency_type_1.EDependencyType.DEPENDENCY;
    }
    async _getNpmPackageDependencies(dependencyMap, npmPackage, ...additionalNpmPackageDependencies) {
        const localNpmPackageDependencies = await this._getNpmPackageLocalDependencies(dependencyMap, npmPackage);
        return [...localNpmPackageDependencies, ...additionalNpmPackageDependencies.flat()].sort((a, b) => {
            if (a.name > b.name)
                return -1;
            if (a.name < b.name)
                return 1;
            return 0;
        });
    }
    async _getAdditionalNpmPackageDependenciesToAdd(dependencyMap, parentNpmPackageDependencies, npmPackage, versionPointerMap) {
        const getNpmPackagePeerDependenciesQueue = [];
        const parentNpmPackageDependencyNames = parentNpmPackageDependencies.map(npmPackageDependency => npmPackageDependency.name);
        for (const npmPackageDependency of parentNpmPackageDependencies) {
            const npmPackageDependencyVersionEntries = npmPackageDependency.versionEntries;
            const versionPointer = versionPointerMap[npmPackageDependency.name] ?? [0];
            const lastNpmPackageDependencyVersionEntry = npmPackageDependencyVersionEntries[versionPointer];
            if (!!dependencyMap.peerDependencies[npmPackageDependency.name]) {
                continue;
            }
            const peerDependencies = lastNpmPackageDependencyVersionEntry?.peerDependencies ?? [];
            for (const [peerDependencyName, peerDependency] of Object.entries(peerDependencies)) {
                if (!parentNpmPackageDependencyNames.includes(peerDependencyName) && !peerDependency.isOptional) {
                    const npmPeerPackageDependency = this._getNpmPackageDependency(peerDependencyName, npmPackage, npmPackageDependency.name);
                    getNpmPackagePeerDependenciesQueue.push(npmPeerPackageDependency);
                }
            }
        }
        const npmPackagePeerDependencies = await Promise.all(getNpmPackagePeerDependenciesQueue);
        return npmPackagePeerDependencies.reduce((acc, curr) => {
            if (!acc.find(npmPackageDependency => npmPackageDependency.name === curr.name)) {
                acc.push(curr);
            }
            return acc;
        }, []);
    }
    _getNpmPackageLocalDependencies(dependencyMap, npmPackage) {
        const getNpmPackageDependenciesQueue = [];
        const dependencyNames = Object.keys(dependencyMap.summarizedDependencies);
        for (let dependencyName of dependencyNames) {
            getNpmPackageDependenciesQueue.push(this._getNpmPackageDependency(dependencyName, npmPackage));
        }
        return Promise.all(getNpmPackageDependenciesQueue);
    }
    async _getNpmPackageDependencyVersionPointerMap(localNpmPackageDependencies, npmPackage, dependencyMap) {
        const npmPackageDependencyVersionPointerMap = {};
        const lastModifiedByMap = {};
        let requiredByMap = {};
        const modifiedThroughMap = {};
        const qualifiedRangeMap = {};
        const satisfyNpmPackageVersions = async () => {
            requiredByMap = {};
            const additionalNpmPackagePeerDependencies = await this._getAdditionalNpmPackageDependenciesToAdd(dependencyMap, localNpmPackageDependencies, npmPackage, npmPackageDependencyVersionPointerMap);
            const npmPackageDependencies = [...localNpmPackageDependencies, ...additionalNpmPackagePeerDependencies];
            let isMadeVersionAdjustments = false;
            for (let i = 0; i < npmPackageDependencies.length; i++) {
                const dependingTargetNpmPackageDependencyIndices = [];
                const sourceNpmPackageDependency = npmPackageDependencies[i];
                const sourceNpmPackageDependencyName = sourceNpmPackageDependency.name;
                const sourceNpmPackageDependencyVersionPointer = npmPackageDependencyVersionPointerMap[sourceNpmPackageDependencyName] ?? 0;
                const sourceNpmPackageDependencyVersion = sourceNpmPackageDependency.versions[sourceNpmPackageDependencyVersionPointer];
                let preferredVersions = [];
                for (let j = 0; j < npmPackageDependencies.length; j++) {
                    if (i === j)
                        continue;
                    const targetNpmPackageDependency = npmPackageDependencies[j];
                    const targetNpmPackageDependencyName = targetNpmPackageDependency.name;
                    const targetNpmPackageDependencyVersionEntryPointer = npmPackageDependencyVersionPointerMap[targetNpmPackageDependencyName] ?? 0;
                    const targetNpmPackageDependencySourceVersionRange = targetNpmPackageDependency.versionEntries[targetNpmPackageDependencyVersionEntryPointer]?.peerDependencies?.[sourceNpmPackageDependencyName]?.version;
                    if (targetNpmPackageDependencySourceVersionRange === undefined) {
                        continue;
                    }
                    requiredByMap[sourceNpmPackageDependencyName] = [...new Set([...(requiredByMap[sourceNpmPackageDependencyName] ?? []), targetNpmPackageDependencyName])];
                    dependingTargetNpmPackageDependencyIndices.push(j);
                    const maxSatisfyingSourceNpmPackageDependencyVersion = preload_1.default.maxSatisfying(sourceNpmPackageDependency.versions, targetNpmPackageDependencySourceVersionRange);
                    preferredVersions.push(maxSatisfyingSourceNpmPackageDependencyVersion);
                }
                const smallestPreferredVersionIndex = preferredVersions.reduce((smallestPreferredVersionIndex, preferredVersion, currentIndex) => {
                    if (preferredVersion === null || preload_1.default.lte(sourceNpmPackageDependencyVersion, preferredVersion) || (smallestPreferredVersionIndex > -1 && preload_1.default.lte(preferredVersions[smallestPreferredVersionIndex], preferredVersion))) {
                        return smallestPreferredVersionIndex;
                    }
                    return currentIndex;
                }, -1);
                if (smallestPreferredVersionIndex > -1) {
                    const lastSourceNpmPackageDependencyModifier = npmPackageDependencies[dependingTargetNpmPackageDependencyIndices[smallestPreferredVersionIndex]];
                    lastModifiedByMap[sourceNpmPackageDependencyName] = lastSourceNpmPackageDependencyModifier.name;
                    qualifiedRangeMap[sourceNpmPackageDependencyName] = lastSourceNpmPackageDependencyModifier.versionEntries[npmPackageDependencyVersionPointerMap[lastSourceNpmPackageDependencyModifier.name] ?? 0]?.peerDependencies?.[sourceNpmPackageDependencyName]?.version;
                    isMadeVersionAdjustments = true;
                    const sourceNpmPackageDependencyPreferredVersionIndex = sourceNpmPackageDependency.versions.findIndex((version) => version === preferredVersions[smallestPreferredVersionIndex]);
                    npmPackageDependencyVersionPointerMap[sourceNpmPackageDependencyName] = sourceNpmPackageDependencyPreferredVersionIndex;
                    const sourceNpmPackageDependencyPreferredVersion = sourceNpmPackageDependency.versions[sourceNpmPackageDependencyPreferredVersionIndex];
                    for (let dependingTargetNpmPackageDependencyIndex of dependingTargetNpmPackageDependencyIndices) {
                        const targetNpmPackageDependency = npmPackageDependencies[dependingTargetNpmPackageDependencyIndex];
                        const targetNpmPackageDependencyName = targetNpmPackageDependency.name;
                        const targetNpmPackageDependencyPeerDependencyEntries = targetNpmPackageDependency.versionEntries.map((versionEntry) => versionEntry.peerDependencies);
                        const targetNpmPackageDependencyVersionPointer = targetNpmPackageDependencyPeerDependencyEntries.findIndex(targetNpmPackageDependencyPeerDependencyEntry => preload_1.default.satisfies(sourceNpmPackageDependencyPreferredVersion, targetNpmPackageDependencyPeerDependencyEntry[sourceNpmPackageDependencyName]?.version));
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
        };
        await satisfyNpmPackageVersions();
        return {
            lastModifiedByMap,
            requiredByMap,
            modifiedThroughMap,
            versionPointerMap: npmPackageDependencyVersionPointerMap,
            qualifiedRangeMap
        };
    }
    async _getNpmPackageDependency(dependencyName, npmPackage, dependsOn) {
        const npmPackageDependencyVersions = await this._getNpmPackageDependencyVersions(dependencyName, npmPackage);
        let isTypeDeclarationPackage = dependencyName.split("/")[0] === "@types";
        const addedBy = dependsOn ?? VersionManagerService._PACKAGE_JSON_FILE_NAME;
        return new npm_package_dependency_1.NpmPackageDependency(dependencyName, npmPackageDependencyVersions, isTypeDeclarationPackage, addedBy);
    }
    async _getNpmPackageDependencyVersions(dependencyName, npmPackage) {
        const npmPackageInfos = await this._getNpmPackageInfo(dependencyName, npmPackage);
        const npmPackageDependencyVersionEntry = [];
        for (let i = 0; i < npmPackageInfos.length; i++) {
            const npmPackageInfo = npmPackageInfos[i];
            const getPeerDependenciesEntries = () => {
                if (!npmPackageInfo.peerDependencies)
                    return {};
                return Object.entries(npmPackageInfo.peerDependencies).reduce((acc, [peerDependencyName, peerDependencyVersion]) => {
                    const isOptional = !!npmPackageInfo.peerDependenciesMeta?.[peerDependencyName]?.optional;
                    acc[peerDependencyName] = {
                        isOptional, version: peerDependencyVersion
                    };
                    return acc;
                }, {});
            };
            npmPackageDependencyVersionEntry.push({
                version: npmPackageInfo.version,
                peerDependencies: getPeerDependenciesEntries(),
                bins: npmPackageInfo.bin ?? {},
                deprecated: npmPackageInfo.deprecated
            });
        }
        return npmPackageDependencyVersionEntry;
    }
    async _getNpmPackageInfo(dependencyName, npmPackage) {
        let cachedNpmPackageInfo = this._remoteNpmPackageInfoCache[dependencyName];
        if (cachedNpmPackageInfo === undefined) {
            this._remoteNpmPackageInfoCache[dependencyName] = await this._fetchNpmPackageInfo(dependencyName, npmPackage);
        }
        return this._remoteNpmPackageInfoCache[dependencyName];
    }
    async _fetchNpmPackageInfo(npmPackageName, npmPackage) {
        const command = `npm info ${npmPackageName}@">=0" name version deprecated peerDependencies peerDependenciesMeta bin --json`;
        function checkBrackets(input) {
            const trimmedInput = input.trim();
            const startsWithCurly = trimmedInput.startsWith("[");
            const endsWithCurly = trimmedInput.endsWith("]");
            return startsWithCurly && endsWithCurly;
        }
        function checkCurlyBraces(input) {
            const trimmedInput = input.trim();
            const startsWithCurly = trimmedInput.startsWith("{");
            const endsWithCurly = trimmedInput.endsWith("}");
            return startsWithCurly && endsWithCurly;
        }
        try {
            const output = await this._executeTerminalCommand(npmPackage, command, true);
            if (checkCurlyBraces(output)) {
                const parsedOutput = JSON.parse(output);
                const error = (parsedOutput["error"]);
                if (error) {
                    const errorText = error["summary"] ?? `Failed to fetch package infos of ${npmPackageName} from the npm repository`;
                    logger_util_1.LoggerUtil.printWarning(errorText);
                    return [];
                }
            }
            const parseObject = (input) => {
                return checkBrackets(input) ? JSON.parse(input) : [JSON.parse(input)];
            };
            return output ? parseObject(output) : [];
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    _executeTerminalCommand(npmPackage, command, ignoreNonZeroExitCode = false) {
        return new Promise((resolve, reject) => {
            child_process_1.default.exec(command, {
                encoding: "utf-8", cwd: npmPackage.path
            }, (error, stdout, stderr) => {
                if (!ignoreNonZeroExitCode) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    if (stderr) {
                        console.error(stderr);
                    }
                }
                resolve(stdout);
            });
        });
    }
    _getInstalledPackages(npmPackage, unscopedNpmPackageCollection) {
        const dependencies = this._npmDependencyService.getNpmPackageExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const peerDependencies = this._npmDependencyService.getNpmPackagePeerExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const devDependencies = this._npmDependencyService.getNpmPackageDevExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        return new dependency_map_1.DependencyMap(dependencies, peerDependencies, devDependencies);
    }
}
exports.VersionManagerService = VersionManagerService;
