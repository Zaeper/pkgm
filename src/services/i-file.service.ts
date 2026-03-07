import {IConfigFile} from "../definitions/i-config-file";
import {INpmPackage} from "../definitions/npm/i-npm-package";

/**
 * Service interface for file system operations related to pkgm configuration and symlinks
 */
export interface IFileService {
    /**
     * Checks if the pkgm configuration file exists in the root directory
     * @returns True if the config file exists, false otherwise
     */
    checkIfConfigFileExists: () => boolean;

    /**
     * Writes the configuration to the pkgm config file
     * @param configs - The configuration to write
     */
    writeConfigFile: (configs: IConfigFile) => void;

    /**
     * Reads and parses the pkgm configuration file
     * @returns The parsed configuration object
     */
    readConfigFile: () => IConfigFile;

    /**
     * Creates global symlinks for the specified npm packages
     * @param packages - The npm packages to create symlinks for
     * @param configFile - The pkgm configuration
     */
    createSymlinks: (
        packages: INpmPackage[],
        configFile: IConfigFile
    ) => Promise<void>;

    /**
     * Removes global symlinks for the specified npm packages
     * @param packages - The npm packages to remove symlinks for
     */
    removeSymlinks: (packages: INpmPackage[]) => Promise<void>;
}