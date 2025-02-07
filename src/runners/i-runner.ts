import {EMode} from "../definitions/e-mode";
import {IConfigFile} from "../definitions/i-config-file";
import {INpmPackageScopes} from "../definitions/npm/i-npm-package-scopes";
import {EIncludeMode} from "./e-include-mode";

export interface IRunner<U, V, W> {
    run: (
        configs: IConfigFile,
        fn: U,
        mode: EMode,
        workspacesIncludeMode: EIncludeMode,
        silent: boolean,
        printTargetProjects: boolean,
        runnerOptions: W,
        npmPackageScopes: INpmPackageScopes,
        isInitializing?: boolean
    ) => Promise<V>;
}