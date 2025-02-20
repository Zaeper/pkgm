import {INpmPackage} from "../../definitions/npm/i-npm-package";
import {INpmPackageScopes} from "../../definitions/npm/i-npm-package-scopes";
import {ECommandType} from "../../definitions/e-command-type";
import {ENpmPackageType} from "../../definitions/npm/e-npm-package-type";
import {IConfigFile} from "../../definitions/i-config-file";
import { IInstallNpmDependencyOptions } from "../../definitions/i-install-npm-dependency-options";

export interface INpmPackageService<T extends INpmPackage> {
    getPackages(
        packagePaths: string[],
        npmPackageScopes?: INpmPackageScopes
    ): Promise<T[]>

    list(
        npmPackages: T[],
        npmPackageType?: ENpmPackageType
    ): void;

    listScripts(npmPackages: T[]): void;

    run(
        npmPackages: T[],
        command: string,
        commandType: ECommandType,
        runAsync: boolean,
        configFile: IConfigFile
    ): Promise<void>;

    install(
        npmPackages: T[],
        configFile: IConfigFile,
        installNpmPackageOptions?: IInstallNpmDependencyOptions
    ): Promise<void>;
}