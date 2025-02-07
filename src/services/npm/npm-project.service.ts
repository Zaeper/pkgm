/**
 * This service provides methods to discover and interact with projects within a repository.
 * @author Dennis Brönnimann
 * @license MIT
 */

import { INpmProjectService } from "./i-npm-project.service";
import { LoggerUtil } from "../../utils/logger.util";
import { IExecutionService } from "../i-execution.service";
import { INpmProject } from "../../definitions/npm/i-npm-project";
import { ECommandType } from "../../definitions/e-command-type";
import { NpmPackageService } from "./npm-package.service";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";
import { IConfigFile } from "../../definitions/i-config-file";
import { INpmPackageScopes } from "../../definitions/npm/i-npm-package-scopes";
import { INpmPackage } from "../../definitions/npm/i-npm-package";

export class NpmProjectService extends NpmPackageService<INpmProject> implements INpmProjectService {
    constructor(readonly executionService: IExecutionService) {
        super(executionService, ENpmPackageType.PROJECT);
    }

    async getPackages( packagePaths: string[], npmPackageScopes: INpmPackageScopes = {} ): Promise<INpmProject[]> {
        const packages: INpmPackage[] = await super.getPackages( packagePaths, npmPackageScopes );

        return <INpmProject[]> packages.filter(npmPackage => npmPackage.type === ENpmPackageType.PROJECT);
    }

    /**
     * Executes the build script command on multiple projects
     * @param projects List of projects, on which the build npm script should be executed in
     * @param configFile Configs of pkgm
     */
    public async build(projects: INpmProject[], configFile: IConfigFile): Promise<void> {
        LoggerUtil.printAction(`Running npm build in target projects`);

        return this.run(projects, "build", ECommandType.NPM_SCRIPT, false, configFile);
    }

    /**
     * Executes the run:watch npm script on multiple projects
     * @param projects List of projects, on which the run:watch npm script should be executed in
     * @param configFile Configs of pkgm
     */
    public async buildWatch(projects: INpmProject[], configFile: IConfigFile): Promise<void> {
        LoggerUtil.printAction(`Running npm build:watch in target projects`);

        return this.run(projects, "build:watch", ECommandType.NPM_SCRIPT, true, configFile);
    }
}