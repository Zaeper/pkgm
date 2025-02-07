import {select} from "@inquirer/prompts";
import {ISection} from "./i-section";
import {ECommand} from "../definitions/e-command";
import {LoggerUtil} from "../utils/logger.util";
import {ECommandDescriptions} from "../definitions/e-command-descriptions";
import chalk from "chalk";

export class MainNavigationSection implements ISection<ECommand> {
    private _lastRunCommand: ECommand | undefined = undefined;

    async render(): Promise<ECommand> {
        console.clear();
        await LoggerUtil.printWelcome();
        this._captureExitInput();
        LoggerUtil.printSection("Main navigation")
        const selection: ECommand = await select({
            message: 'What do you want to do?',
            loop: false,
            default: this._lastRunCommand,
            pageSize: 50,
            choices: [
                {
                    name: this._assembleMenuItem("List", ECommand.LIST),
                    value: ECommand.LIST,
                    description: ECommandDescriptions.LIST,
                }, {
                    name: this._assembleMenuItem("List dependencies", ECommand.LIST_DEPENDENCIES),
                    value: ECommand.LIST_DEPENDENCIES,
                    description: ECommandDescriptions.LIST_DEPENDENCIES,
                }, {
                    name: this._assembleMenuItem("List scripts", ECommand.LIST_SCRIPTS),
                    value: ECommand.LIST_SCRIPTS,
                    description: ECommandDescriptions.LIST_SCRIPTS,
                }, {
                    name: this._assembleMenuItem("Link", ECommand.LINK),
                    value: ECommand.LINK,
                    description: ECommandDescriptions.LINK,
                }, {
                    name: this._assembleMenuItem("Unlink", ECommand.UNLINK),
                    value: ECommand.UNLINK,
                    description: ECommandDescriptions.UNLINK,
                }, {
                    name: this._assembleMenuItem("Run", ECommand.RUN),
                    value: ECommand.RUN,
                    description: ECommandDescriptions.RUN,
                }, {
                    name: this._assembleMenuItem("Run async", ECommand.RUN_ASYNC),
                    value: ECommand.RUN_ASYNC,
                    description: ECommandDescriptions.RUN_ASYNC,
                }, {
                    name: this._assembleMenuItem("Install", ECommand.INSTALL),
                    value: ECommand.INSTALL,
                    description: ECommandDescriptions.INSTALL,
                }, {
                    name: this._assembleMenuItem("Version Manager", ECommand.VERSION_MANAGER),
                    value: ECommand.VERSION_MANAGER,
                    description: ECommandDescriptions.VERSION_MANAGER
                }, {
                    name: this._assembleMenuItem("Build", ECommand.BUILD),
                    value: ECommand.BUILD,
                    description: ECommandDescriptions.BUILD,
                }, {
                    name: this._assembleMenuItem("Build watch", ECommand.BUILD_WATCH),
                    value: ECommand.BUILD_WATCH,
                    description: ECommandDescriptions.BUILD_WATCH,
                }, {
                    name: this._assembleMenuItem("Reinit", ECommand.REINIT),
                    value: ECommand.REINIT,
                    description: ECommandDescriptions.REINIT,
                }, {
                    name: this._assembleMenuItem("Help", ECommand.HELP),
                    value: ECommand.HELP,
                    description: ECommandDescriptions.HELP,
                }, {
                    name: chalk.yellow('Exit'),
                    value: ECommand.EXIT,
                    description: ECommandDescriptions.EXIT,
                },
            ],
        });

        this._discardExitInput();
        this._lastRunCommand = selection;

        return selection;
    }

    private _exitListener = (
        _: string,
        key: any
    ) => {
        if (key.sequence === '\u001b') {
            console.clear();
            LoggerUtil.printInfo('You pressed "esc".');
            process.exit(0); // Exit the process
        }
    }

    private _assembleMenuItem(
        name: string,
        command: ECommand
    ): string {
        return `${name} ${chalk.gray("-> pkgm " + command)}`
    }

    private _captureExitInput(): void {
        LoggerUtil.printInfo("Interactive mode. Press \"esc\" to exit")

        process.stdin.on('keypress', this._exitListener);
    }

    private _discardExitInput(): void {
        process.stdin.removeListener("keypress", this._exitListener);
    }
}