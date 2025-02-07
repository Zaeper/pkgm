import { INpmProjectService } from "./i-npm-project.service";
import { IExecutionService } from "../i-execution.service";
import { INpmProject } from "../../definitions/npm/i-npm-project";
import { NpmPackageService } from "./npm-package.service";
export declare class NpmProjectService extends NpmPackageService<INpmProject> implements INpmProjectService {
    readonly executionService: IExecutionService;
    constructor(executionService: IExecutionService);
    build(projects: INpmProject[]): Promise<void>;
    buildWatch(projects: INpmProject[]): Promise<void>;
}
