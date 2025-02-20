import chalk from "chalk";
import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { INpmPackageScopes } from "../../definitions/npm/i-npm-package-scopes";
import { IPackageJson } from "../../definitions/i-package-json";
import { JsonUtil } from "../../utils/json.util";
import Logger from "@ptkdev/logger";
import { PackageUtil } from "../../utils/packageUtil";
import { PathUtil } from "../../utils/path.util";
import { INpmPackageService } from "./i-npm-package.service";
import { LoggerUtil } from "../../utils/logger.util";
import { ECommandType } from "../../definitions/e-command-type";
import { IExecutionService } from "../i-execution.service";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";
import { IPackageLockJson } from "../../definitions/i-package-lock-json";
import fs from "fs";
import { IConfigFile } from "../../definitions/i-config-file";
import { IInstallNpmDependencyOptions } from "../../definitions/i-install-npm-dependency-options";

export class NpmPackageService<T extends INpmPackage> implements INpmPackageService<T> {
    protected static readonly _LOGGER: Logger = new Logger();
    protected static readonly _NODE_MODULES_DIR_NAME: string = "node_modules";
    protected static readonly _PACKAGE_JSON_FILE_NAME: string = "package.json";
    protected static readonly _PACKAGE_LOCK_JSON_FILE_NAME: string = "package-lock.json";

    public constructor(
        protected readonly _executionService: IExecutionService,
        protected readonly _packageType: ENpmPackageType = ENpmPackageType.UNKNOWN
    ) {
    }

    /**
     * Fetches the npm package infos
     * @param packagePaths Path's of packages which should be parsed
     * @param npmPackageScopes Definitions of scopes, to be used to filter the npmPackageCollection
     * @returns A list of {@link INpmPackage} objects
     */
    public async getPackages(
        packagePaths: string[],
        npmPackageScopes: INpmPackageScopes = {}
    ): Promise<T[]> {
        const npmPackages: T[] = <T[]>packagePaths.map( (npmPackagePath: string): T | undefined => {
            const packageJsonPath: string = PathUtil.join( npmPackagePath, NpmPackageService._PACKAGE_JSON_FILE_NAME );
            const packageJsonLockPath: string = PathUtil.join( npmPackagePath, NpmPackageService._PACKAGE_LOCK_JSON_FILE_NAME );
            const nodeModulesPath: string = PathUtil.join( npmPackagePath, NpmPackageService._NODE_MODULES_DIR_NAME );

            let packageLockJson: IPackageLockJson | null = null;

            const doesPackageLockJsonExist: boolean = fs.existsSync( packageJsonLockPath );

            if ( doesPackageLockJsonExist ) {
                try {
                    packageLockJson = JsonUtil.readJson<IPackageLockJson>( packageJsonLockPath );
                } catch ( e ) {
                    /**
                     * silently fail
                     */
                }
            }

            let doesNodeModulesDirectoryExists: boolean = fs.existsSync( nodeModulesPath );

            try {
                const packageJson: IPackageJson = JsonUtil.readJson<IPackageJson>( packageJsonPath );

                return <T>{
                    type: this._packageType,
                    path: npmPackagePath,
                    packageJson,
                    packageJsonPath,
                    packageLockJson,
                    packageLockJsonPath: doesPackageLockJsonExist ? packageJsonLockPath : undefined,
                    nodeModulesPath: doesNodeModulesDirectoryExists ? nodeModulesPath : undefined
                };
            } catch ( e ) {
                NpmPackageService._LOGGER.warning( `Tried to parse ${ packageJsonPath } but failed. Skipping this file` );
            }
        } ).filter( (npmPackage) => !!npmPackage );

        return PackageUtil.filterByScopes<T>( npmPackages, npmPackageScopes );
    }

