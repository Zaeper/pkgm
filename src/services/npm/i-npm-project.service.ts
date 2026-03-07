import {INpmProject} from "../../definitions/npm/i-npm-project";
import {INpmPackageService} from "./i-npm-package.service";
import {IConfigFile} from "../../definitions/i-config-file";

/**
 * Service interface for managing npm projects
 */
export interface INpmProjectService extends INpmPackageService<INpmProject> {
    /**
     * Builds all specified projects
     * @param projects - Projects to build
     * @param configFile - The pkgm configuration
     */
    build: (projects: INpmProject[], configFile: IConfigFile) => Promise<void>;

    /**
     * Builds all specified projects in watch mode
     * @param projects - Projects to watch and build
     * @param configFile - The pkgm configuration
     */
    buildWatch: (projects: INpmProject[], configFile: IConfigFile) => Promise<void>;
}