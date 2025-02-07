import {IExecutionService} from "./i-execution.service";
import * as child_process from "child_process";
import Logger from "@ptkdev/logger";
import {LoggerUtil} from "../utils/logger.util";
import chalk from "chalk";
import readline from "readline";
import {ChildProcess} from "node:child_process";
import {KeyPromptUtil} from "../utils/key-prompt.util";
import {ECommandType} from "../definitions/e-command-type";
import {INpmPackage} from "../definitions/npm/i-npm-package";
import {NpmClientType} from "../definitions/npm/npm-client-type";

interface IDeferred {
    promise: Promise<void>,
    resolve: ((value: void | PromiseLike<void>) => void) | undefined,
    reject: ((reason?: any) => void) | undefined
}

export class ExecutionService implements IExecutionService {
    private static readonly _LOGGER: Logger = new Logger();

    private _keyPromptMessage: string | undefined;
    private _lastEmitter: string | undefined;
    private _projectList: string[] = [];
    private _processQueue: (() => ChildProcess)[] = [];
    private _runningProcesses: ChildProcess[] = [];
    private _processIndex: number = 0;
    private _printedLines: number = 0;

    constructor() {
    }

    public async executeScript(targets: INpmPackage[], command: string, commandType: ECommandType, npmClient: NpmClientType, async = false, showProgress: boolean = false): Promise<void> {
        this._cleanExecutionData();

        for (const npmPackage of targets) {
            LoggerUtil.printProject(npmPackage);

            let assembledCommand: string;
            if (commandType === ECommandType.NPM || commandType === ECommandType.NPM_SCRIPT) {
                assembledCommand = this._assembleNPMScript(npmClient, command, commandType);
            }
            if (commandType === ECommandType.TERMINAL) {
                assembledCommand = this._assembleTerminalScript(command);
            }


            const index: number = targets.indexOf(npmPackage);

            LoggerUtil.printStep(`${showProgress ? chalk.bgMagenta.bold.black(` Npm package ${index + 1}/${targets.length} `) + " " : ''}Executing \"${assembledCommand!}\" in ${npmPackage.packageJson.name}`)

            if (commandType === ECommandType.NPM_SCRIPT) {
                const scriptName: string | undefined = Object.keys(npmPackage.packageJson.scripts ?? {}).find((scriptName: string) => {
                    return command.startsWith(scriptName)
                });
                const projectHasNpmCommand: boolean = !!scriptName;

                if (!projectHasNpmCommand) {
                    LoggerUtil.printWarning(`Skippping execution. No script npm run ${scriptName} command found in ${npmPackage.packageJson.name}`);
                    continue;
                }
            }

            try {
                if (!async) {
                    await this._executeTerminalCommand(commandType, assembledCommand!, npmPackage.path);
                } else {
                    const asyncProcess = (): ChildProcess => {
                        const colors: chalk.Chalk[] = [chalk.cyan, chalk.blue, chalk.magenta, chalk.red, chalk.green, chalk.gray, chalk.blueBright, chalk.magentaBright, chalk.redBright, chalk.cyanBright, chalk.greenBright];
                        const bgColors: chalk.Chalk[] = [chalk.bgCyan, chalk.bgBlue, chalk.bgMagenta, chalk.bgRed, chalk.bgGreen, chalk.bgGray, chalk.bgBlueBright, chalk.bgMagentaBright, chalk.bgRedBright, chalk.bgCyanBright, chalk.bgGreenBright];
                        const colorIndex: number = index % colors.length;

                        const [runCommand, ...commandArgs]: string[] = assembledCommand.split(" ");

                        const process = child_process.spawn(runCommand, commandArgs, {
                            cwd: npmPackage.path, shell: true
                        });

                        process.stdout?.setEncoding('utf8');
                        process.stdout?.on('data', (data) => {
                            this._print(bgColors[colorIndex].bold.white` [  ${npmPackage.packageJson.name}  ] `, colors[colorIndex](`${data}`));
                        });

                        process.stderr?.setEncoding('utf8');
                        process.stderr?.on('data', (data) => {
                            this._print(bgColors[colorIndex].bold.white` [  ${npmPackage.packageJson.name}  ] `, colors[colorIndex](`${data}`));
                        });

                        process.on('close', (_) => {

                        });

                        return process;
                    }

                    if (index !== 0) {
                        this._projectList.push(npmPackage.packageJson.name)
                    }
                    this._processQueue.push(asyncProcess);
                }
            } catch (e) {
                ExecutionService._LOGGER.warning(`Could not execute script "${assembledCommand!}" in ${npmPackage.packageJson.name}\n${e}`)
            }
        }

        if (async) {
            console.clear();
            const executionDeferred: IDeferred = this._createDeferred();

            for (let i = 0; i < this._processQueue.length; i++) {
                this._processIndex = i;
                let processQueueElement = this._processQueue[i];

                if (this._processQueue.length > i + 1) {
                    this._keyPromptMessage = `${chalk.bgGreen.black(`  Press ${chalk.bold.black("<ENTER>")} to start the next process `)}${chalk.bgWhite.black.bold(` ${this._projectList[this._processIndex]}  `)}`;
                } else {
                    this._keyPromptMessage = `${chalk.bgRed.white(`  Press ${chalk.bold.white("<ENTER>")} to exit running processes  `)}`
                }

                this._runningProcesses.push(processQueueElement());

                await KeyPromptUtil.setKeyPrompt(() => {
                    LoggerUtil.clearBottomLine()

                    if (this._processQueue.length === i + 1) {
                        this._quitRunningProcesses();
                        executionDeferred.resolve?.(undefined);
                    }
                    return;
                }, "return");
            }

            await Promise.all([executionDeferred.promise])
        }
    }

