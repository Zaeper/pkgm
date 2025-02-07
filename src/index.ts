#!/usr/bin/env node

import * as process from "process";
import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import Logger from "@ptkdev/logger";
import arg from "arg";
import { ECommand } from "./definitions/e-command";
import { NpmProjectService } from "./services/npm/npm-project.service";
import { IFileService } from "./services/i-file.service";
import { FileService } from "./services/file.service";
import { IExecutionService } from "./services/i-execution.service";
import { ExecutionService } from "./services/execution.service";
import { ILinkerService } from "./services/i-linker.service";
import { LinkerService } from "./services/linker.service";
import { LoggerUtil } from "./utils/logger.util";
import { ISection } from "./sections/i-section";
import { MainNavigationSection } from "./sections/main-navigation.section";
import { InitSection } from "./sections/init.section";
import { IConfigFile } from "./definitions/i-config-file";
import { IRunner } from "./runners/i-runner";
import { CommandCallback, CommandRunner, ICommandRunnerOptions } from "./runners/command.runner";
import { EMode } from "./definitions/e-mode";
import { IBuildService } from "./services/i-build.service";
import { BuildService } from "./services/build.service";
import { ECommandType } from "./definitions/e-command-type";
import { PathUtil } from "./utils/path.util";
import { EVersionManagerTask } from "./definitions/e-version-manager-task";
import { IVersionManagerService } from "./services/i-version-manager.service";
import { VersionManagerService } from "./services/version-manager.service";
import { INpmProjectService } from "./services/npm/i-npm-project.service";
import { INpmWorkspaceService } from "./services/npm/i-npm-workspace.service";
import { NpmWorkspaceService } from "./services/npm/npm-workspace.service";
import { INpmDependencyService } from "./services/npm/i-npm-dependency.service";
import { INpmPackageScopes } from "./definitions/npm/i-npm-package-scopes";
import { NpmPackageCollection } from "./definitions/npm-package-collection";
import { HelpSection } from "./sections/help.section";
import { NpmDependencyService } from "./services/npm/npm-dependency.service";
import { INpmPackage } from "./definitions/npm/i-npm-package";
import { ENpmPackageType } from "./definitions/npm/e-npm-package-type";
import { INpmPackageService } from "./services/npm/i-npm-package.service";
import { NpmPackageService } from "./services/npm/npm-package.service";
import { EIncludeMode } from "./runners/e-include-mode";
import { IDependencyRecommendations } from "./definitions/npm/i-recommended-dependency";
import { INpmClientService } from "./services/npm/i-npm-client.service";
import { NpmClientService } from "./services/npm/npm-client.service";
import { INpmProject } from "./definitions/npm/i-npm-project";

const rootDir: string = PathUtil.normalize( process.cwd() );

const executionService: IExecutionService = new ExecutionService();
const npmDependencyService: INpmDependencyService = new NpmDependencyService();
const linkerService: ILinkerService = new LinkerService( npmDependencyService, executionService );

const fileService: IFileService = new FileService( rootDir, executionService );
const npmPackageService: INpmPackageService<INpmPackage> = new NpmPackageService( executionService );
const npmProjectService: INpmProjectService = new NpmProjectService( executionService );
const npmWorkspaceService: INpmWorkspaceService = new NpmWorkspaceService( executionService );
const versionManagerService: IVersionManagerService = new VersionManagerService(
    executionService, npmDependencyService, npmPackageService );
const npmClientService: INpmClientService = new NpmClientService();

const buildService: IBuildService = new BuildService(
    linkerService, executionService, npmDependencyService, fileService );

const logger: Logger = new Logger();

// Runners
const commandRunner: IRunner<CommandCallback, void, ICommandRunnerOptions> = new CommandRunner(
    npmProjectService, npmWorkspaceService );

// Sections
const mainNavigationSection: ISection<ECommand> = new MainNavigationSection();
const initSection: ISection<void> = new InitSection(
    fileService, commandRunner, buildService, npmClientService, rootDir );
const helpSection: ISection<void> = new HelpSection();

const DEFAULT_ARGS: Record<string, any> = {
    '--scope-package-name': [ String ],
    '--scope-path': [ String ],
    '--exclude-path': [ String ],
    '--package-path': [ String ]
}

