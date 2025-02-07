import { IFileService } from "./i-file.service";
import { IConfigFile } from "../definitions/i-config-file";
import { IExecutionService } from "./i-execution.service";
import { INpmPackage } from "../definitions/npm/i-npm-package";
export declare class FileService implements IFileService {
    private readonly _rootDir;
    private readonly _executionService;
    private static readonly _LOGGER;
    private static readonly _CONFIG_FILE_NAME;
    private static readonly _DIST_DIR_NAME;
    private static readonly _PACKAGE_JSON_FILE_NAME;
    private static readonly _IGNORE_LIST;
    private static readonly _PKGM_IGNORE_FILE_NAME;
    private readonly _configFilePath;
    constructor(_rootDir: string, _executionService: IExecutionService);
    checkIfConfigFileExists(): boolean;
    writeConfigFile(configs: IConfigFile): void;
    readConfigFile(): IConfigFile;
    createSymlinks(npmPackages: INpmPackage[], configFile: IConfigFile): Promise<void>;
    removeSymlinks(npmPackages: INpmPackage[]): Promise<void>;
    private _executeTerminalCommand;
    private _getSymlinkTargetPath;
    private _getProjectDistCandidates;
}
