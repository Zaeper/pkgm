import {INpmProject} from "../../definitions/npm/i-npm-project";
import {INpmPackageService} from "./i-npm-package.service";
import {IConfigFile} from "../../definitions/i-config-file";

export interface INpmProjectService extends INpmPackageService<INpmProject> {
    build: (projects: INpmProject[], configFile: IConfigFile) => Promise<void>;
    buildWatch: (projects: INpmProject[], configFile: IConfigFile) => Promise<void>;
}