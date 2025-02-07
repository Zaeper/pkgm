import { INpmProject } from "../../definitions/npm/i-npm-project";
import { INpmPackageService } from "./i-npm-package.service";
export interface INpmProjectService extends INpmPackageService<INpmProject> {
    build: (projects: INpmProject[]) => Promise<void>;
    buildWatch: (projects: INpmProject[]) => Promise<void>;
}
