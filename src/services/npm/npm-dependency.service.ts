/**
 * This service provides methods to manage the dependencies of npm packages.
 * @author Dennis Brönnimann
 * @license MIT
 */

import Logger from "@ptkdev/logger";
import chalk from "chalk";
import path from "path";
import {IDependencyEntryJson, INpmDependencyService, IPackageDependencyJson} from "./i-npm-dependency.service";
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

        if (projectPendingList.size === 0 && workspacePendingList.size === 0) {
            return addedList;
        }

        while (projectPendingList.size > 0 || workspacePendingList.size > 0) {
            if (index > 0 && prevIterationPendingListSize === projectPendingList.size + workspacePendingList.size) {
                NpmDependencyService._LOGGER.error("Got stuck in an endless loop while resolving dependencies. This may occur due to circular dependencies.")
                break;
            }

            prevIterationPendingListSize = projectPendingList.size + workspacePendingList.size;

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
                const npmPackage: INpmPackage | undefined = packagesLookupMap[packageName];
                const hasValidVersionNumber: boolean = semver.valid(packageVersion) !== null;

                const tags: string[] = [];
                const outputTextChunks: string[] = [chalk.white(`${packageName}`)];

                if (Object.keys(targetNpmPackage.packageJson.peerDependencies ?? {}).includes(packageName)) {
                    tags.push(chalk.magenta("PeerDependency"))
                }

                if (hasValidVersionNumber) {
                    outputTextChunks.push(`${chalk.white("@")}${chalk.green(`${packageVersion}`)}`);
                } else {
                    tags.push(chalk.yellow(`Linked`));

                }

                if (npmPackage?.packageJson.private) {
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

    /**
     * Finds all publishable packages that are transitively affected by changes
     * in the given paths. Uses BFS through the reverse internal dependency graph.
     * @param changedPaths Paths (absolute or relative) of changed packages/libraries
     * @param npmPackageCollection Collection of all npm packages
     * @param rootDir Root directory for resolving relative paths
     */
    public getAffectedPublishablePackages(
        changedPaths: string[],
        npmPackageCollection: NpmPackageCollection,
        rootDir: string
    ): INpmPackage[] {
        // Resolve all changed paths to absolute
        const absoluteChangedPaths: string[] = changedPaths.map(
            (p: string) => path.isAbsolute(p) ? p : path.resolve(rootDir, p)
        );

        // Build reverse dependency map: packageName -> [names of packages that depend on it]
        const reverseDeps: Map<string, string[]> = new Map();
        for (const pkg of npmPackageCollection.packages) {
            const internalDeps: Record<string, string> = this.getSummarizedNpmPackageInternalDependencies(
                pkg, npmPackageCollection
            );
            for (const depName of Object.keys(internalDeps)) {
                if (!reverseDeps.has(depName)) {
                    reverseDeps.set(depName, []);
                }
                reverseDeps.get(depName)!.push(pkg.packageJson.name);
            }
        }

        // Match changed paths to package names
        const changedPackageNames: Set<string> = new Set();
        for (const changedPath of absoluteChangedPaths) {
            for (const pkg of npmPackageCollection.packages) {
                if (pkg.path === changedPath || changedPath.startsWith(pkg.path + path.sep) || pkg.path.startsWith(changedPath + path.sep)) {
                    changedPackageNames.add(pkg.packageJson.name);
                }
            }
        }

        // BFS through reverse dependency graph
        const visited: Set<string> = new Set();
        const queue: string[] = [...changedPackageNames];
        const affectedPublishable: INpmPackage[] = [];
        const lookupMap: Record<string, INpmPackage> = npmPackageCollection.packagesLookupMap;

        while (queue.length > 0) {
            const current: string = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);

            const pkg: INpmPackage | undefined = lookupMap[current];
            if (pkg) {
                const hasPublishScript: boolean = !!pkg.packageJson.scripts &&
                    Object.keys(pkg.packageJson.scripts).some((s: string) => s.startsWith("publish:"));
                if (hasPublishScript) {
                    affectedPublishable.push(pkg);
                }
            }

            // Follow reverse deps
            const dependents: string[] = reverseDeps.get(current) || [];
            for (const dep of dependents) {
                if (!visited.has(dep)) {
                    queue.push(dep);
                }
            }
        }

        return affectedPublishable;
    }

    /**
     * Returns internal dependencies as a JSON-serializable array, sorted in
     * processing order.
     */
    public getInternalDependenciesJson(
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        rootDir: string
    ): IPackageDependencyJson[] {
        const sortedPackages: INpmPackage[] = this.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);
        const packagesLookupMap: Record<string, INpmPackage> = unscopedNpmPackageCollection.packagesLookupMap;

        return sortedPackages.map((pkg: INpmPackage): IPackageDependencyJson => {
            const relativePath: string = pkg.path.startsWith(rootDir)
                ? pkg.path.substring(rootDir.length + 1)
                : pkg.path;

            const packageDependencies: Record<string, string> = this.getSummarizedNpmPackageInternalDependencies(pkg, unscopedNpmPackageCollection);
            const peerDeps: Record<string, string> = pkg.packageJson.peerDependencies ?? {};
            const devDeps: Record<string, string> = pkg.packageJson.devDependencies ?? {};

            const dependencies: IDependencyEntryJson[] = Object.entries(packageDependencies).map(
                ([depName, depVersion]: [string, string]): IDependencyEntryJson => {
                    const depPackage: INpmPackage | undefined = packagesLookupMap[depName];
                    const hasValidVersion: boolean = semver.valid(depVersion) !== null;

                    return {
                        name: depName,
                        version: depVersion,
                        isPeerDependency: Object.keys(peerDeps).includes(depName),
                        isDevDependency: Object.keys(devDeps).includes(depName),
                        isLinked: !hasValidVersion,
                        isPrivate: !!depPackage?.packageJson.private
                    };
                }
            );

            return {
                name: pkg.packageJson.name,
                path: relativePath,
                dependencies
            };
        });
    }

    /**
     * Returns the transitive closure of internal dependencies for a given
     * package, filtered from the topologically sorted list.
     */
    public getTransitiveDependencies(
        packageName: string,
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection
    ): INpmPackage[] {
        const sortedPackages: INpmPackage[] = this.getSortedNpmPackagesByInternalDependencies(npmPackageCollection, unscopedNpmPackageCollection);

        // BFS to find all transitive dependencies
        const transitive: Set<string> = new Set();
        const queue: string[] = [packageName];

        while (queue.length > 0) {
            const current: string = queue.shift()!;
            if (transitive.has(current)) continue;
            transitive.add(current);

            const pkg: INpmPackage | undefined = unscopedNpmPackageCollection.packagesLookupMap[current];
            if (!pkg) continue;

            const deps: Record<string, string> = this.getSummarizedNpmPackageInternalDependencies(pkg, unscopedNpmPackageCollection);
            for (const depName of Object.keys(deps)) {
                if (!transitive.has(depName)) {
                    queue.push(depName);
                }
            }
        }

        return sortedPackages.filter((pkg: INpmPackage) => transitive.has(pkg.packageJson.name));
    }
}