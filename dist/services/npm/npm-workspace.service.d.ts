import { INpmWorkspaceService } from "./i-npm-workspace.service";
import { INpmWorkspace } from "../../definitions/npm/i-npm-workspace";
import { NpmPackageService } from "./npm-package.service";
import { IExecutionService } from "../i-execution.service";
export declare class NpmWorkspaceService extends NpmPackageService<INpmWorkspace> implements INpmWorkspaceService {
    readonly executionService: IExecutionService;
    constructor(executionService: IExecutionService);
}
