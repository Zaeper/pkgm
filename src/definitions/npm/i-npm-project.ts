import {INpmPackage} from "./i-npm-package";
import {ENpmPackageType} from "./e-npm-package-type";

export interface INpmProject extends INpmPackage {
    type: ENpmPackageType.PROJECT;
}