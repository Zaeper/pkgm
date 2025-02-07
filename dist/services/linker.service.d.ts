import { ILinkerService } from "./i-linker.service";
import { IExecutionService } from "./i-execution.service";
import { INpmPackage } from "../definitions/npm/i-npm-package";
import { INpmDependencyService } from "./npm/i-npm-dependency.service";
import { NpmPackageCollection } from "../definitions/npm-package-collection";
export declare class LinkerService implements ILinkerService {
    private readonly _dependencyService;
    private readonly _executionService;
    private static readonly _PACKAGE_JSON_FILE_NAME;
    private static readonly _DEFAULT_PACKAGE_JSON_VERSION;
    private static readonly _LOGGER;
    constructor(_dependencyService: INpmDependencyService, _executionService: IExecutionService);
    applyLinks(npmPackage: INpmPackage, unscopedNpmPackageCollection: NpmPackageCollection): Promise<void>;
    link(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): Promise<void>;
    unlink(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection): Promise<void>;
    private _getUpdatedDependencyRecord;
}
