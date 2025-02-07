import {ILinkerService} from "./i-linker.service";
import Logger from "@ptkdev/logger";
import {PackageUtil} from "../utils/packageUtil";
import {LoggerUtil} from "../utils/logger.util";
import {IExecutionService} from "./i-execution.service";
import {ECommandType} from "../definitions/e-command-type";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import {INpmDependencyService} from "./npm/i-npm-dependency.service";
import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {IPackageJson} from "../definitions/i-package-json";
import {IConfigFile} from "../definitions/i-config-file";
import {NpmClientType} from "../definitions/npm/npm-client-type";

export class LinkerService implements ILinkerService {
    private static readonly _PACKAGE_JSON_FILE_NAME: string = "package.json";
    private static readonly _DEFAULT_PACKAGE_JSON_VERSION: string = "0.0.1";

    private static readonly _LOGGER: Logger = new Logger();

    constructor(
        private readonly _dependencyService: INpmDependencyService,
        private readonly _executionService: IExecutionService
    ) {
    }

    public async applyLinks(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void> {
        const packageDependencies: Record<string, string> = this._dependencyService.getNpmPackageInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const packageDevDependencies: Record<string, string> = this._dependencyService.getNpmPackageDevInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const packagePeerDependencies: Record<string, string> = this._dependencyService.getNpmPackagePeerInternalDependencies(npmPackage, unscopedNpmPackageCollection);

        const dependenciesToLink: string[] = unscopedNpmPackageCollection.packageNames.filter(packageName => !!packageDependencies[packageName]);
        const devDependenciesToLink: string[] = unscopedNpmPackageCollection.packageNames.filter(packageName => !!packageDevDependencies[packageName]);
        const peerDependenciesToLink: string[] = unscopedNpmPackageCollection.packageNames.filter(packageName => !!packagePeerDependencies[packageName]);

        const processLinkingQueue = async (
            dependenciesToLink: string[],
            type: "" | "dev" | "peer"
        ) => {
            const saveCommand: string = type.length > 0 ? `--save-${type}` : "--save";
            
            if (dependenciesToLink.length !== 0) {
                await this._executionService.executeScript([npmPackage], `link ${dependenciesToLink.join(" ")} ${saveCommand}`, ECommandType.NPM, configFile.npmClient);
            }
        }

        await processLinkingQueue(dependenciesToLink, "");
        await processLinkingQueue(devDependenciesToLink, "dev");
        await processLinkingQueue(peerDependenciesToLink, "peer");
    }

    /**
     *
     * @param npmPackageCollection
     * @param unscopedNpmPackageCollection
     * @param configFile Configs of pkgm
     */
    public async link(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void> {
        const dependencyLinkingQueue: Record<string, INpmPackage[]> = {};
        const devDependencyLinkingQueue: Record<string, INpmPackage[]> = {};
        const peerDependencyLinkingQueue: Record<string, INpmPackage[]> = {};

        const addToLinkingQueue = (
            queue: Record<string, INpmPackage[]>,
            targetPackage: INpmPackage,
            dependenciesToLink: string[]
        ) => {
            const key: string = dependenciesToLink.join(" ");

            if (dependenciesToLink.length > 0) {
                if (queue[key]) {
                    queue[key].push(targetPackage)
                } else {
                    queue[key] = [targetPackage];
                }
            }
        }

        const shouldNpmPackageBeLinked = (
            npmPackageName: string,
            dependencyList: Record<string, string>
        ): boolean => {
            return dependencyList[npmPackageName] !== undefined;
        }

        for (const unscopedNpmPackage of unscopedNpmPackageCollection.packages) {
            const packageDependencies: Record<string, string> = this._dependencyService.getNpmPackageInternalDependencies(unscopedNpmPackage, unscopedNpmPackageCollection);
            const packageDevDependencies: Record<string, string> = this._dependencyService.getNpmPackageDevInternalDependencies(unscopedNpmPackage, unscopedNpmPackageCollection);
            const packagePeerDependencies: Record<string, string> = this._dependencyService.getNpmPackagePeerInternalDependencies(unscopedNpmPackage, unscopedNpmPackageCollection);

            const dependenciesToLink: string[] = npmPackageCollection.packageNames.filter(packageName => shouldNpmPackageBeLinked(packageName, packageDependencies));
            const devDependenciesToLink: string[] = npmPackageCollection.packageNames.filter(packageName => shouldNpmPackageBeLinked(packageName, packageDevDependencies));
            const peerDependenciesToLink: string[] = npmPackageCollection.packageNames.filter(packageName => shouldNpmPackageBeLinked(packageName, packagePeerDependencies));

            addToLinkingQueue(dependencyLinkingQueue, unscopedNpmPackage, dependenciesToLink);
            addToLinkingQueue(devDependencyLinkingQueue, unscopedNpmPackage, devDependenciesToLink);
            addToLinkingQueue(peerDependencyLinkingQueue, unscopedNpmPackage, peerDependenciesToLink);
        }


        const processLinkingQueue = async (
            queue: Record<string, INpmPackage[]>,
            type: "" | "dev" | "peer"
        ) => {
            const saveCommand: string = type.length > 0 ? `--save-${type}` : "--save";

            for (const [dependencies, targetPackages] of Object.entries(queue)) {
                await this._executionService.executeScript(targetPackages, `link ${dependencies} ${saveCommand}`, ECommandType.NPM, configFile.npmClient);
            }
        }

        await processLinkingQueue(dependencyLinkingQueue, "");
        await processLinkingQueue(devDependencyLinkingQueue, "dev");
        await processLinkingQueue(peerDependencyLinkingQueue, "peer");
    }

    public async unlink(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Promise<void> {
        for (const unscopedNpmPackage of unscopedNpmPackageCollection.packages) {
            const packageJson: IPackageJson = unscopedNpmPackage.packageJson;

            const updatedDependencyRecordResult: Record<string, string> | undefined = this._getUpdatedDependencyRecord(npmPackageCollection, packageJson.dependencies)
            const updatedDevDependencyRecordResult: Record<string, string> | undefined = this._getUpdatedDependencyRecord(npmPackageCollection, packageJson.devDependencies)
            const updatedPeerDependencyRecordResult: Record<string, string> | undefined = this._getUpdatedDependencyRecord(npmPackageCollection, packageJson.peerDependencies)

            if ([
                updatedDependencyRecordResult, updatedDevDependencyRecordResult, updatedPeerDependencyRecordResult
            ].every(result => result === undefined)) {
                continue;
            }

            const updatedPackageJson: IPackageJson = {
                ...packageJson,
                dependencies: updatedDependencyRecordResult ?? packageJson.dependencies,
                devDependencies: updatedDevDependencyRecordResult ?? packageJson.devDependencies,
                peerDependencies: updatedPeerDependencyRecordResult ?? packageJson.peerDependencies
            }

            PackageUtil.writePackageJson(unscopedNpmPackage, updatedPackageJson, LinkerService._PACKAGE_JSON_FILE_NAME);
            LoggerUtil.printInfo(`Successfully replaced file protocol with dependency versions in ${unscopedNpmPackage.packageJson.name}`);
        }
    }

    /**
     * Returns an updated record of the dependency record of the packageJson
     * @param npmPackageCollection Collection of packages to be updated
     * @param dependencyRecord Current unmodified dependency record ot the packageJson
     * @returns returns undefined if nothing was updated, otherwise the updated dependency record will be returned.
     */
    private _getUpdatedDependencyRecord = (
        npmPackageCollection: NpmPackageCollection,
        dependencyRecord?: Record<string, string>
    ): Record<string, string> | undefined => {
        if (dependencyRecord === undefined) return;

        const updatedDependencyRecord = {...dependencyRecord};

        let amountUpdated: number = 0;
        for (const targetNpmPackage of npmPackageCollection.packages) {
            const {
                name,
                version
            } = targetNpmPackage.packageJson;

            if (updatedDependencyRecord[name] !== undefined) {
                updatedDependencyRecord[name] = version ?? LinkerService._DEFAULT_PACKAGE_JSON_VERSION;
                ++amountUpdated;
            }
        }

        if (amountUpdated > 0) {
            return updatedDependencyRecord;
        }
    }
}