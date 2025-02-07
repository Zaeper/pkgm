"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageUtil = void 0;
const logger_1 = __importDefault(require("@ptkdev/logger"));
const fs_1 = __importDefault(require("fs"));
const path_util_1 = require("./path.util");
const list_util_1 = require("./list.util");
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
class PackageUtil {
    static _LOGGER = new logger_1.default();
    static _PACKAGE_NAME_SELF = "@zaeper/pkgm";
    static _PACKAGE_JSON_FILE_NAME = "package.json";
    static _PKGM_IGNORE_FILE_NAME = "pkgm.ignore";
    static _IGNORE_LIST = ['**/node_modules/**', '**/dist/**', '**/.pkgm/**'];
    static getLookupMap(npmPackages) {
        return npmPackages.reduce((acc, curr) => {
            return {
                ...acc,
                [curr.packageJson.name]: curr
            };
        }, {});
    }
    static async discoverPackagePaths(rootDir) {
        const pgkmIgnoreFilePath = path_util_1.PathUtil.join(rootDir, PackageUtil._PKGM_IGNORE_FILE_NAME);
        const pkgmIgnoreEntries = await list_util_1.ListUtil.readList(pgkmIgnoreFilePath);
        const ignoreList = [...PackageUtil._IGNORE_LIST, ...pkgmIgnoreEntries];
        const searchPatterns = [path_util_1.PathUtil.join(rootDir, "**", PackageUtil._PACKAGE_JSON_FILE_NAME)];
        const packageJsonFilePathsSearchResult = await (0, glob_1.glob)(searchPatterns, { ignore: ignoreList });
        const packageJsonFilePaths = packageJsonFilePathsSearchResult.map(packageJsonFilePath => path_1.default.dirname(packageJsonFilePath));
        return packageJsonFilePaths.map(packageJsonFilePath => path_util_1.PathUtil.relative(rootDir, packageJsonFilePath));
    }
    static getPaths(npmPackages) {
        return npmPackages.map(npmPackage => npmPackage.path);
    }
    static getNames(npmPackages) {
        return npmPackages.map(npmPackage => npmPackage.packageJson.name);
    }
    static writePackageJson(npmPackage, packageJson, packageJsonFileName) {
        const packageJsonFilePath = path_util_1.PathUtil.join(npmPackage.path, packageJsonFileName);
        const data = JSON.stringify(packageJson, null, 2);
        try {
            fs_1.default.writeFileSync(packageJsonFilePath, data);
        }
        catch (e) {
            PackageUtil._LOGGER.warning(`Could not overwrite package.json for ${npmPackage.packageJson.name}`);
        }
    }
    static filterByScopes(npmPackages, npmPackageScopes) {
        if (npmPackageScopes === undefined)
            return npmPackages;
        return npmPackages.filter((npmPackage) => {
            const isSelf = npmPackage.packageJson.name === PackageUtil._PACKAGE_NAME_SELF;
            let isSelected = true;
            let isPackageNameInScope = true;
            let isPackagePathInScope = true;
            const packageShouldBeExcluded = npmPackageScopes.excludedPackagePaths?.includes(npmPackage.path) ?? false;
            if ((npmPackageScopes.packagePaths ?? []).length > 0) {
                isSelected = npmPackageScopes.packagePaths?.includes(npmPackage.path) ?? false;
            }
            if ((npmPackageScopes.packageNameScopes ?? []).length > 0) {
                isPackageNameInScope = !!npmPackageScopes.packageNameScopes.find((packageNameScope) => {
                    return npmPackage.packageJson.name.startsWith(packageNameScope);
                });
            }
            if ((npmPackageScopes.pathScopes ?? []).length > 0) {
                isPackagePathInScope = !!npmPackageScopes.pathScopes.find((pathScope) => {
                    return npmPackage.path.startsWith(pathScope);
                });
            }
            return isPackageNameInScope && isPackagePathInScope && isSelected && !packageShouldBeExcluded && !isSelf;
        });
    }
    static pruneUnusedNpmPackageScopes(npmPackages, npmPackageScopes) {
        const pathScopes = npmPackageScopes.pathScopes?.filter((pathScope) => {
            return !!npmPackages.find(npmPackage => npmPackage.path.startsWith(pathScope));
        }) ?? [];
        const packageNameScopes = npmPackageScopes.packageNameScopes?.filter((nameScope) => {
            return !!npmPackages.find(npmPackage => npmPackage.packageJson.name.startsWith(nameScope));
        }) ?? [];
        const packagePaths = npmPackageScopes.packagePaths?.filter((packagePath) => {
            return !!npmPackages.find(npmPackage => npmPackage.path.includes(packagePath));
        }) ?? [];
        const excludedPackagePaths = npmPackageScopes.excludedPackagePaths?.filter((excludedPathScope) => {
            return !!npmPackages.find(npmPackage => npmPackage.path.includes(excludedPathScope));
        }) ?? [];
        return {
            pathScopes,
            packagePaths,
            packageNameScopes,
            excludedPackagePaths
        };
    }
}
exports.PackageUtil = PackageUtil;
