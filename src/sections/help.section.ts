import {ISection} from "./i-section";
import {LoggerUtil} from "../utils/logger.util";
import chalk from "chalk";
import {ECommand} from "../definitions/e-command";
import {ECommandDescriptions} from "../definitions/e-command-descriptions";

export class HelpSection implements ISection<void> {
    render(): void {
        const printParam = (
            name: string,
            description: string
        ) => {
            LoggerUtil.printIndented(chalk.magenta(name) + " " + chalk.gray.italic("-> " + description), 3)
        }

        const printCommand = (
            commandName: ECommand,
            commandDescription: ECommandDescriptions,
            args?: Record<string, string>,
            examples?: Record<string, string>,
            params?: Record<string, string>
        ) => {
            LoggerUtil.printIndented(chalk.yellow(commandName), 1)
            LoggerUtil.printIndented("Description:", 2)
            LoggerUtil.printIndented(chalk.gray.italic(commandDescription), 3)

            const argEntries: [string, string][] = Object.entries(args ?? {});
            if (argEntries.length > 0) {
                LoggerUtil.printIndented("Arguments:", 2);

                argEntries.forEach((
                    [name, description],
                    index
                ) => {
                    LoggerUtil.printIndented(chalk.white(`${index + 1}.`) + " " + chalk.cyan(`[ ${name} ]`) + " " + chalk.gray.italic("-> " + description), 3)
                })
            }

            const exampleEntries: [string, string][] = Object.entries(examples ?? {});
            if (exampleEntries.length > 0) {
                LoggerUtil.printIndented("Examples:", 2);

                exampleEntries.forEach(([name, description]) => {
                    LoggerUtil.printIndented(chalk.bgCyan.bold.black(` ${name} `) + " " + chalk.gray.italic("-> " + description), 3)
                })
            }

            const paramEntries: [string, string][] = Object.entries(params ?? {});
            if (paramEntries.length > 0) {
                LoggerUtil.printIndented("Parameters:", 2);

                paramEntries.forEach(([name, description]) => {
                    printParam(name, description);
                })
            }
        }

        LoggerUtil.printSpacing()
        LoggerUtil.printIndented("Command:", 0)
        printCommand(ECommand.LIST, ECommandDescriptions.LIST);
        printCommand(ECommand.LIST_DEPENDENCIES, ECommandDescriptions.LIST_DEPENDENCIES);
        printCommand(ECommand.LIST_SCRIPTS, ECommandDescriptions.LIST_SCRIPTS);
        printCommand(ECommand.LINK, ECommandDescriptions.LINK);
        printCommand(ECommand.UNLINK, ECommandDescriptions.UNLINK);
        printCommand(ECommand.RUN, ECommandDescriptions.RUN, {
            "NPM Script": "Name of the npm script, which should be executed."
        }, {
            "pkgm run test": "This example runs the <npm run test> script."
        });
        printCommand(ECommand.RUN_ASYNC, ECommandDescriptions.RUN_ASYNC, {
            "NPM Script": "Name of the npm script, which should be executed."
        }, {
            "pkgm run dev": "This example runs the <npm run dev> script asynchronously."
        });
        printCommand(ECommand.INSTALL, ECommandDescriptions.INSTALL, undefined, undefined, {
            '--package-name': "Installs a specific package. Recommended to use scopes together with this parameter."
        });
        printCommand(ECommand.VERSION_MANAGER, ECommandDescriptions.VERSION_MANAGER, {
            "sync-versions": "Update all matching dependencies to the defined versions specified in your pkgm.json file.",
            "update-versions": "Install the highest available version of your project dependencies based on their peerDependency."
        });
        printCommand(ECommand.BUILD, ECommandDescriptions.BUILD);
        printCommand(ECommand.BUILD_WATCH, ECommandDescriptions.BUILD_WATCH);
        printCommand(ECommand.REINIT, ECommandDescriptions.REINIT, undefined, undefined, {
            '--delete-package-lock': "Includes deleting the package-lock.json file during the reinit."
        });


        LoggerUtil.printSpacing()
        LoggerUtil.printIndented("Global parameters:", 0);
        printParam("--scope-path", "Scope the project list by path. The scope should start the same as the path entered in the package.json file.")
        printParam("--scope-package-name", "Scope the project list by package name. The scope should start the same as the package name entries in the package.json files.")
        printParam("--exclude-path", "Exclude a path from the projects list. This path should be exactly matching with the path entry in the pkgm.json file. This parameter can be used multiple times.")
        printParam("--package-path", "Define which projects should be processed. As soon as this parameter is set, the defined projects list in the pkgm.json will be ignored. This parameter can be used multiple times.")
    }
}