import { IExecutionService } from "./i-execution.service";
import { ECommandType } from "../definitions/e-command-type";
import { INpmPackage } from "../definitions/npm/i-npm-package";
export declare class ExecutionService implements IExecutionService {
    private static readonly _LOGGER;
    private _keyPromptMessage;
    private _lastEmitter;
    private _projectList;
    private _processQueue;
    private _runningProcesses;
    private _processIndex;
    private _printedLines;
    constructor();
    executeScript(targets: INpmPackage[], command: string, commandType: ECommandType, async?: boolean, showProgress?: boolean): Promise<void>;
    private _executeTerminalCommand;
    private _print;
    private _quitRunningProcesses;
    private _cleanExecutionData;
    private _assembleTerminalScript;
    private _assembleNPMScript;
    private _createDeferred;
}
