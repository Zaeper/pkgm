"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkerService = void 0;
const logger_1 = __importDefault(require("@ptkdev/logger"));
const packageUtil_1 = require("../utils/packageUtil");
const logger_util_1 = require("../utils/logger.util");
const e_command_type_1 = require("../definitions/e-command-type");
class LinkerService {
    _dependencyService;
    _executionService;
    static _PACKAGE_JSON_FILE_NAME = "package.json";
    static _DEFAULT_PACKAGE_JSON_VERSION = "0.0.1";
    static _LOGGER = new logger_1.default();
    constructor(_dependencyService, _executionService) {
        this._dependencyService = _dependencyService;
        this._executionService = _executionService;
    }
    async applyLinks(npmPackage, unscopedNpmPackageCollection, configFile) {
        const packageDependencies = this._dependencyService.getNpmPackageInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const packageDevDependencies = this._dependencyService.getNpmPackageDevInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const packagePeerDependencies = this._dependencyService.getNpmPackagePeerInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const dependenciesToLink = unscopedNpmPackageCollection.packageNames.filter(packageName => !!packageDependencies[packageName]);
        const devDependenciesToLink = unscopedNpmPackageCollection.packageNames.filter(packageName => !!packageDevDependencies[packageName]);
        const peerDependenciesToLink = unscopedNpmPackageCollection.packageNames.filter(packageName => !!packagePeerDependencies[packageName]);
        const processLinkingQueue = async (dependenciesToLink, type) => {
            const saveCommand = type.length > 0 ? `--save-${type}` : "--save";
            if (dependenciesToLink.length !== 0) {
                await this._executionService.executeScript([npmPackage], `link ${dependenciesToLink.join(" ")} ${saveCommand}`, e_command_type_1.ECommandType.NPM, configFile.npmClient);
            }
        };
        await processLinkingQueue(dependenciesToLink, "");
        await processLinkingQueue(devDependenciesToLink, "dev");
        await processLinkingQueue(peerDependenciesToLink, "peer");
    }
    async link(npmPackageCollection, unscopedNpmPackageCollection, configFile) {
        const dependencyLinkingQueue = {};
        const devDependencyLinkingQueue = {};
        const peerDependencyLinkingQueue = {};
        const addToLinkingQueue = (queue, targetPackage, dependenciesToLink) => {
            const key = dependenciesToLink.join(" ");
            if (dependenciesToLink.length > 0) {
                if (queue[key]) {
                    queue[key].push(targetPackage);
                }
                else {
                    queue[key] = [targetPackage];
                }
            }
        };
        const shouldNpmPackageBeLinked = (npmPackageName, dependencyList) => {
            return dependencyList[npmPackageName] !== undefined;
        };
        for (const unscopedNpmPackage of unscopedNpmPackageCollection.packages) {
            const packageDependencies = this._dependencyService.getNpmPackageInternalDependencies(unscopedNpmPackage, unscopedNpmPackageCollection);
            const packageDevDependencies = this._dependencyService.getNpmPackageDevInternalDependencies(unscopedNpmPackage, unscopedNpmPackageCollection);
            const packagePeerDependencies = this._dependencyService.getNpmPackagePeerInternalDependencies(unscopedNpmPackage, unscopedNpmPackageCollection);
            const dependenciesToLink = npmPackageCollection.packageNames.filter(packageName => shouldNpmPackageBeLinked(packageName, packageDependencies));
            const devDependenciesToLink = npmPackageCollection.packageNames.filter(packageName => shouldNpmPackageBeLinked(packageName, packageDevDependencies));
            const peerDependenciesToLink = npmPackageCollection.packageNames.filter(packageName => shouldNpmPackageBeLinked(packageName, packagePeerDependencies));
            addToLinkingQueue(dependencyLinkingQueue, unscopedNpmPackage, dependenciesToLink);
            addToLinkingQueue(devDependencyLinkingQueue, unscopedNpmPackage, devDependenciesToLink);
            addToLinkingQueue(peerDependencyLinkingQueue, unscopedNpmPackage, peerDependenciesToLink);
        }
        const processLinkingQueue = async (queue, type) => {
            const saveCommand = type.length > 0 ? `--save-${type}` : "--save";
            for (const [dependencies, targetPackages] of Object.entries(queue)) {
                await this._executionService.executeScript(targetPackages, `link ${dependencies} ${saveCommand}`, e_command_type_1.ECommandType.NPM, configFile.npmClient);
            }
        };
        await processLinkingQueue(dependencyLinkingQueue, "");
        await processLinkingQueue(devDependencyLinkingQueue, "dev");
        await processLinkingQueue(peerDependencyLinkingQueue, "peer");
    }
    async unlink(npmPackageCollection, unscopedNpmPackageCollection) {
        for (const unscopedNpmPackage of unscopedNpmPackageCollection.packages) {
            const packageJson = unscopedNpmPackage.packageJson;
            const updatedDependencyRecordResult = this._getUpdatedDependencyRecord(npmPackageCollection, packageJson.dependencies);
            const updatedDevDependencyRecordResult = this._getUpdatedDependencyRecord(npmPackageCollection, packageJson.devDependencies);
            const updatedPeerDependencyRecordResult = this._getUpdatedDependencyRecord(npmPackageCollection, packageJson.peerDependencies);
            if ([
                updatedDependencyRecordResult, updatedDevDependencyRecordResult, updatedPeerDependencyRecordResult
            ].every(result => result === undefined)) {
                continue;
            }
            const updatedPackageJson = {
                ...packageJson,
                dependencies: updatedDependencyRecordResult ?? packageJson.dependencies,
                devDependencies: updatedDevDependencyRecordResult ?? packageJson.devDependencies,
                peerDependencies: updatedPeerDependencyRecordResult ?? packageJson.peerDependencies
            };
            packageUtil_1.PackageUtil.writePackageJson(unscopedNpmPackage, updatedPackageJson, LinkerService._PACKAGE_JSON_FILE_NAME);
            logger_util_1.LoggerUtil.printInfo(`Successfully replaced file protocol with dependency versions in ${unscopedNpmPackage.packageJson.name}`);
        }
    }
    _getUpdatedDependencyRecord = (npmPackageCollection, dependencyRecord) => {
        if (dependencyRecord === undefined)
            return;
        const updatedDependencyRecord = { ...dependencyRecord };
        let amountUpdated = 0;
        for (const targetNpmPackage of npmPackageCollection.packages) {
            const { name, version } = targetNpmPackage.packageJson;
            if (updatedDependencyRecord[name] !== undefined) {
                updatedDependencyRecord[name] = version ?? LinkerService._DEFAULT_PACKAGE_JSON_VERSION;
                ++amountUpdated;
            }
        }
        if (amountUpdated > 0) {
            return updatedDependencyRecord;
        }
    };
}
exports.LinkerService = LinkerService;