    private _executeTerminalCommand(commandType: ECommandType, command: string, cwd: string): Promise<void> {
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
                if (commandType === ECommandType.TERMINAL) {
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

    private _print(emitter: string, text: string) {
        if (!!this._keyPromptMessage) {
            LoggerUtil.clearBottomLine()
        }

        readline.cursorTo(process.stdout, 0, this._printedLines);

        if (this._lastEmitter !== emitter) {
            console.log(emitter)
            ++this._printedLines;
            this._lastEmitter = emitter;
        }
        console.log(text);
        this._printedLines += text.toString().split('\n').length;

        if (!!this._keyPromptMessage) {
            LoggerUtil.printDemandActionMessage(this._keyPromptMessage)
        }
    }

    private _quitRunningProcesses() {
        this._runningProcesses.forEach((runningProcess: ChildProcess) => {
            if (runningProcess.pid === undefined) {
                console.error("Child process PID is undefined. Process might not have started or already exited.");
            } else {
                runningProcess.kill();
            }
        })
    }

    private _cleanExecutionData() {
        this._keyPromptMessage = undefined;
        this._lastEmitter = undefined;
        this._projectList = [];
        this._processQueue = [];
        this._runningProcesses = [];
        this._processIndex = 0;
        this._printedLines = 0;
    }

    private _assembleTerminalScript(command: string): string {
        return command;
    }

    private _assembleNPMScript(npmClient: string, npmCommand: string, commandType: ECommandType): string {
        const commandChunks: string[] = [npmClient];
        if (commandType === ECommandType.NPM_SCRIPT) {
            commandChunks.push("run", npmCommand)
        }
        if (commandType === ECommandType.NPM) {
            commandChunks.push(npmCommand);
        }

        return commandChunks.join(" ");
    }

    private _createDeferred(): IDeferred {
        let resolve: ((value: void | PromiseLike<void>) => void) | undefined = undefined;
        let reject: ((reason?: any) => void) | undefined = undefined;

        const promise: Promise<void> = new Promise<void>((res: (value: void | PromiseLike<void>) => void, rej: (reason?: any) => void): void => {
            resolve = res;
            reject = rej;
        });

        return {
            promise, resolve, reject
        };
    }
}