function getPackageScopes( args: any ): INpmPackageScopes {
    return {
        pathScopes: args[ '--scope-path' ],
        packageNameScopes: args[ '--scope-package-name' ],
        excludedPackagePaths: args[ '--exclude-path' ],
        packagePaths: args[ '--package-path' ]
    }
}

let mode: EMode = EMode.COMMAND;

async function defineArgs( command: string | undefined ) {
    let args;
    if ( command === undefined ) {
        mode = EMode.INTERACTIVE;
        command = await mainNavigationSection.render();
    }

    switch ( command.toLowerCase() ) {
        case(ECommand.VERSION_MANAGER.toLowerCase()):
            if ( process.argv[ 3 ] === EVersionManagerTask.UPDATE_VERSIONS ) {
                args = arg( {
                    ...DEFAULT_ARGS,
                    "--dry-run": Boolean
                } )
            } else {
                args = arg( {
                    ...DEFAULT_ARGS
                } )
            }
            break;
        case(ECommand.EXIT.toLowerCase()):
        case(ECommand.HELP.toLowerCase()):
        case(ECommand.LIST.toLowerCase()):
        case(ECommand.LIST_DEPENDENCIES.toLowerCase()):
        case(ECommand.LIST_SCRIPTS.toLowerCase()):
        case(ECommand.LINK.toLowerCase()):
        case(ECommand.UNLINK.toLowerCase()):
        case(ECommand.RUN.toLowerCase()):
        case(ECommand.RUN_ASYNC.toLowerCase()):
        case(ECommand.BUILD.toLowerCase()):
        case(ECommand.BUILD_WATCH.toLowerCase()):
            args = arg( {
                ...DEFAULT_ARGS
            } )
            break;
        case(ECommand.INSTALL.toLowerCase()):
            args = arg( {
                ...DEFAULT_ARGS,
                '--package-name': String
            } )
            break;
        case(ECommand.REINIT.toLowerCase()):
            args = arg( {
                ...DEFAULT_ARGS,
                '--delete-package-lock': Boolean
            } )
            break;
    }

    await executeTask( command, args );

    if ( mode === EMode.INTERACTIVE ) {
        await defineArgs( undefined );
    }

    return args;
}

const listTargets = async ( npmPackageCollection: NpmPackageCollection ) => {
    if ( npmPackageCollection.workspaces.length > 0 ) {
        npmWorkspaceService.list( npmPackageCollection.workspaces, ENpmPackageType.WORKSPACE );
        LoggerUtil.printSpacing();
    }
    npmProjectService.list( npmPackageCollection.projects, ENpmPackageType.PROJECT );
}

const listTargetsWithDependencies = async (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection
) => {
    npmDependencyService.listInternalDependencies( npmPackageCollection, unscopedNpmPackageCollection );
}

const listTargetsWithScripts = async ( npmPackageCollection: NpmPackageCollection ) => {
    npmWorkspaceService.listScripts( npmPackageCollection.workspaces );
    npmProjectService.listScripts( npmPackageCollection.projects );
}

const linkTargets = async (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection,
    configFile: IConfigFile
): Promise<void> => {
    const npmPackageProcessingList: INpmPackage[] = npmDependencyService.getSortedNpmPackagesByInternalDependencies(
        npmPackageCollection, unscopedNpmPackageCollection );

    await fileService.createSymlinks( npmPackageProcessingList, configFile );
    await linkerService.link( npmPackageCollection, unscopedNpmPackageCollection, configFile );
}

const reinit = async (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection,
    includePackageLock: boolean,
    configFile: IConfigFile
) => {
    await buildService.clean( npmPackageCollection, unscopedNpmPackageCollection, includePackageLock );
    await buildService.build( npmPackageCollection, unscopedNpmPackageCollection, configFile );
}

const unlinkTargets = async (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection
): Promise<void> => {
    const npmPackageProcessingList: INpmPackage[] = npmDependencyService.getSortedNpmPackagesByInternalDependencies(
        npmPackageCollection, unscopedNpmPackageCollection );

    await linkerService.unlink( npmPackageCollection, unscopedNpmPackageCollection );
    await fileService.removeSymlinks( npmPackageProcessingList );
}

const installTargets = async (
    npmPackageCollection: NpmPackageCollection,
    configFile: IConfigFile,
    packageName?: string
) => {
    await npmWorkspaceService.install( npmPackageCollection.workspaces, configFile, packageName );
    await npmProjectService.install( npmPackageCollection.projects, configFile, packageName );
}

