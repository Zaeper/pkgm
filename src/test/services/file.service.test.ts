import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { mock, MockProxy } from "jest-mock-extended";
import { FileService } from "../../services/file.service";
import { IExecutionService } from "../../services/i-execution.service";
import { IConfigFile } from "../../definitions/i-config-file";
import { INpmPackage } from "../../definitions/npm/i-npm-package";
import { ENpmPackageType } from "../../definitions/npm/e-npm-package-type";
import fs from "fs";

jest.mock("fs");

describe("FileService", () => {
    let fileService: FileService;
    let mockedExecutionService: MockProxy<IExecutionService>;
    const rootDir = "/root";

    const createPackage = (name: string, path: string, main?: string): INpmPackage => ({
        type: ENpmPackageType.PROJECT,
        path,
        packageJsonPath: `${path}/package.json`,
        packageJson: { name, main },
        packageLockJson: null,
        packageLockJsonPath: undefined,
        nodeModulesPath: undefined
    });

    beforeEach(() => {
        mockedExecutionService = mock<IExecutionService>();
        fileService = new FileService(rootDir, mockedExecutionService);
        jest.clearAllMocks();
    });

    describe("checkIfConfigFileExists", () => {
        it("should return true when config file exists", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const result = fileService.checkIfConfigFileExists();

            expect(result).toBe(true);
            expect(fs.existsSync).toHaveBeenCalledWith("/root/pkgm.json");
        });

        it("should return false when config file does not exist", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const result = fileService.checkIfConfigFileExists();

            expect(result).toBe(false);
        });
    });

    describe("writeConfigFile", () => {
        it("should write config to file", () => {
            const config: IConfigFile = {
                npmClient: "npm",
                projects: ["/pkg1", "/pkg2"]
            };

            fileService.writeConfigFile(config);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                "/root/pkgm.json",
                JSON.stringify(config, null, 2)
            );
        });

        it("should handle write errors gracefully", () => {
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {
                throw new Error("Permission denied");
            });

            const config: IConfigFile = { npmClient: "npm", projects: [] };

            expect(() => fileService.writeConfigFile(config)).not.toThrow();
        });
    });

    describe("readConfigFile", () => {
        it("should read and parse config file", () => {
            const config: IConfigFile = {
                npmClient: "npm",
                projects: ["/pkg1"]
            };
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(config));

            const result = fileService.readConfigFile();

            expect(result).toEqual(config);
        });

        it("should exit on file read error", () => {
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error("File not found");
            });
            const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
                throw new Error("process.exit");
            });

            expect(() => fileService.readConfigFile()).toThrow("process.exit");

            mockExit.mockRestore();
        });

        it("should exit on invalid JSON", () => {
            (fs.readFileSync as jest.Mock).mockReturnValue("invalid json {");
            const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
                throw new Error("process.exit");
            });

            expect(() => fileService.readConfigFile()).toThrow("process.exit");

            mockExit.mockRestore();
        });
    });

    describe("createSymlinks", () => {
        it("should call execution service for link command", async () => {
            const packages = [createPackage("@test/pkg1", "/pkg1", "index.js")];
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await fileService.createSymlinks(packages, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalled();
        });

        it("should exclude packages in excludeSymlinks", async () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1", "index.js"),
                createPackage("@test/pkg2", "/pkg2", "index.js")
            ];
            const configFile: IConfigFile = {
                npmClient: "npm",
                projects: [],
                excludeSymlinks: ["@test/pkg1"]
            };

            await fileService.createSymlinks(packages, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledTimes(1);
        });

        it("should exclude packages by path", async () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1", "index.js"),
                createPackage("@test/pkg2", "/pkg2", "index.js")
            ];
            const configFile: IConfigFile = {
                npmClient: "npm",
                projects: [],
                excludeSymlinks: ["/pkg1"]
            };

            await fileService.createSymlinks(packages, configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledTimes(1);
        });

        it("should handle empty packages array", async () => {
            const configFile: IConfigFile = { npmClient: "npm", projects: [] };

            await fileService.createSymlinks([], configFile);

            expect(mockedExecutionService.executeScript).toHaveBeenCalledWith(
                [],
                "link",
                expect.anything(),
                "npm"
            );
        });
    });

    describe("removeSymlinks", () => {
        it("should unlink packages globally", async () => {
            const packages = [
                createPackage("@test/pkg1", "/pkg1"),
                createPackage("@test/pkg2", "/pkg2")
            ];

            await fileService.removeSymlinks(packages);
        });

        it("should handle empty packages array", async () => {
            await expect(fileService.removeSymlinks([])).resolves.not.toThrow();
        });
    });
});
