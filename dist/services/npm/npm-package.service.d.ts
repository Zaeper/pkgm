import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { INpmPackageScopes } from "../../definitions/npm/i-npm-package-scopes";
import Logger from "@ptkdev/logger";
import { INpmPackageService } from "./i-npm-package.service";
import { ECommandType } from "../../definitions/e-command-type";
import { IExecutionService } from "../i-execution.service";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";
export declare class NpmPackageService<T extends INpmPackage> implements INpmPackageService<T> {
    protected readonly _executionService: IExecutionService;
    protected readonly _packageType: ENpmPackageType;
    protected static readonly _LOGGER: Logger;
    protected static readonly _NODE_MODULES_DIR_NAME: string;
    protected static readonly _PACKAGE_JSON_FILE_NAME: string;
    protected static readonly _PACKAGE_LOCK_JSON_FILE_NAME: string;
    constructor(_executionService: IExecutionService, _packageType?: ENpmPackageType);
    getPackages(packagePaths: string[], npmPackageScopes?: INpmPackageScopes): Promise<T[]>;
    list(npmPackages: T[], npmPackageType?: ENpmPackageType): void;
    listScripts(packages: T[]): void;
    run(npmPackages: T[], command: string, commandType: ECommandType, runAsync: boolean): Promise<void>;
    install(packages: T[], packageName?: string): Promise<void>;
    protected _executeScript(command: string, commandType: ECommandType, runAsync: boolean | undefined, packages: T[]): Promise<void>;
}