const build = async (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection,
    configFile: IConfigFile
) => {
    const npmPackageProcessingList: INpmPackage[] = npmDependencyService.getSortedNpmPackagesByInternalDependencies(
        npmPackageCollection, unscopedNpmPackageCollection );

    await npmProjectService.build( <INpmProject[]>npmPackageProcessingList, configFile );
}

const buildWatch = async (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection,
    configFile: IConfigFile
) => {
    const npmPackageProcessingList: INpmPackage[] = npmDependencyService.getSortedNpmPackagesByInternalDependencies(
        npmPackageCollection, unscopedNpmPackageCollection );

    await npmProjectService.buildWatch( <INpmProject[]>npmPackageProcessingList, configFile )
}

const checkPackageVersions = async (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection,
    configFile: IConfigFile,
    mode: EMode,
    dryRun: boolean
) => {
    const recommendedPackages: Record<string, IDependencyRecommendations> = await versionManagerService.getPackageVersionRecommendations(
        npmPackageCollection, unscopedNpmPackageCollection );

    let runNpmInstall: boolean = !dryRun;
    let cleanProjects: boolean = !dryRun;

    if ( mode === EMode.INTERACTIVE ) {
        LoggerUtil.printWarning(
            "Pkgm recommends package versions based solely on their dependencies and does not account for potential breaking changes. Updating to the recommended version could break your existing code. Ensure all your changes are committed before proceeding." );

        const shouldContinue: boolean = await select( {
            message: 'Do you want to update all packages to the recommended versions?',
            choices: [
                {
                    name: "Yes",
                    value: true
                }, {
                    name: "No",
                    value: false
                }
            ],
            loop: false
        } );

        if ( !shouldContinue ) return;

        runNpmInstall = await select( {
            message: 'Do you want to run npm install after the package.json files are updated?',
            choices: [
                {
                    name: "Yes",
                    value: true
                }, {
                    name: "No",
                    value: false
                }
            ],
            loop: false
        } );
        cleanProjects = runNpmInstall;
    }

    if ( !dryRun ) {
        await versionManagerService.installRecommendedDependencies(
            npmPackageCollection, unscopedNpmPackageCollection, configFile, recommendedPackages, cleanProjects,
            runNpmInstall
        );
    }
}

