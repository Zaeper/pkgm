import { describe, expect, it, beforeEach } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { NpmWorkspaceService } from "../../../services/npm/npm-workspace.service";
import { IExecutionService } from "../../../services/i-execution.service";
import { ENpmPackageType } from "../../../definitions/npm/e-npm-package-type";
import { INpmPackageScopes } from "../../../definitions/npm/i-npm-package-scopes";
import { IPackageJson } from "../../../definitions/i-package-json";
import { JsonUtil } from "../../../utils/json.util";
import { jest } from "@jest/globals";

jest.mock("../../../utils/json.util");

describe("NpmWorkspaceService", () => {
    let npmWorkspaceService: NpmWorkspaceService;
    let mockedExecutionService: MockProxy<IExecutionService>;

    const getMockedPackageJson = (name?: string): IPackageJson => ({
        name: name ?? "test-workspace"
    });

    beforeEach(() => {
        mockedExecutionService = mock<IExecutionService>();
        npmWorkspaceService = new NpmWorkspaceService(mockedExecutionService);
        JsonUtil.readJson = <T>(_: string): T => {
            return <T>getMockedPackageJson();
        };
    });

    describe("getPackages", () => {
        it("should return workspace packages", async () => {
            const packagePaths: string[] = ["/workspace"];
            const scopes: INpmPackageScopes = {};

            const packages = await npmWorkspaceService.getPackages(packagePaths, scopes);

            expect(packages).toHaveLength(1);
            expect(packages[0].type).toBe(ENpmPackageType.WORKSPACE);
        });

        it("should return empty array for empty paths", async () => {
            const packages = await npmWorkspaceService.getPackages([], {});

            expect(packages).toEqual([]);
        });

        it("should filter by path scopes", async () => {
            const packagePaths: string[] = ["/workspace1", "/workspace2", "/other"];
            const scopes: INpmPackageScopes = {
                pathScopes: ["/workspace"]
            };

            const packages = await npmWorkspaceService.getPackages(packagePaths, scopes);

            expect(packages).toHaveLength(2);
        });

        it("should set correct paths", async () => {
            const packagePaths: string[] = ["/workspace"];

            const packages = await npmWorkspaceService.getPackages(packagePaths, {});

            expect(packages[0].path).toBe("/workspace");
            expect(packages[0].packageJsonPath).toBe("/workspace/package.json");
        });
    });
});
