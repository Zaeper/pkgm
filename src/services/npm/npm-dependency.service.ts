/**
 * This service provides methods to manage the dependencies of npm packages.
 * @author Dennis Brönnimann
 * @license MIT
 */

import Logger from "@ptkdev/logger";
import chalk from "chalk";
import {INpmDependencyService} from "./i-npm-dependency.service";
import {INpmProject} from "../../definitions/npm/i-npm-project";
import {INpmWorkspace} from "../../definitions/npm/i-npm-workspace";
import {INpmPackage} from "../../definitions/npm/i-npm-package";
import {NpmPackageCollection} from "../../definitions/npm-package-collection";
import {LoggerUtil} from "../../utils/logger.util";
import semver from "semver/preload";

export class NpmDependencyService implements INpmDependencyService {
    private static readonly _LOGGER: Logger = new Logger();

    /**
     * Retrieves all npm packages by internal dependencies
     * Npm Packages with the least amount of internal dependencies, will be listed at the top
     * @param npmPackageCollection Npm package collection to retrieve all dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getSortedNpmPackagesByInternalDependencies(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): INpmPackage[] {
        if (unscopedNpmPackageCollection.packages.length === 1) {
            return unscopedNpmPackageCollection.packages;
        }

        const workspacePendingList: Map<string, INpmWorkspace> = unscopedNpmPackageCollection.workspaces.reduce((
            acc: Map<string, INpmWorkspace>,
            curr: INpmWorkspace
        ): Map<string, INpmWorkspace> => acc.set(curr.packageJson.name, curr), new Map());
        const projectPendingList: Map<string, INpmProject> = unscopedNpmPackageCollection.projects.reduce((
            acc: Map<string, INpmProject>,
            curr: INpmProject
        ): Map<string, INpmProject> => acc.set(curr.packageJson.name, curr), new Map());
        const addedList: INpmPackage[] = [];

        const addDependencyFreeProject = (npmProject: INpmProject) => {
            const projectDependencyNames: Record<string, string> = this.getSummarizedNpmPackageInternalDependencies(npmProject, unscopedNpmPackageCollection);

            if (Object.keys(projectDependencyNames).every((projectDependencyName: string) => {
                return addedList.map(a => a.packageJson.name).includes(projectDependencyName);
            })) {
                addedList.push(npmProject);
                projectPendingList.delete(npmProject.packageJson.name);
            } else {
                if (!projectPendingList.has(npmProject.packageJson.name)) {
                    projectPendingList.set(npmProject.packageJson.name, npmProject);
                }
            }
        }

        const addDependencyFreeWorkspace = (workspace: INpmWorkspace) => {
            const projectDependencyNames: Record<string, string> = this.getSummarizedNpmPackageInternalDependencies(workspace, unscopedNpmPackageCollection);

            if (Object.keys(projectDependencyNames).every((projectDependencyName: string) => {
                return addedList.map(a => a.packageJson.name).includes(projectDependencyName);
            })) {
                addedList.push(workspace);
                workspacePendingList.delete(workspace.packageJson.name);
            } else {
                if (!workspacePendingList.has(workspace.packageJson.name)) {
                    workspacePendingList.set(workspace.packageJson.name, workspace);
                }
            }
        }

        let prevIterationPendingListSize: number = 0;
        let index = 0;

        while (projectPendingList.size > 0 || addedList.length === 0) {
            if (index > 0 && prevIterationPendingListSize === projectPendingList.size) {
                NpmDependencyService._LOGGER.error("Got stuck in an endless loop while resolving dependencies. This may occur due to circular dependencies.")
                break;
            }

            prevIterationPendingListSize = projectPendingList.size;

            workspacePendingList.forEach((workspace: INpmWorkspace) => {
                addDependencyFreeWorkspace(workspace);
            })

            projectPendingList.forEach((npmProject: INpmProject) => {
                const isInPendingWorkspace: boolean = !![...workspacePendingList.entries()].find(([_, pendingWorkspace]) => npmProject.path.startsWith(pendingWorkspace.path));

                if (!isInPendingWorkspace) {
                    addDependencyFreeProject(npmProject);
                }
            })

            ++index;
        }


        return addedList.filter((npmPackage: INpmPackage) => {
            return npmPackageCollection.packages.map(p => p.packageJson.name).includes(npmPackage.packageJson.name);
        });
    }

    /**
     * Lists all defined internal dependencies of a package, defined in its package.json
     * @param npmPackageCollection Collection of scoped npm packages, of which its internal dependencies should be listed
     * @param unscopedNpmPackageCollection Collection of all npm packages, to create the dependency tree
     */
    public listInternalDependencies(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): void {
        const sortedPackages: INpmPackage[] = this.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);

        LoggerUtil.printInfo(`Found ${sortedPackages.length} ${sortedPackages.length === 1 ? 'package' : 'packages'}. Listed in processing order.`)
        LoggerUtil.printOutputTitle("Packages")

