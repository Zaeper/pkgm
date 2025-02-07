"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainNavigationSection = void 0;
const prompts_1 = require("@inquirer/prompts");
const e_command_1 = require("../definitions/e-command");
const logger_util_1 = require("../utils/logger.util");
const e_command_descriptions_1 = require("../definitions/e-command-descriptions");
const chalk_1 = __importDefault(require("chalk"));
class MainNavigationSection {
    _lastRunCommand = undefined;
    async render() {
        console.clear();
        await logger_util_1.LoggerUtil.printWelcome();
        this._captureExitInput();
        logger_util_1.LoggerUtil.printSection("Main navigation");
        const selection = await (0, prompts_1.select)({
            message: 'What do you want to do?',
            loop: false,
            default: this._lastRunCommand,
            pageSize: 50,
            choices: [
                {
                    name: this._assembleMenuItem("List", e_command_1.ECommand.LIST),
                    value: e_command_1.ECommand.LIST,
                    description: e_command_descriptions_1.ECommandDescriptions.LIST,
                }, {
                    name: this._assembleMenuItem("List dependencies", e_command_1.ECommand.LIST_DEPENDENCIES),
                    value: e_command_1.ECommand.LIST_DEPENDENCIES,
                    description: e_command_descriptions_1.ECommandDescriptions.LIST_DEPENDENCIES,
                }, {
                    name: this._assembleMenuItem("List scripts", e_command_1.ECommand.LIST_SCRIPTS),
                    value: e_command_1.ECommand.LIST_SCRIPTS,
                    description: e_command_descriptions_1.ECommandDescriptions.LIST_SCRIPTS,
                }, {
                    name: this._assembleMenuItem("Link", e_command_1.ECommand.LINK),
                    value: e_command_1.ECommand.LINK,
                    description: e_command_descriptions_1.ECommandDescriptions.LINK,
                }, {
                    name: this._assembleMenuItem("Unlink", e_command_1.ECommand.UNLINK),
                    value: e_command_1.ECommand.UNLINK,
                    description: e_command_descriptions_1.ECommandDescriptions.UNLINK,
                }, {
                    name: this._assembleMenuItem("Run", e_command_1.ECommand.RUN),
                    value: e_command_1.ECommand.RUN,
                    description: e_command_descriptions_1.ECommandDescriptions.RUN,
                }, {
                    name: this._assembleMenuItem("Run async", e_command_1.ECommand.RUN_ASYNC),
                    value: e_command_1.ECommand.RUN_ASYNC,
                    description: e_command_descriptions_1.ECommandDescriptions.RUN_ASYNC,
                }, {
                    name: this._assembleMenuItem("Install", e_command_1.ECommand.INSTALL),
                    value: e_command_1.ECommand.INSTALL,
                    description: e_command_descriptions_1.ECommandDescriptions.INSTALL,
                }, {
                    name: this._assembleMenuItem("Version Manager", e_command_1.ECommand.VERSION_MANAGER),
                    value: e_command_1.ECommand.VERSION_MANAGER,
                    description: e_command_descriptions_1.ECommandDescriptions.VERSION_MANAGER
                }, {
                    name: this._assembleMenuItem("Build", e_command_1.ECommand.BUILD),
                    value: e_command_1.ECommand.BUILD,
                    description: e_command_descriptions_1.ECommandDescriptions.BUILD,
                }, {
                    name: this._assembleMenuItem("Build watch", e_command_1.ECommand.BUILD_WATCH),
                    value: e_command_1.ECommand.BUILD_WATCH,
                    description: e_command_descriptions_1.ECommandDescriptions.BUILD_WATCH,
                }, {
                    name: this._assembleMenuItem("Reinit", e_command_1.ECommand.REINIT),
                    value: e_command_1.ECommand.REINIT,
                    description: e_command_descriptions_1.ECommandDescriptions.REINIT,
                }, {
                    name: this._assembleMenuItem("Help", e_command_1.ECommand.HELP),
                    value: e_command_1.ECommand.HELP,
                    description: e_command_descriptions_1.ECommandDescriptions.HELP,
                }, {
                    name: chalk_1.default.yellow('Exit'),
                    value: e_command_1.ECommand.EXIT,
                    description: e_command_descriptions_1.ECommandDescriptions.EXIT,
                },
            ],
        });
        this._discardExitInput();
        this._lastRunCommand = selection;
        return selection;
    }
    _exitListener = (_, key) => {
        if (key.sequence === '\u001b') {
            console.clear();
            logger_util_1.LoggerUtil.printInfo('You pressed "esc".');
            process.exit(0);
        }
    };
    _assembleMenuItem(name, command) {
        return `${name} ${chalk_1.default.gray("-> pkgm " + command)}`;
    }
    _captureExitInput() {
        logger_util_1.LoggerUtil.printInfo("Interactive mode. Press \"esc\" to exit");
        process.stdin.on('keypress', this._exitListener);
    }
    _discardExitInput() {
        process.stdin.removeListener("keypress", this._exitListener);
    }
}
exports.MainNavigationSection = MainNavigationSection;
