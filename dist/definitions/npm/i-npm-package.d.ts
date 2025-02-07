import { IPackageJson } from "../i-package-json";
import { ENpmPackageType } from "./e-npm-package-type";
import { IPackageLockJson } from "../i-package-lock-json";
export interface INpmPackage {
    type: ENpmPackageType;
    path: string;
    packageJsonPath: string;
    packageJson: IPackageJson;
    packageLockJsonPath?: string;
    packageLockJson?: IPackageLockJson;
    nodeModulesPath?: string;
}