        sortedPackages.forEach((targetNpmPackage: INpmPackage) => {
            LoggerUtil.printIndented(`${chalk.cyan(targetNpmPackage.packageJson.name)} ${chalk.gray(targetNpmPackage.path)}`, 2)

            const packageDependencies: Record<string, string> = this.getSummarizedNpmPackageInternalDependencies(targetNpmPackage, unscopedNpmPackageCollection);
            const packagesLookupMap: Record<string, INpmPackage> = unscopedNpmPackageCollection.packagesLookupMap;

            Object.entries(packageDependencies).forEach(([packageName, packageVersion]) => {
                const npmPackage: INpmPackage = packagesLookupMap[packageName];
                const hasValidVersionNumber: string | null = semver.valid(packageVersion)

                const tags: string[] = [];
                const outputTextChunks: string[] = [chalk.white(`${packageName}`)];

                if (Object.keys(targetNpmPackage.packageJson.peerDependencies ?? {}).includes(packageName)) {
                    tags.push(chalk.magenta("PeerDependency"))
                }

                if (hasValidVersionNumber !== null) {
                    outputTextChunks.push(`${chalk.white("@")}${chalk.green(`${packageVersion}`)}`);
                } else {
                    tags.push(chalk.yellow(`Linked`));

                }

                if (npmPackage.packageJson.private) {
                    tags.push(chalk.red(`Private`));
                }
                if (tags.length > 0) {
                    outputTextChunks.push(chalk.white(` (${tags.join(", ")})`));
                }

                LoggerUtil.printIndented(outputTextChunks.join(""), 3);
            })
        })
    }

    /**
     * Retrieves all internal dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the internal dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getNpmPackageInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencyMap: Record<string, string> = {};

        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.dependencies ?? {})) {
            if (unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }

        return dependencyMap;
    }

    public getNpmPackageDependencies(npmPackage: INpmPackage): Record<string, string> {
        return npmPackage.packageJson.dependencies ?? {};
    }

    /**
     * Retrieves all external dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the external dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getNpmPackageExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencyMap: Record<string, string> = {};

        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.dependencies ?? {})) {
            if (!unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }

        return dependencyMap;
    }

    /**
     * Retrieves all internal peer dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the internal peer dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getNpmPackagePeerInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencyMap: Record<string, string> = {};

        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.peerDependencies ?? {})) {
            if (unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }

        return dependencyMap;
    }

    /**
     * Retrieves all peer dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the peer dependencies from
     */
    public getNpmPackagePeerDependencies(npmPackage: INpmPackage): Record<string, string> {
        return npmPackage.packageJson.peerDependencies ?? {};
    }

    /**
     * Retrieves all external peer dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the external peer dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getNpmPackagePeerExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencyMap: Record<string, string> = {};

        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.peerDependencies ?? {})) {
            if (!unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }

        return dependencyMap;
    }

    /**
     * Retrieves all internal dev dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the internal dev dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getNpmPackageDevInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencyMap: Record<string, string> = {};

        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.devDependencies ?? {})) {
            if (unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }

        return dependencyMap;
    }

    /**
     * Retrieves all dev dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the dev dependencies from
     */
    public getNpmPackageDevDependencies(npmPackage: INpmPackage): Record<string, string> {
        return npmPackage.packageJson.devDependencies ?? {};
    }

    /**
     * Retrieves all external dev dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the external dev dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getNpmPackageDevExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencyMap: Record<string, string> = {};

        for (const [dependencyName, dependencyVersion] of Object.entries(npmPackage.packageJson.devDependencies ?? {})) {
            if (!unscopedNpmPackageCollection.packageNames.includes(dependencyName)) {
                dependencyMap[dependencyName] = dependencyVersion;
            }
        }

        return dependencyMap;
    }

    /**
     * Retrieves all internal dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the internal dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getSummarizedNpmPackageInternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencies: Record<string, string> = this.getNpmPackageInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const devDependencies: Record<string, string> = this.getNpmPackageDevInternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const peerDependencies: Record<string, string> = this.getNpmPackagePeerInternalDependencies(npmPackage, unscopedNpmPackageCollection);

        return {
            ...peerDependencies, ...devDependencies, ...dependencies
        };
    }

    /**
     * Retrieves all internal dependencies of a npm package
     * @param npmPackage Npm package to retrieve all the external dependencies from
     * @param unscopedNpmPackageCollection lookup npm package collection
     */
    public getSummarizedNpmPackageExternalDependencies(
        npmPackage: INpmPackage,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): Record<string, string> {
        const dependencies: Record<string, string> = this.getNpmPackageExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const devDependencies: Record<string, string> = this.getNpmPackageDevExternalDependencies(npmPackage, unscopedNpmPackageCollection);
        const peerDependencies: Record<string, string> = this.getNpmPackagePeerExternalDependencies(npmPackage, unscopedNpmPackageCollection);

        return {
            ...peerDependencies, ...devDependencies, ...dependencies
        };
    }
}