import { INpmPackage } from "./i-npm-package";
import { ENpmPackageType } from "./e-npm-package-type";
export interface INpmWorkspace extends INpmPackage {
    type: ENpmPackageType.WORKSPACE;
}
