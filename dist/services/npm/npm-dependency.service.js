"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmDependencyService = void 0;
const logger_1 = __importDefault(require("@ptkdev/logger"));
const chalk_1 = __importDefault(require("chalk"));
const logger_util_1 = require("../../utils/logger.util");
const preload_1 = __importDefault(require("semver/preload"));
class NpmDependencyService {
    static _LOGGER = new logger_1.default();
    getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection) {
        if (unscopedNpmPackageCollection.packages.length === 1) {
            return unscopedNpmPackageCollection.packages;
        }
        const workspacePendingList = unscopedNpmPackageCollection.workspaces.reduce((acc, curr) => acc.set(curr.packageJson.name, curr), new Map());
        const projectPendingList = unscopedNpmPackageCollection.projects.reduce((acc, curr) => acc.set(curr.packageJson.name, curr), new Map());
        const addedList = [];
        const addDependencyFreeProject = (npmProject) => {
            const projectDependencyNames = this.getSummarizedNpmPackageInternalDependencies(npmProject, unscopedNpmPackageCollection);
            if (Object.keys(projectDependencyNames).every((projectDependencyName) => {
                return addedList.map(a => a.packageJson.name).includes(projectDependencyName);
            })) {
                addedList.push(npmProject);
                projectPendingList.delete(npmProject.packageJson.name);
            }
            else {
                if (!projectPendingList.has(npmProject.packageJson.name)) {
                    projectPendingList.set(npmProject.packageJson.name, npmProject);
                }
            }
        };
        const addDependencyFreeWorkspace = (workspace) => {
            const projectDependencyNames = this.getSummarizedNpmPackageInternalDependencies(workspace, unscopedNpmPackageCollection);
            if (Object.keys(projectDependencyNames).every((projectDependencyName) => {
                return addedList.map(a => a.packageJson.name).includes(projectDependencyName);
            })) {
                addedList.push(workspace);
                workspacePendingList.delete(workspace.packageJson.name);
            }
            else {
                if (!workspacePendingList.has(workspace.packageJson.name)) {
                    workspacePendingList.set(workspace.packageJson.name, workspace);
                }
            }
        };
        let prevIterationPendingListSize = 0;
        let index = 0;
        while (projectPendingList.size > 0 || addedList.length === 0) {
            if (index > 0 && prevIterationPendingListSize === projectPendingList.size) {
                NpmDependencyService._LOGGER.error("Got stuck in an endless loop while resolving dependencies. This may occur due to circular dependencies.");
                break;
            }
            prevIterationPendingListSize = projectPendingList.size;
            workspacePendingList.forEach((workspace) => {
                addDependencyFreeWorkspace(workspace);
            });
            projectPendingList.forEach((npmProject) => {
                const isInPendingWorkspace = !![...workspacePendingList.entries()].find(([_, pendingWorkspace]) => npmProject.path.startsWith(pendingWorkspace.path));
                if (!isInPendingWorkspace) {
                    addDependencyFreeProject(npmProject);
                }
            });
            ++index;
        }
        return addedList.filter((npmPackage) => {
            return npmPackageCollection.packages.map(p => p.packageJson.name).includes(npmPackage.packageJson.name);
        });
    }
    listInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection) {
        const sortedPackages = this.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
        logger_util_1.LoggerUtil.printInfo(`Found ${sortedPackages.length} ${sortedPackages.length === 1 ? 'package' : 'packages'}. Listed in processing order.`);
        logger_util_1.LoggerUtil.printOutputTitle("Packages");
        sortedPackages.forEach((targetNpmPackage) => {
            logger_util_1.LoggerUtil.printIndented(`${chalk_1.default.cyan(targetNpmPackage.packageJson.name)} ${chalk_1.default.gray(targetNpmPackage.path)}`, 2);
            const packageDependencies = this.getSummarizedNpmPackageInternalDependencies(targetNpmPackage, unscopedNpmPackageCollection);
            const packagesLookupMap = unscopedNpmPackageCollection.packagesLookupMap;
            Object.entries(packageDependencies).forEach(([packageName, packageVersion]) => {
                const npmPackage = packagesLookupMap[packageName];
                const hasValidVersionNumber = preload_1.default.valid(packageVersion);
                const tags = [];
                const outputTextChunks = [chalk_1.default.white(`${packageName}`)];
                if (Object.keys(targetNpmPackage.packageJson.peerDependencies ?? {}).includes(packageName)) {
                    tags.push(chalk_1.default.magenta("PeerDependency"));
                }
                if (hasValidVersionNumber !== null) {
                    outputTextChunks.push(`${chalk_1.default.white("@")}${chalk_1.default.green(`${packageVersion}`)}`);
                }
                else {
                    tags.push(chalk_1.default.yellow(`Linked`));
                }
                if (npmPackage.packageJson.private) {
                    tags.push(chalk_1.default.red(`Private`));
                }
                if (tags.length > 0) {
                    outputTextChunks.push(chalk_1.default.white(` (${tags.join(", ")})`));
                }
                logger_util_1.LoggerUtil.printIndented(outputTextChunks.join(""), 3);
            });
        });
    }
    getNpmPackageInternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.dependencies ?? {})) {
            if (unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getNpmPackageDependencies(npmPackage) {
        return npmPackage.packageJson.dependencies ?? {};
    }
    getNpmPackageExternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.dependencies ?? {})) {
            if (!unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getNpmPackagePeerInternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.peerDependencies ?? {})) {
            if (unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getNpmPackagePeerDependencies(npmPackage) {
        return npmPackage.packageJson.peerDependencies ?? {};
    }
    getNpmPackagePeerExternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.peerDependencies ?? {})) {
            if (!unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getNpmPackageDevInternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.devDependencies ?? {})) {
            if (unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getNpmPackageDevDependencies(npmPackage) {
        return npmPackage.packageJson.devDependencies ?? {};
    }
    getNpmPackageDevExternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencyMap = {};
        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.devDependencies ?? {})) {
            if (!unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }
        return dependencyMap;
    }
    getSummarizedNpmPackageInternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencies = this.getNpmPackageInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const devDependencies = this.getNpmPackageDevInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const peerDependencies = this.getNpmPackagePeerInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        return {
            ...peerDependencies, ...devDependencies, ...dependencies
        };
    }
    getSummarizedNpmPackageExternalDependencies(npmPackage, unscopedNpmPackageCollection) {
        const dependencies = this.getNpmPackageExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const devDependencies = this.getNpmPackageDevExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const peerDependencies = this.getNpmPackagePeerExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        return {
            ...peerDependencies, ...devDependencies, ...dependencies
        };
    }
}
exports.NpmDependencyService = NpmDependencyService;
