import {EMode} from "../definitions/e-mode";
import {IConfigFile} from "../definitions/i-config-file";
import {INpmPackageScopes} from "../definitions/npm/i-npm-package-scopes";
import {EIncludeMode} from "./e-include-mode";

/**
 * Generic interface for command runners
 * @typeParam U - Type of the callback function
 * @typeParam V - Return type of the run method
 * @typeParam W - Type of runner-specific options
 */
export interface IRunner<U, V, W> {
    /**
     * Executes the runner with the given configuration and callback
     * @param configs - The pkgm configuration
     * @param fn - The callback function to execute
     * @param mode - Interactive or command mode
     * @param workspacesIncludeMode - How to include workspaces
     * @param silent - Whether to suppress output
     * @param printTargetProjects - Whether to print affected projects
     * @param runnerOptions - Runner-specific options
     * @param npmPackageScopes - Scopes to filter packages
     * @param isInitializing - Whether this is during initialization
     */
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