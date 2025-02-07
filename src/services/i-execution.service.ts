import {ECommandType} from "../definitions/e-command-type";
import {INpmPackage} from "../definitions/npm/i-npm-package";

export interface IExecutionService {
    executeScript(
        targets: INpmPackage[],
        command: string,
        commandType: ECommandType,
        npmClient: string,
        async?: boolean,
        showProgress?: boolean
    ): Promise<void>;
}