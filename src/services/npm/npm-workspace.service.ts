/**
 * This service provides methods to discover and interact with npmWorkspaces within a repository.
 * @author Dennis Brönnimann
 * @license MIT
 */


import {INpmWorkspaceService} from "./i-npm-workspace.service";
import {INpmWorkspace} from "../../definitions/npm/i-npm-workspace";
import {NpmPackageService} from "./npm-package.service";
import {IExecutionService} from "../i-execution.service";
import {ENpmPackageType} from "../../definitions/npm/e-npm-package-type";
import { INpmPackageScopes } from "../../definitions/npm/i-npm-package-scopes";
import { INpmProject } from "../../definitions/npm/i-npm-project";
import { INpmPackage } from "../../definitions/npm/i-npm-package";

export class NpmWorkspaceService extends NpmPackageService<INpmWorkspace> implements INpmWorkspaceService {
    constructor(readonly executionService: IExecutionService) {
        super(executionService, ENpmPackageType.WORKSPACE);
    }

    async getPackages( packagePaths: string[], npmPackageScopes: INpmPackageScopes = {} ): Promise<INpmWorkspace[]> {
        const packages: INpmPackage[] = await super.getPackages( packagePaths, npmPackageScopes );

        return <INpmWorkspace[]> packages.filter(npmPackage => npmPackage.type === ENpmPackageType.WORKSPACE);
    }
}