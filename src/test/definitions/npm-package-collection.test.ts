import { describe, expect, it } from "@jest/globals";
import { NpmPackageCollection } from "../../definitions/npm-package-collection";
import { INpmProject } from "../../definitions/npm/i-npm-project";
import { INpmWorkspace } from "../../definitions/npm/i-npm-workspace";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";

describe("NpmPackageCollection", () => {
    const createProject = (name: string, path: string): INpmProject => ({
        type: ENpmPackageType.PROJECT,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    const createWorkspace = (name: string, path: string): INpmWorkspace => ({
        type: ENpmPackageType.WORKSPACE,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    describe("constructor and getters", () => {
        it("should return projects", () => {
            const projects = [createProject("@test/proj1", "/proj1")];
            const workspaces = [createWorkspace("@test/ws1", "/ws1")];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.projects).toEqual(projects);
        });

        it("should return workspaces", () => {
            const projects = [createProject("@test/proj1", "/proj1")];
            const workspaces = [createWorkspace("@test/ws1", "/ws1")];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.workspaces).toEqual(workspaces);
        });

        it("should return projectPaths", () => {
            const projects = [
                createProject("@test/proj1", "/proj1"),
                createProject("@test/proj2", "/proj2")
            ];
            const workspaces: INpmWorkspace[] = [];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.projectPaths).toEqual(["/proj1", "/proj2"]);
        });

        it("should return workspacePaths", () => {
            const projects: INpmProject[] = [];
            const workspaces = [
                createWorkspace("@test/ws1", "/ws1"),
                createWorkspace("@test/ws2", "/ws2")
            ];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.workspacePaths).toEqual(["/ws1", "/ws2"]);
        });

        it("should return combined packagePaths", () => {
            const projects = [createProject("@test/proj1", "/proj1")];
            const workspaces = [createWorkspace("@test/ws1", "/ws1")];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.packagePaths).toEqual(["/proj1", "/ws1"]);
        });

        it("should return combined packages", () => {
            const projects = [createProject("@test/proj1", "/proj1")];
            const workspaces = [createWorkspace("@test/ws1", "/ws1")];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.packages).toHaveLength(2);
            expect(collection.packages).toContain(projects[0]);
            expect(collection.packages).toContain(workspaces[0]);
        });

        it("should return projectNames", () => {
            const projects = [
                createProject("@test/proj1", "/proj1"),
                createProject("@test/proj2", "/proj2")
            ];
            const workspaces: INpmWorkspace[] = [];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.projectNames).toEqual(["@test/proj1", "@test/proj2"]);
        });

        it("should return workspaceNames", () => {
            const projects: INpmProject[] = [];
            const workspaces = [
                createWorkspace("@test/ws1", "/ws1"),
                createWorkspace("@test/ws2", "/ws2")
            ];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.workspaceNames).toEqual(["@test/ws1", "@test/ws2"]);
        });

        it("should return combined packageNames", () => {
            const projects = [createProject("@test/proj1", "/proj1")];
            const workspaces = [createWorkspace("@test/ws1", "/ws1")];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.packageNames).toEqual(["@test/proj1", "@test/ws1"]);
        });
    });

    describe("lookup maps", () => {
        it("should return projectsLookupMap", () => {
            const projects = [
                createProject("@test/proj1", "/proj1"),
                createProject("@test/proj2", "/proj2")
            ];
            const workspaces: INpmWorkspace[] = [];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.projectsLookupMap["@test/proj1"]).toEqual(projects[0]);
            expect(collection.projectsLookupMap["@test/proj2"]).toEqual(projects[1]);
        });

        it("should return workspacesLookupMap", () => {
            const projects: INpmProject[] = [];
            const workspaces = [
                createWorkspace("@test/ws1", "/ws1"),
                createWorkspace("@test/ws2", "/ws2")
            ];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.workspacesLookupMap["@test/ws1"]).toEqual(workspaces[0]);
            expect(collection.workspacesLookupMap["@test/ws2"]).toEqual(workspaces[1]);
        });

        it("should return combined packagesLookupMap", () => {
            const projects = [createProject("@test/proj1", "/proj1")];
            const workspaces = [createWorkspace("@test/ws1", "/ws1")];

            const collection = new NpmPackageCollection(projects, workspaces);

            expect(collection.packagesLookupMap["@test/proj1"]).toEqual(projects[0]);
            expect(collection.packagesLookupMap["@test/ws1"]).toEqual(workspaces[0]);
        });
    });

    describe("edge cases", () => {
        it("should handle empty collections", () => {
            const collection = new NpmPackageCollection([], []);

            expect(collection.projects).toEqual([]);
            expect(collection.workspaces).toEqual([]);
            expect(collection.packages).toEqual([]);
            expect(collection.packageNames).toEqual([]);
            expect(collection.packagePaths).toEqual([]);
            expect(collection.packagesLookupMap).toEqual({});
        });

        it("should handle only projects", () => {
            const projects = [createProject("@test/proj1", "/proj1")];
            const collection = new NpmPackageCollection(projects, []);

            expect(collection.projects).toHaveLength(1);
            expect(collection.workspaces).toHaveLength(0);
            expect(collection.packages).toHaveLength(1);
        });

        it("should handle only workspaces", () => {
            const workspaces = [createWorkspace("@test/ws1", "/ws1")];
            const collection = new NpmPackageCollection([], workspaces);

            expect(collection.projects).toHaveLength(0);
            expect(collection.workspaces).toHaveLength(1);
            expect(collection.packages).toHaveLength(1);
        });
    });
});
