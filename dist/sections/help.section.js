"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpSection = void 0;
const logger_util_1 = require("../utils/logger.util");
const chalk_1 = __importDefault(require("chalk"));
const e_command_1 = require("../definitions/e-command");
const e_command_descriptions_1 = require("../definitions/e-command-descriptions");
class HelpSection {
    render() {
        const printParam = (name, description) => {
            logger_util_1.LoggerUtil.printIndented(chalk_1.default.magenta(name) + " " + chalk_1.default.gray.italic("-> " + description), 3);
        };
        const printCommand = (commandName, commandDescription, args, examples, params) => {
            logger_util_1.LoggerUtil.printIndented(chalk_1.default.yellow(commandName), 1);
            logger_util_1.LoggerUtil.printIndented("Description:", 2);
            logger_util_1.LoggerUtil.printIndented(chalk_1.default.gray.italic(commandDescription), 3);
            const argEntries = Object.entries(args ?? {});
            if (argEntries.length > 0) {
                logger_util_1.LoggerUtil.printIndented("Arguments:", 2);
                argEntries.forEach(([name, description], index) => {
                    logger_util_1.LoggerUtil.printIndented(chalk_1.default.white(`${index + 1}.`) + " " + chalk_1.default.cyan(`[ ${name} ]`) + " " + chalk_1.default.gray.italic("-> " + description), 3);
                });
            }
            const exampleEntries = Object.entries(examples ?? {});
            if (exampleEntries.length > 0) {
                logger_util_1.LoggerUtil.printIndented("Examples:", 2);
                exampleEntries.forEach(([name, description]) => {
                    logger_util_1.LoggerUtil.printIndented(chalk_1.default.bgCyan.bold.black(` ${name} `) + " " + chalk_1.default.gray.italic("-> " + description), 3);
                });
            }
            const paramEntries = Object.entries(params ?? {});
            if (paramEntries.length > 0) {
                logger_util_1.LoggerUtil.printIndented("Parameters:", 2);
                paramEntries.forEach(([name, description]) => {
                    printParam(name, description);
                });
            }
        };
        logger_util_1.LoggerUtil.printSpacing();
        logger_util_1.LoggerUtil.printIndented("Command:", 0);
        printCommand(e_command_1.ECommand.LIST, e_command_descriptions_1.ECommandDescriptions.LIST);
        printCommand(e_command_1.ECommand.LIST_DEPENDENCIES, e_command_descriptions_1.ECommandDescriptions.LIST_DEPENDENCIES);
        printCommand(e_command_1.ECommand.LIST_SCRIPTS, e_command_descriptions_1.ECommandDescriptions.LIST_SCRIPTS);
        printCommand(e_command_1.ECommand.LINK, e_command_descriptions_1.ECommandDescriptions.LINK);
        printCommand(e_command_1.ECommand.UNLINK, e_command_descriptions_1.ECommandDescriptions.UNLINK);
        printCommand(e_command_1.ECommand.RUN, e_command_descriptions_1.ECommandDescriptions.RUN, {
            "NPM Script": "Name of the npm script, which should be executed."
        }, {
            "pkgm run test": "This example runs the <npm run test> script."
        });
        printCommand(e_command_1.ECommand.RUN_ASYNC, e_command_descriptions_1.ECommandDescriptions.RUN_ASYNC, {
            "NPM Script": "Name of the npm script, which should be executed."
        }, {
            "pkgm run dev": "This example runs the <npm run dev> script asynchronously."
        });
        printCommand(e_command_1.ECommand.INSTALL, e_command_descriptions_1.ECommandDescriptions.INSTALL, undefined, undefined, {
            '--package-name': "Installs a specific package. Recommended to use scopes together with this parameter."
        });
        printCommand(e_command_1.ECommand.VERSION_MANAGER, e_command_descriptions_1.ECommandDescriptions.VERSION_MANAGER, {
            "sync-versions": "Update all matching dependencies to the defined versions specified in your pkgm.json file.",
            "update-versions": "Install the highest available version of your project dependencies based on their peerDependency."
        });
        printCommand(e_command_1.ECommand.BUILD, e_command_descriptions_1.ECommandDescriptions.BUILD);
        printCommand(e_command_1.ECommand.BUILD_WATCH, e_command_descriptions_1.ECommandDescriptions.BUILD_WATCH);
        printCommand(e_command_1.ECommand.REINIT, e_command_descriptions_1.ECommandDescriptions.REINIT, undefined, undefined, {
            '--delete-package-lock': "Includes deleting the package-lock.json file during the reinit."
        });
        logger_util_1.LoggerUtil.printSpacing();
        logger_util_1.LoggerUtil.printIndented("Global parameters:", 0);
        printParam("--scope-path", "Scope the project list by path. The scope should start the same as the path entered in the package.json file.");
        printParam("--scope-package-name", "Scope the project list by package name. The scope should start the same as the package name entries in the package.json files.");
        printParam("--exclude-path", "Exclude a path from the projects list. This path should be exactly matching with the path entry in the pkgm.json file. This parameter can be used multiple times.");
        printParam("--package-path", "Define which projects should be processed. As soon as this parameter is set, the defined projects list in the pkgm.json will be ignored. This parameter can be used multiple times.");
    }
}
exports.HelpSection = HelpSection;
