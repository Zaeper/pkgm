"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionService = void 0;
const child_process = __importStar(require("child_process"));
const logger_1 = __importDefault(require("@ptkdev/logger"));
const logger_util_1 = require("../utils/logger.util");
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = __importDefault(require("readline"));
const key_prompt_util_1 = require("../utils/key-prompt.util");
const e_command_type_1 = require("../definitions/e-command-type");
class ExecutionService {
    static _LOGGER = new logger_1.default();
    _keyPromptMessage;
    _lastEmitter;
    _projectList = [];
    _processQueue = [];
    _runningProcesses = [];
    _processIndex = 0;
    _printedLines = 0;
    constructor() {
    }
    async executeScript(targets, command, commandType, npmClient, async = false, showProgress = false) {
        this._cleanExecutionData();
        for (const npmPackage of targets) {
            logger_util_1.LoggerUtil.printProject(npmPackage);
            let assembledCommand;
            if (commandType === e_command_type_1.ECommandType.NPM || commandType === e_command_type_1.ECommandType.NPM_SCRIPT) {
                assembledCommand = this._assembleNPMScript(npmClient, command, commandType);
            }
            if (commandType === e_command_type_1.ECommandType.TERMINAL) {
                assembledCommand = this._assembleTerminalScript(command);
            }
            const index = targets.indexOf(npmPackage);
            logger_util_1.LoggerUtil.printStep(`${showProgress ? chalk_1.default.bgMagenta.bold.black(` Npm package ${index + 1}/${targets.length} `) + " " : ''}Executing \"${assembledCommand}\" in ${npmPackage.packageJson.name}`);
            if (commandType === e_command_type_1.ECommandType.NPM_SCRIPT) {
                const scriptName = Object.keys(npmPackage.packageJson.scripts ?? {}).find((scriptName) => {
                    return command.startsWith(scriptName);
                });
                const projectHasNpmCommand = !!scriptName;
                if (!projectHasNpmCommand) {
                    logger_util_1.LoggerUtil.printWarning(`Skippping execution. No script npm run ${scriptName} command found in ${npmPackage.packageJson.name}`);
                    continue;
                }
            }
            try {
                if (!async) {
                    await this._executeTerminalCommand(commandType, assembledCommand, npmPackage.path);
                }
                else {
                    const asyncProcess = () => {
                        const colors = [chalk_1.default.cyan, chalk_1.default.blue, chalk_1.default.magenta, chalk_1.default.red, chalk_1.default.green, chalk_1.default.gray, chalk_1.default.blueBright, chalk_1.default.magentaBright, chalk_1.default.redBright, chalk_1.default.cyanBright, chalk_1.default.greenBright];
                        const bgColors = [chalk_1.default.bgCyan, chalk_1.default.bgBlue, chalk_1.default.bgMagenta, chalk_1.default.bgRed, chalk_1.default.bgGreen, chalk_1.default.bgGray, chalk_1.default.bgBlueBright, chalk_1.default.bgMagentaBright, chalk_1.default.bgRedBright, chalk_1.default.bgCyanBright, chalk_1.default.bgGreenBright];
                        const colorIndex = index % colors.length;
                        const [runCommand, ...commandArgs] = assembledCommand.split(" ");
                        const process = child_process.spawn(runCommand, commandArgs, {
                            cwd: npmPackage.path, shell: true
                        });
                        process.stdout?.setEncoding('utf8');
                        process.stdout?.on('data', (data) => {
                            this._print(bgColors[colorIndex].bold.white ` [  ${npmPackage.packageJson.name}  ] `, colors[colorIndex](`${data}`));
                        });
                        process.stderr?.setEncoding('utf8');
                        process.stderr?.on('data', (data) => {
                            this._print(bgColors[colorIndex].bold.white ` [  ${npmPackage.packageJson.name}  ] `, colors[colorIndex](`${data}`));
                        });
                        process.on('close', (_) => {
                        });
                        return process;
                    };
                    if (index !== 0) {
                        this._projectList.push(npmPackage.packageJson.name);
                    }
                    this._processQueue.push(asyncProcess);
                }
            }
            catch (e) {
                ExecutionService._LOGGER.warning(`Could not execute script "${assembledCommand}" in ${npmPackage.packageJson.name}\n${e}`);
            }
        }
        if (async) {
            console.clear();
            const executionDeferred = this._createDeferred();
            for (let i = 0; i < this._processQueue.length; i++) {
                this._processIndex = i;
                let processQueueElement = this._processQueue[i];
                if (this._processQueue.length > i + 1) {
                    this._keyPromptMessage = `${chalk_1.default.bgGreen.black(`  Press ${chalk_1.default.bold.black("<ENTER>")} to start the next process `)}${chalk_1.default.bgWhite.black.bold(` ${this._projectList[this._processIndex]}  `)}`;
                }
                else {
                    this._keyPromptMessage = `${chalk_1.default.bgRed.white(`  Press ${chalk_1.default.bold.white("<ENTER>")} to exit running processes  `)}`;
                }
                this._runningProcesses.push(processQueueElement());
                await key_prompt_util_1.KeyPromptUtil.setKeyPrompt(() => {
                    logger_util_1.LoggerUtil.clearBottomLine();
                    if (this._processQueue.length === i + 1) {
                        this._quitRunningProcesses();
                        executionDeferred.resolve?.(undefined);
                    }
                    return;
                }, "return");
            }
            await Promise.all([executionDeferred.promise]);
        }
    }
    _executeTerminalCommand(commandType, command, cwd) {
        return new Promise((resolve, reject) => {
            const [executable, ...args] = command.split(' ');
            const child = child_process.spawn(executable, args, {
                cwd, stdio: "inherit", shell: true
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('error', (error) => {
                console.error(`Error executing command ${command}: ${error}`);
                reject(error);
            });
            child.on('close', (code) => {
                if (commandType === e_command_type_1.ECommandType.TERMINAL) {
                    if (code !== 0) {
                        const error = new Error(`Command failed with exit code ${code}`);
                        console.error(stderr || error.message);
                        reject(error);
                        return;
                    }
                }
                if (stderr) {
                    console.error(stderr);
                }
                process.stdout.write(stdout);
                resolve();
            });
        });
    }
    _print(emitter, text) {
        if (!!this._keyPromptMessage) {
            logger_util_1.LoggerUtil.clearBottomLine();
        }
        readline_1.default.cursorTo(process.stdout, 0, this._printedLines);
        if (this._lastEmitter !== emitter) {
            console.log(emitter);
            ++this._printedLines;
            this._lastEmitter = emitter;
        }
        console.log(text);
        this._printedLines += text.toString().split('\n').length;
        if (!!this._keyPromptMessage) {
            logger_util_1.LoggerUtil.printDemandActionMessage(this._keyPromptMessage);
        }
    }
    _quitRunningProcesses() {
        this._runningProcesses.forEach((runningProcess) => {
            if (runningProcess.pid === undefined) {
                console.error("Child process PID is undefined. Process might not have started or already exited.");
            }
            else {
                runningProcess.kill();
            }
        });
    }
    _cleanExecutionData() {
        this._keyPromptMessage = undefined;
        this._lastEmitter = undefined;
        this._projectList = [];
        this._processQueue = [];
        this._runningProcesses = [];
        this._processIndex = 0;
        this._printedLines = 0;
    }
    _assembleTerminalScript(command) {
        return command;
    }
    _assembleNPMScript(npmClient, npmCommand, commandType) {
        const commandChunks = [npmClient];
        if (commandType === e_command_type_1.ECommandType.NPM_SCRIPT) {
            commandChunks.push("run", npmCommand);
        }
        if (commandType === e_command_type_1.ECommandType.NPM) {
            commandChunks.push(npmCommand);
        }
        return commandChunks.join(" ");
    }
    _createDeferred() {
        let resolve = undefined;
        let reject = undefined;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return {
            promise, resolve, reject
        };
    }
}
exports.ExecutionService = ExecutionService;
