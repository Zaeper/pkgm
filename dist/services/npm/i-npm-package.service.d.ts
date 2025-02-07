import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { INpmPackageScopes } from "../../definitions/npm/i-npm-package-scopes";
import { ECommandType } from "../../definitions/e-command-type";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";
export interface INpmPackageService<T extends INpmPackage> {
    getPackages(packagePaths: string[], npmPackageScopes?: INpmPackageScopes): Promise<T[]>;
    list(npmPackages: T[], npmPackageType?: ENpmPackageType): void;
    listScripts(npmPackages: T[]): void;
    run(npmPackages: T[], command: string, commandType: ECommandType, runAsync: boolean): Promise<void>;
    install(npmPackages: T[], packageName?: string): Promise<void>;
}