    /**
     * Lists npm packages
     * @param npmPackages Packages which should be listed
     * @param npmPackageType type of packages to be listed
     */
    public list(
        npmPackages: T[],
        npmPackageType?: ENpmPackageType
    ): void {
        const sortedPackagesListByName: T[] = npmPackages.sort( ((
            a: T,
            b: T
        ): 0 | 1 | -1 => {
            if ( a.packageJson.name < b.packageJson.name ) {
                return -1;
            }
            if ( a.packageJson.name > b.packageJson.name ) {
                return 1;
            }
            return 0;
        }) );

        const getNpmPackageTypeText = (): string => {
            const type: string = npmPackageType?.toLowerCase() ?? "package";

            if ( sortedPackagesListByName.length === 1 ) {
                return type;
            } else {
                return type + "s";
            }
        };

        LoggerUtil.printInfo( `Found ${ sortedPackagesListByName.length } ${ getNpmPackageTypeText() }. Listed in alphabetical order.` );
        LoggerUtil.printOutputTitle( "Packages" );
        if ( sortedPackagesListByName.length > 0 ) {
            sortedPackagesListByName.forEach( (npmPackage: T): void => {
                LoggerUtil.printIndented( `${ chalk.cyan( npmPackage.packageJson.name ) } ${ chalk.gray( npmPackage.path ) }`, 2 );
            } );
        } else {
            if ( npmPackages.length === 0 ) {
                LoggerUtil.printIndented( `${ chalk.cyan( `No ${ getNpmPackageTypeText() } affected` ) }`, 2 );
            }
        }
    }

    /**
     * Lists all defined scripts of a package, defined in its package.json
     * @param packages List of packages, of which its scripts should be listed
     */
    public listScripts(packages: T[]): void {
        packages.forEach( (npmPackage: T) => {
            LoggerUtil.printIndented( `${ chalk.cyan( npmPackage.packageJson.name ) } ${ chalk.gray( npmPackage.path ) }`, 2 );

            const scripts: Record<string, string> | undefined = npmPackage.packageJson.scripts;

            Object.entries( scripts ?? [] ).forEach( ([ key, value ]: [ string, string ]) => {
                LoggerUtil.printIndented( `${ chalk.yellow( key ) } ${ value }`, 3 );
            } );
        } );
    }

    /**
     * Executes a command, on multiple packages
     * @param npmPackages List of npm packages in which the command should be executed in
     * @param command Command, which should be executed
     * @param commandType The type of command to be executed. See also {@link ECommandType}
     * @param runAsync Defines if the command should be executed as an async command or synchronously
     * @param configFile Configs of pkgm
     */
    public async run(
        npmPackages: T[],
        command: string,
        commandType: ECommandType,
        runAsync: boolean,
        configFile: IConfigFile
    ): Promise<void> {
        LoggerUtil.printAction( `Running ${ commandType } ${ command } in target packages` );

        return this._executeScript( `${ command }`, commandType, runAsync, npmPackages, configFile );
    }

    /**
     * Executes the npm install script on multiple packages.
     * This method can be used, to execute a regular npm install or to execute a npm install of a specific package
     * @param packages List of packages, where the npm install command should be executed in
     * @param installNpmPackageOptions Specified options of a package to be installed
     * @param configFile Configs of pkgm
     */
    public async install(
        packages: T[],
        configFile: IConfigFile,
        installNpmPackageOptions?: IInstallNpmDependencyOptions
    ): Promise<void> {
        LoggerUtil.printAction( `Running npm install in target packages` );

        const dependencyCategorySuffix = (): string | undefined => {
            if ( installNpmPackageOptions?.dependencyName === undefined ) return;
            switch ( installNpmPackageOptions?.dependencyCategory ) {
                case("devDependency"):
                    return "--save-dev";
                case("peerDependency"):
                    return "--save-peer";
                default:
                    return "--save";
            }
        };

        const npmCommand: string = [
            'install', installNpmPackageOptions?.dependencyName, dependencyCategorySuffix()
        ].filter( Boolean ).join( " " );

        return this._executeScript( npmCommand, ECommandType.NPM, false, packages, configFile );
    }

    /**
     * Execute a terminal command in defined packages
     * @param command The command to be executed
     * @param commandType The type of command to be executed. See also {@link ECommandType}
     * @param runAsync Defines if the command should be executed as an async command or synchronously
     * @param packages List of packages in which the command should be executed in
     * @param configFile Configs of pkgm
     * @protected
     */
    protected async _executeScript(
        command: string,
        commandType: ECommandType,
        runAsync: boolean = false,
        packages: T[],
        configFile: IConfigFile
    ): Promise<void> {
        return this._executionService.executeScript( packages, command, commandType, configFile.npmClient, runAsync );
    }
}