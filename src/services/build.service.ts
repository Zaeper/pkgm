import {IBuildService} from "./i-build.service";
import {LoggerUtil} from "../utils/logger.util";
import fs from "fs";
import {rimrafSync} from "rimraf";
import {ILinkerService} from "./i-linker.service";
import {IExecutionService} from "./i-execution.service";
import {ECommandType} from "../definitions/e-command-type";
import {PathUtil} from "../utils/path.util";
import {NpmPackageCollection} from "../definitions/npm-package-collection";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import {INpmDependencyService} from "./npm/i-npm-dependency.service";
import {IFileService} from "./i-file.service";
import {IConfigFile} from "../definitions/i-config-file";
import {ENpmPackageType} from "../definitions/npm/e-npm-package-type";

export class BuildService implements IBuildService {
    private static readonly _NODE_MODULES_DIR_NAME: string = "node_modules";
    private static readonly _DIST_DIR_NAME: string = "dist";
    private static readonly _PACKAGE_LOCK_FILE_NAME: string = "package-lock.json";

    constructor(
        private readonly _linkerService: ILinkerService,
        private readonly _executionService: IExecutionService,
        private readonly _npmDependencyService: INpmDependencyService,
        private readonly _fileService: IFileService
    ) {
    }

    public async build(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile
    ): Promise<void> {
        const npmPackageProcessList: INpmPackage[] = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);

        for (const npmPackage of npmPackageProcessList) {
            LoggerUtil.printHint(npmPackage.packageJson.name);
            await this._linkerService.applyLinks(npmPackage, unscopedNpmPackageCollection, configFile);

            await this._executionService.executeScript([npmPackage], "install", ECommandType.NPM, configFile.npmClient);

            if(npmPackage.type == ENpmPackageType.PROJECT) {
                await this._executionService.executeScript([npmPackage], "build", ECommandType.NPM_SCRIPT, configFile.npmClient);
                await this._fileService.createSymlinks([npmPackage], configFile);
            }
        }
    }

    public async clean(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        includePackageLock: boolean = false
    ) {
        const packageProcessList: INpmPackage[] = this._npmDependencyService.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);

        await this._linkerService.unlink(npmPackageCollection, unscopedNpmPackageCollection);
        await this._fileService.removeSymlinks(npmPackageCollection.packages);


        for (const [index, npmPackage] of packageProcessList.entries()) {
            LoggerUtil.printSection(`Process ${index + 1}/${packageProcessList.length}: Processing ${npmPackage.type.toLowerCase()}: ${npmPackage.packageJson.name}`);

            const nodeModulesDirPath: string = PathUtil.join(npmPackage.path, BuildService._NODE_MODULES_DIR_NAME);

            if (fs.existsSync(nodeModulesDirPath)) {
                LoggerUtil.printStep(`Deleting ${BuildService._NODE_MODULES_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
                rimrafSync(nodeModulesDirPath, {preserveRoot: false});
            } else {
                LoggerUtil.printInfo(`${BuildService._NODE_MODULES_DIR_NAME} directory not found. Skipping deleting ${BuildService._NODE_MODULES_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
            }

            if (includePackageLock && npmPackage.packageLockJsonPath) {
                if (fs.existsSync(npmPackage.packageLockJsonPath)) {
                    LoggerUtil.printStep(`Deleting ${BuildService._PACKAGE_LOCK_FILE_NAME} file in ${npmPackage.packageJson.name}`);
                    rimrafSync(npmPackage.packageLockJsonPath);
                } else {
                    LoggerUtil.printInfo(`${BuildService._PACKAGE_LOCK_FILE_NAME} file not found. Skipping deleting ${BuildService._PACKAGE_LOCK_FILE_NAME} in ${npmPackage.packageJson.name}`);
                }
            }

            const distDirPath: string = PathUtil.join(npmPackage.path, BuildService._DIST_DIR_NAME);

            if (fs.existsSync(distDirPath)) {
                LoggerUtil.printStep(`Deleting ${BuildService._DIST_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
                rimrafSync(distDirPath, {preserveRoot: false});
            } else {
                LoggerUtil.printInfo(`${BuildService._DIST_DIR_NAME} directory not found. Skipping deleting ${BuildService._DIST_DIR_NAME} directory in ${npmPackage.packageJson.name}`);
            }
        }
    }
}