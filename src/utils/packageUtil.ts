import Logger from "@ptkdev/logger";
import fs from "fs";
import {IPackageJson} from "../definitions/i-package-json";
import {PathUtil} from "./path.util";
import {INpmPackageScopes} from "../definitions/npm/i-npm-package-scopes";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import {ListUtil} from "./list.util";
import {glob} from "glob";
import path from "path";

export class PackageUtil {
    private static readonly _LOGGER: Logger = new Logger();
    private static readonly _PACKAGE_NAME_SELF: string = "@zaeper/pkgm";
    private static readonly _PACKAGE_JSON_FILE_NAME: string = "package.json";
    private static readonly _PKGM_IGNORE_FILE_NAME: string = "pkgm.ignore";
    private static readonly _IGNORE_LIST: string[] = ['**/node_modules/**', '**/dist/**', '**/.pkgm/**'];

    /**
     * Generates a lookup map for npm npmPackages
     * @param npmPackages
     */
    public static getLookupMap<T extends INpmPackage>(npmPackages: T[]): Record<string, T> {
        return npmPackages.reduce((
            acc: Record<string, T>,
            curr: T
        ): Record<string, T> => {
            return {
                ...acc,
                [curr.packageJson.name]: curr
            }
        }, {})
    }

    /**
     * Searches the repository for frontend npmPackageCollection and return its relative paths.
     */
    public static async discoverPackagePaths(rootDir: string): Promise<string[]> {
        const pgkmIgnoreFilePath: string = PathUtil.join(rootDir, PackageUtil._PKGM_IGNORE_FILE_NAME);
        const pkgmIgnoreEntries: string[] = await ListUtil.readList(pgkmIgnoreFilePath);

        const ignoreList: string[] = [...PackageUtil._IGNORE_LIST, ...pkgmIgnoreEntries];

        const searchPatterns: string[] = [PathUtil.join(rootDir, "**", PackageUtil._PACKAGE_JSON_FILE_NAME)];
        const packageJsonFilePathsSearchResult: string[] = await glob(searchPatterns, {ignore: ignoreList});

        const packageJsonFilePaths: string[] = packageJsonFilePathsSearchResult.map(packageJsonFilePath => path.dirname(packageJsonFilePath));

        return packageJsonFilePaths.map(packageJsonFilePath => PathUtil.relative(rootDir, packageJsonFilePath))
    }

    public static getPaths(npmPackages: INpmPackage[]): string[] {
        return npmPackages.map(npmPackage => npmPackage.path);
    }

    public static getNames(npmPackages: INpmPackage[]): string[] {
        return npmPackages.map(npmPackage => npmPackage.packageJson.name)
    }

    /**
     * Persist package.json file
     * @param npmPackage Npm package in which the package.json should be persisted
     * @param packageJson Package.json configuration to persist
     * @param packageJsonFileName
     */
    public static writePackageJson(
        npmPackage: INpmPackage,
        packageJson: IPackageJson,
        packageJsonFileName: string
    ): void {
        const packageJsonFilePath: string = PathUtil.join(npmPackage.path, packageJsonFileName);

        const data: string = JSON.stringify(packageJson, null, 2);

        try {
            fs.writeFileSync(packageJsonFilePath, data);
        } catch (e) {
            PackageUtil._LOGGER.warning(`Could not overwrite package.json for ${npmPackage.packageJson.name}`);
        }
    }

    /**
     * Filter the list of packages according to the defined scopes
     * @param npmPackages List of npm packages to be filtered
     * @param npmPackageScopes Defined scopes to apply on the list of npm packages
     */
    public static filterByScopes<T extends INpmPackage>(
        npmPackages: T[],
        npmPackageScopes?: INpmPackageScopes
    ): T[] {
        if (npmPackageScopes === undefined) return npmPackages;

        return npmPackages.filter((npmPackage: T) => {
            const isSelf: boolean = npmPackage!.packageJson.name === PackageUtil._PACKAGE_NAME_SELF;

            let isSelected: boolean = true;
            let isPackageNameInScope: boolean = true;
            let isPackagePathInScope: boolean = true;
            const packageShouldBeExcluded: boolean = npmPackageScopes.excludedPackagePaths?.includes(npmPackage!.path) ?? false;

            if ((npmPackageScopes.packagePaths ?? []).length > 0) {
                isSelected = npmPackageScopes.packagePaths?.includes(npmPackage!.path) ?? false
            }

            if ((npmPackageScopes.packageNameScopes ?? []).length > 0) {
                isPackageNameInScope = !!npmPackageScopes.packageNameScopes!.find((packageNameScope: string) => {
                    return npmPackage!.packageJson.name.startsWith(packageNameScope);
                })
            }
            if ((npmPackageScopes.pathScopes ?? []).length > 0) {
                isPackagePathInScope = !!npmPackageScopes.pathScopes!.find((pathScope: string) => {
                    return npmPackage!.path.startsWith(pathScope);
                })
            }

            return isPackageNameInScope && isPackagePathInScope && isSelected && !packageShouldBeExcluded && !isSelf;
        });
    }

    /**
     * Cleans up the npmPackageScopes of unused scope entries
     * @param npmPackages used npm packages
     * @param npmPackageScopes defined npm package scopes
     */
    public static pruneUnusedNpmPackageScopes<T extends INpmPackage>(
        npmPackages: T[],
        npmPackageScopes: INpmPackageScopes
    ): INpmPackageScopes {
        const pathScopes: string[] = npmPackageScopes.pathScopes?.filter((pathScope: string) => {
            return !!npmPackages.find(npmPackage => npmPackage.path.startsWith(pathScope));
        }) ?? [];

        const packageNameScopes: string[] = npmPackageScopes.packageNameScopes?.filter((nameScope: string) => {
            return !!npmPackages.find(npmPackage => npmPackage.packageJson.name.startsWith(nameScope));
        }) ?? [];

        const packagePaths: string[] = npmPackageScopes.packagePaths?.filter((packagePath: string) => {
            return !!npmPackages.find(npmPackage => npmPackage.path.includes(packagePath));
        }) ?? [];

        const excludedPackagePaths: string[] = npmPackageScopes.excludedPackagePaths?.filter((excludedPathScope: string) => {
            return !!npmPackages.find(npmPackage => npmPackage.path.includes(excludedPathScope));
        }) ?? [];

        return {
            pathScopes,
            packagePaths,
            packageNameScopes,
            excludedPackagePaths
        }
    }
}