async function executeTask( command: string, args: any ) {
    const npmPackageScopes: INpmPackageScopes = getPackageScopes( args );
    const configFile: IConfigFile = fileService.readConfigFile();

    let commandRunnerOptions: ICommandRunnerOptions;

    if ( command.toLowerCase() === ECommand.EXIT.toLowerCase() ) {
        console.clear();
        LoggerUtil.printInfo( 'Goodbye!' );
        process.exit( 0 ); // Exit the process
    }

    switch ( command.toLowerCase() ) {
        case(ECommand.HELP.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.HELP
            }

            await commandRunner.run(
                configFile, async ( _ ) => showHelp(), mode, EIncludeMode.NONE, true, false, commandRunnerOptions,
                npmPackageScopes
            )
            break;
        case(ECommand.LIST.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.LIST
            }
            await commandRunner.run(
                configFile,
                async ( npmPackageCollection: NpmPackageCollection ) => await listTargets( npmPackageCollection ), mode,
                EIncludeMode.ALL, true, false, commandRunnerOptions, npmPackageScopes
            )
            break;
        case(ECommand.LIST_DEPENDENCIES.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.LIST_DEPENDENCIES
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    unscopedNpmPackageCollection: NpmPackageCollection
                ) => await listTargetsWithDependencies( npmPackageCollection, unscopedNpmPackageCollection ), mode,
                EIncludeMode.ALL, true, false, commandRunnerOptions, npmPackageScopes
            )
            break;
        case(ECommand.LIST_SCRIPTS.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.LIST_SCRIPTS
            }

            await commandRunner.run(
                configFile, async ( npmPackageCollection: NpmPackageCollection ) => await listTargetsWithScripts(
                    npmPackageCollection ), mode, EIncludeMode.ALL, false, false, commandRunnerOptions,
                npmPackageScopes
            )
            break;
        case(ECommand.LINK.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.LINK
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    unscopedNpmPackageCollection: NpmPackageCollection,
                    configFile: IConfigFile
                ) => await linkTargets( npmPackageCollection, unscopedNpmPackageCollection, configFile ), mode,
                EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes
            )

            break;
        case(ECommand.UNLINK.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.UNLINK
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    unscopedNpmPackageCollection: NpmPackageCollection
                ) => await unlinkTargets( npmPackageCollection, unscopedNpmPackageCollection ), mode, EIncludeMode.ALL,
                false, true, commandRunnerOptions, npmPackageScopes
            );

            break;
        case(ECommand.VERSION_MANAGER.toLowerCase()):
            let task: EVersionManagerTask;

            if ( mode === EMode.INTERACTIVE ) {
                console.clear();
                await LoggerUtil.printWelcome();

                task = await select( {
                    message: 'Choose a strategy to continue with',
                    choices: [
                        {
                            name: "Sync versions",
                            value: EVersionManagerTask.SYNC_VERSIONS
                        }, {
                            name: "Check packages",
                            value: EVersionManagerTask.UPDATE_VERSIONS
                        }
                    ],
                    loop: false
                } );
            } else {
                const input = process.argv[ 3 ];
                if ( input !== EVersionManagerTask.UPDATE_VERSIONS && input !== EVersionManagerTask.SYNC_VERSIONS ) {
                    logger.error( "Unrecognized version manager task" );
                    process.exit( 0 );
                }
                task = input;

            }

            if ( task === EVersionManagerTask.SYNC_VERSIONS ) {
                commandRunnerOptions = {
                    command: `${ ECommand.VERSION_MANAGER } ${ task }`
                }


                await commandRunner.run(
                    configFile, async (
                        npmPackageCollection: NpmPackageCollection,
                        unscopedNpmPackageCollection: NpmPackageCollection,
                        configFile: IConfigFile
                    ): Promise<void> => await versionManagerService.syncVersions(
                        npmPackageCollection, unscopedNpmPackageCollection, configFile ), mode, EIncludeMode.ALL, false,
                    true, commandRunnerOptions, npmPackageScopes
                )
            }
            if ( task === EVersionManagerTask.UPDATE_VERSIONS ) {
                const dryRunArg: string = "--dry-run"

                let dryRun: boolean = args[ dryRunArg ] !== undefined ? args[ dryRunArg ] : false;
                const runCommand: string[] = [];
                runCommand.push( task );

                if ( dryRun ) {
                    runCommand.push( dryRunArg );
                }

                commandRunnerOptions = {
                    command: `${ command } ${ runCommand.join( " " ) }`
                }


                await commandRunner.run(
                    configFile, async (
                        npmPackageCollection: NpmPackageCollection,
                        unscopedNpmPackageCollection: NpmPackageCollection,
                        configFile: IConfigFile
                    ): Promise<void> => await checkPackageVersions(
                        npmPackageCollection, unscopedNpmPackageCollection, configFile, mode, dryRun ), mode,
                    EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes
                )
            }
            break;
        case(ECommand.RUN.toLowerCase()):
        case(ECommand.RUN_ASYNC.toLowerCase()):
            const runAsync: boolean = command.toLowerCase() === ECommand.RUN_ASYNC.toLowerCase();

            let runCommand: string | undefined;
            let commandType: ECommandType;

            if ( mode === EMode.INTERACTIVE ) {
                console.clear();
                await LoggerUtil.printWelcome();

                commandType = await select( {
                    message: 'Do you want to rerun the discovery process with a scope?',
                    choices: [
                        {
                            name: "npm command",
                            value: ECommandType.NPM
                        }, {
                            name: "npm script command",
                            value: ECommandType.NPM_SCRIPT
                        }, {
                            name: "terminal command",
                            value: ECommandType.TERMINAL
                        }
                    ],
                    loop: false
                } );

                let promptMessage: string;
                if ( commandType === ECommandType.NPM ) {
                    promptMessage = 'Enter a npm command';
                } else if ( commandType === ECommandType.NPM_SCRIPT ) {
                    promptMessage = 'Enter a npm run command';
                } else if ( commandType === ECommandType.TERMINAL ) {
                    promptMessage = 'Enter a terminal command'
                }

                runCommand = await input( {
                    message: promptMessage!
                } );
            } else {
                commandType = ECommandType.NPM_SCRIPT;
                runCommand = process.argv[ 3 ];

                if ( runCommand === undefined ) {
                    logger.error( "Please provide a command" );
                    process.exit( 0 );
                }
            }

            commandRunnerOptions = {
                command: `${ ECommand.RUN } ${ runCommand }`
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    _: NpmPackageCollection,
                    configFile: IConfigFile
                ) => await npmPackageService.run(
                    npmPackageCollection.packages, runCommand!, commandType, runAsync, configFile ), mode,
                EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes
            );
            break;
        case(ECommand.INSTALL.toLowerCase()):
            const packageNameParameterName: string = "--package-name";
            let packageName: string | undefined;
            if ( mode === EMode.INTERACTIVE ) {
                console.clear();
                await LoggerUtil.printWelcome();
                const runType: "install" | "package" = await select( {
                    message: 'Do you want to install a specific package?',
                    choices: [
                        {
                            name: `Yes ${ chalk.gray( "npm install [package name]" ) }`,
                            value: "package"
                        }, {
                            name: `No ${ chalk.gray( "npm install" ) }`,
                            value: "install",
                        },
                    ],
                    loop: false,
                    default: "package"
                } );

                if ( runType === "package" ) {
                    console.clear();
                    await LoggerUtil.printWelcome();
                    packageName = await input( {
                        message: 'Enter a package name'
                    } );
                }
            } else {
                packageName = args[ packageNameParameterName ];
            }

            commandRunnerOptions = {
                command: ECommand.INSTALL,
                parameters: {
                    [ packageNameParameterName ]: packageName
                }
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    _: NpmPackageCollection,
                    configFile: IConfigFile
                ) => await installTargets( npmPackageCollection, configFile, packageName ), mode, EIncludeMode.ALL,
                false, true, commandRunnerOptions, npmPackageScopes
            );

            break;
        case(ECommand.BUILD.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.BUILD
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    unscopedNpmPackageCollection: NpmPackageCollection,
                    configFile: IConfigFile
                ) => await build( npmPackageCollection, unscopedNpmPackageCollection, configFile ), mode,
                EIncludeMode.NONE, false, true, commandRunnerOptions, npmPackageScopes
            );
            break;
        case(ECommand.BUILD_WATCH.toLowerCase()):
            commandRunnerOptions = {
                command: ECommand.BUILD_WATCH
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    unscopedNpmPackageCollection: NpmPackageCollection,
                    configFile: IConfigFile
                ) => await buildWatch( npmPackageCollection, unscopedNpmPackageCollection, configFile ), mode,
                EIncludeMode.NONE, false, true, commandRunnerOptions, npmPackageScopes
            );
            break;
        case(ECommand.REINIT.toLowerCase()):
            const includePackageLockParameterName: string = "--delete-package-lock";
            let includePackageLock: boolean;
            if ( mode === EMode.INTERACTIVE ) {
                console.clear();
                await LoggerUtil.printWelcome();
                includePackageLock = await select( {
                    message: 'Include deleting package-lock.json files?',
                    choices: [
                        {
                            name: 'Yes',
                            value: true
                        }, {
                            name: 'No',
                            value: false
                        },
                    ],
                    loop: false,
                    default: false
                } );
            } else {
                includePackageLock = args[ includePackageLockParameterName ];
            }

            commandRunnerOptions = {
                command: ECommand.REINIT,
                symlinkedProjectsOnly: true,
                parameters: {
                    [ includePackageLockParameterName ]: undefined
                }
            }

            await commandRunner.run(
                configFile, async (
                    npmPackageCollection: NpmPackageCollection,
                    unscopedNpmPackageCollection: NpmPackageCollection,
                    configFile: IConfigFile
                ) => await reinit( npmPackageCollection, unscopedNpmPackageCollection, includePackageLock, configFile ),
                mode, EIncludeMode.ALL, false, true, commandRunnerOptions, npmPackageScopes
            );
            break;
    }
}

function showHelp(): void {
    helpSection.render();
}

async function main(): Promise<void> {
    console.clear();
    await LoggerUtil.printWelcome();

    const command: string = process.argv[ 2 ];

    if ( command === undefined ) {
        await initSection.render();
    }

    const args = await defineArgs( command );

    return;
}

main().then( () => {
    LoggerUtil.printInfo( "Exiting..." );
} );