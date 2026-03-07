import {INpmPackage} from "../../definitions/npm/i-npm-package";
import {INpmPackageScopes} from "../../definitions/npm/i-npm-package-scopes";
import {ECommandType} from "../../definitions/e-command-type";
import {ENpmPackageType} from "../../definitions/npm/e-npm-package-type";
import {IConfigFile} from "../../definitions/i-config-file";
import { IInstallNpmDependencyOptions } from "../../definitions/i-install-npm-dependency-options";

/**
 * Generic service interface for npm package operations
 * @typeParam T - Type of npm package (project or workspace)
 */
export interface INpmPackageService<T extends INpmPackage> {
    /**
     * Retrieves npm packages from the specified paths
     * @param packagePaths - Paths to search for packages
     * @param npmPackageScopes - Optional scopes to filter packages
     */
    getPackages(
        packagePaths: string[],
        npmPackageScopes?: INpmPackageScopes
    ): Promise<T[]>

    /**
     * Lists the specified npm packages
     * @param npmPackages - Packages to list
     * @param npmPackageType - Type of packages being listed
     */
    list(
        npmPackages: T[],
        npmPackageType?: ENpmPackageType
    ): void;

    /**
     * Lists available scripts from package.json files
     * @param npmPackages - Packages to list scripts from
     */
    listScripts(npmPackages: T[]): void;

    /**
     * Runs a command across multiple packages
     * @param npmPackages - Packages to run the command in
     * @param command - The command to run
     * @param commandType - Type of command (npm, npm script, or terminal)
     * @param runAsync - Whether to run asynchronously with interactive output
     * @param configFile - The pkgm configuration
     */
    run(
        npmPackages: T[],
        command: string,
        commandType: ECommandType,
        runAsync: boolean,
        configFile: IConfigFile
    ): Promise<void>;

    /**
     * Installs dependencies for the specified packages
     * @param npmPackages - Packages to install dependencies for
     * @param configFile - The pkgm configuration
     * @param installNpmPackageOptions - Optional installation options
     */
    install(
        npmPackages: T[],
        configFile: IConfigFile,
        installNpmPackageOptions?: IInstallNpmDependencyOptions
    ): Promise<void>;
}