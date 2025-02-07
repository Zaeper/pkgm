import Logger from "@ptkdev/logger";
import * as fs from "fs";
import * as Path from "path";
import * as process from "process";
import {IFileService} from "./i-file.service";
import {IConfigFile} from "../definitions/i-config-file";
import {LoggerUtil} from "../utils/logger.util";
import {IExecutionService} from "./i-execution.service";
import {ECommandType} from "../definitions/e-command-type";
import {IPackageJson} from "../definitions/i-package-json";
import {JsonUtil} from "../utils/json.util";
import {glob} from "glob";
import path from "node:path";
import {ListUtil} from "../utils/list.util";
import {PathUtil} from "../utils/path.util";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import child_process from "child_process";

export class FileService implements IFileService {
    private static readonly _LOGGER: Logger = new Logger();
    private static readonly _CONFIG_FILE_NAME: string = "pkgm.json";
    private static readonly _DIST_DIR_NAME: string = "dist";
    private static readonly _PACKAGE_JSON_FILE_NAME: string = "package.json";
    private static readonly _IGNORE_LIST: string[] = ['**/node_modules/**', '**/.pkgm/**'];
    private static readonly _PKGM_IGNORE_FILE_NAME: string = "pkgm.ignore";

    private readonly _configFilePath: string;

    constructor(
        private readonly _rootDir: string,
        private readonly _executionService: IExecutionService
    ) {
        this._configFilePath = PathUtil.resolve(this._rootDir, FileService._CONFIG_FILE_NAME);
    }

    public checkIfConfigFileExists(): boolean {
        try {
            return fs.existsSync(this._configFilePath);
        } catch (e) {
            FileService._LOGGER.error(`Can't read from file-system. Please make sure the permissions are set correctly.`)
            process.exit(1);
        }
    }

    public writeConfigFile(configs: IConfigFile): void {
        LoggerUtil.printAction(`Writing configuration to ${FileService._CONFIG_FILE_NAME} file.`);
        const data: string = JSON.stringify(configs, null, 2);

        try {
            fs.writeFileSync(this._configFilePath, data);
        } catch (e) {
            FileService._LOGGER.warning(`Could not create ${FileService._CONFIG_FILE_NAME}`);
        }
    }

    public readConfigFile(): IConfigFile {
        let jsonData;
        try {
            jsonData = fs.readFileSync(this._configFilePath, 'utf-8');
        } catch (e) {
            FileService._LOGGER.error(`Can't open config file. Please make sure ${FileService._CONFIG_FILE_NAME} exists and is readable.`);
            process.exit(1);
        }

        try {
            return JSON.parse(jsonData);
        } catch (e) {
            FileService._LOGGER.error(`Can't read configs from ${FileService._CONFIG_FILE_NAME}. Please make sure its formatted correctly.`)
            process.exit(1);
        }
    }

    public async createSymlinks(
        npmPackages: INpmPackage[],
        configFile: IConfigFile
    ): Promise<void> {
        let filteredNpmPackageList: INpmPackage[] = [];

        const excludedSymlinkProjects: string[] | undefined = configFile.excludeSymlinks;

        for (const npmPackage of npmPackages) {
            const isExcludedByName: boolean = !!excludedSymlinkProjects?.includes(npmPackage.packageJson.name);
            const isExcludedByPath: boolean = !!excludedSymlinkProjects?.includes(npmPackage.path);

            if (!isExcludedByName && !isExcludedByPath) {
                filteredNpmPackageList.push({
                    ...npmPackage,
                    path: await this._getSymlinkTargetPath(npmPackage) ?? npmPackage.path,
                })
            }
        }

        await this._executionService.executeScript(filteredNpmPackageList, "link", ECommandType.NPM, configFile.npmClient);
    }

    public async removeSymlinks(npmPackages: INpmPackage[]): Promise<void> {
        const npmPackageNames: string[] = npmPackages.map(npmPackage => npmPackage.packageJson.name);

        await this._executeTerminalCommand(`npm unlink -g ${npmPackageNames.join(" ")}`)
    }

    private _executeTerminalCommand(
        command: string,
        ignoreNonZeroExitCode = false
    ): Promise<string> {
        return new Promise((
            resolve,
            reject
        ) => {
            child_process.exec(command, {
                encoding: "utf-8"
            }, (
                error,
                stdout,
                stderr
            ) => {
                if (!ignoreNonZeroExitCode) {
                    if (error) {
                        reject(error)
                        return;
                    }
                    if (stderr) {
                        console.error(stderr);
                    }
                }
                resolve(stdout)
            });
        });
    }

    private async _getSymlinkTargetPath(npmPackage: INpmPackage): Promise<string | undefined> {
        let symlinkTargetPath: string | undefined;
        if (npmPackage.packageJson.main) {
            symlinkTargetPath = PathUtil.relative(this._rootDir, npmPackage.path);
        } else {
            const distPackageJsonPath: string = PathUtil.join(npmPackage.path, FileService._DIST_DIR_NAME, FileService._PACKAGE_JSON_FILE_NAME);

            if (fs.existsSync(distPackageJsonPath)) {
                return PathUtil.relative(this._rootDir, path.dirname(distPackageJsonPath));
            } else {
                const distDirCandidate: string | undefined = await this._getProjectDistCandidates(npmPackage);

                if (!!distDirCandidate) {
                    return PathUtil.relative(this._rootDir, distDirCandidate);
                }
            }
        }

        return symlinkTargetPath;
    }

    private async _getProjectDistCandidates(npmPackage: INpmPackage): Promise<string | undefined> {
        const searchPatterns: string = PathUtil.join(this._rootDir, "**", FileService._PACKAGE_JSON_FILE_NAME);

        const pgkmIgnoreFilePath: string = PathUtil.join(this._rootDir, FileService._PKGM_IGNORE_FILE_NAME);
        const pkgmIgnoreEntries: string[] = await ListUtil.readList(pgkmIgnoreFilePath);

        const ignoreList: string[] = [...FileService._IGNORE_LIST, ...pkgmIgnoreEntries];

        const packageJsonDistFilePaths: string[] = await glob(searchPatterns, {ignore: ignoreList});
        const matchingPackageJsonFilePath: string | undefined = packageJsonDistFilePaths.filter((packageJsonDistFilePath) => {
            const isInDistDirectory: boolean = packageJsonDistFilePath.split("/").includes("dist");

            const packageJson: IPackageJson = JsonUtil.readJson<IPackageJson>(packageJsonDistFilePath);
            const hasSamePackageName: boolean = packageJson.name === npmPackage.packageJson.name;

            return isInDistDirectory && hasSamePackageName;
        })[0];

        if (!!matchingPackageJsonFilePath) {
            const matchingPackageJsonDirPath = Path.dirname(matchingPackageJsonFilePath);
            return Promise.resolve(matchingPackageJsonDirPath)
        }

        return Promise.resolve(undefined);
    }
}