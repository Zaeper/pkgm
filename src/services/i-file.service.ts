import {IConfigFile} from "../definitions/i-config-file";
import {INpmPackage} from "../definitions/npm/i-npm-package";

export interface IFileService {
    checkIfConfigFileExists: () => boolean;
    writeConfigFile: (configs: IConfigFile) => void;
    readConfigFile: () => IConfigFile;
    createSymlinks: (
        packages: INpmPackage[],
        configFile: IConfigFile
    ) => Promise<void>;
    removeSymlinks: (packages: INpmPackage[]) => Promise<void>;
}