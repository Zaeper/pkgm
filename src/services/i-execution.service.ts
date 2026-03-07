import {ECommandType} from "../definitions/e-command-type";
import {INpmPackage} from "../definitions/npm/i-npm-package";

/**
 * Service interface for executing scripts and commands across npm packages
 */
export interface IExecutionService {
    /**
     * Executes a script or command across multiple npm packages
     * @param targets - The npm packages to execute the command in
     * @param command - The command or script to execute
     * @param commandType - The type of command (npm, npm script, or terminal)
     * @param npmClient - The npm client to use (npm, pnpm, yarn, bun)
     * @param async - Whether to run commands asynchronously with interactive output
     * @param showProgress - Whether to display progress information
     */
    executeScript(
        targets: INpmPackage[],
        command: string,
        commandType: ECommandType,
        npmClient: string,
        async?: boolean,
        showProgress?: boolean
    ): Promise<void>;
}