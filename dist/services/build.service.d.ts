import { IBuildService } from "./i-build.service";
import { ILinkerService } from "./i-linker.service";
import { IExecutionService } from "./i-execution.service";
import { NpmPackageCollection } from "../definitions/npm-package-collection";
import { INpmDependencyService } from "./npm/i-npm-dependency.service";
import { IFileService } from "./i-file.service";
import { IConfigFile } from "../definitions/i-config-file";
export declare class BuildService implements IBuildService {
    private readonly _linkerService;
    private readonly _executionService;
    private readonly _npmDependencyService;
    private readonly _fileService;
    private static readonly _NODE_MODULES_DIR_NAME;
    private static readonly _DIST_DIR_NAME;
    private static readonly _PACKAGE_LOCK_FILE_NAME;
    constructor(_linkerService: ILinkerService, _executionService: IExecutionService, _npmDependencyService: INpmDependencyService, _fileService: IFileService);
    build(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, configFile: IConfigFile): Promise<void>;
    clean(npmPackageCollection: NpmPackageCollection, unscopedNpmPackageCollection: NpmPackageCollection, includePackageLock?: boolean): Promise<void>;
}
