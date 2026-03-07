import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { NpmProjectService } from "../../../services/npm/npm-project.service";
import { IExecutionService } from "../../../services/i-execution.service";
import { ENpmPackageType } from "../../../definitions/npm/e-npm-package-type";
import { IConfigFile } from "../../../definitions/i-config-file";
import { INpmProject } from "../../../definitions/npm/i-npm-project";
import { ECommandType } from "../../../definitions/e-command-type";

describe("NpmProjectService - build methods", () => {
    let npmProjectService: NpmProjectService;
    let mockedExecutionService: MockProxy<IExecutionService>;

    const createProject = (name: string, path: string, scripts: Record<string, string> = {}): INpmProject => ({
        type: ENpmPackageType.PROJECT,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name, scripts },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    beforeEach(() => {
        mockedExecutionService = mock<IExecutionService>();
        npmProjectService = new NpmProjectService(mockedExecutionService);
    });

    describe("build", () => {
        it("should call run with build command", async () => {
            const projects = [createProject("@test/pkg1", "/pkg1", { build: "tsc" })];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmProjectService.build(projects, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                projects,
                "build",
                ECommandType.NPM_SCRIPT,
                "npm",
                false
            );
        });
    });

    describe("buildWatch", () => {
        it("should call run with build:watch command in async mode", async () => {
            const projects = [createProject("@test/pkg1", "/pkg1", { "build:watch": "tsc --watch" })];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await npmProjectService.buildWatch(projects, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                projects,
                "build:watch",
                ECommandType.NPM_SCRIPT,
                "npm",
                true
            );
        });
    });
});
