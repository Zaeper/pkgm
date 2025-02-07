import { IRunner } from "./i-runner";
import { INpmProject } from "../definitions/npm/i-npm-project";
import { LoggerUtil } from "../utils/logger.util";
import { checkbox, input, select } from "@inquirer/prompts";
import { EMode } from "../definitions/e-mode";
import { IConfigFile } from "../definitions/i-config-file";
import chalk from "chalk";
import { KeyPromptUtil } from "../utils/key-prompt.util";
import { INpmWorkspace } from "../definitions/npm/i-npm-workspace";
import { NpmPackageCollection } from "../definitions/npm-package-collection";
import { INpmPackageScopes } from "../definitions/npm/i-npm-package-scopes";
import { INpmProjectService } from "../services/npm/i-npm-project.service";
import { INpmWorkspaceService } from "../services/npm/i-npm-workspace.service";
import { INpmPackage } from "../definitions/npm/i-npm-package";
import { ENpmPackageType } from "../definitions/npm/e-npm-package-type";
import { PackageUtil } from "../utils/packageUtil";
import { EIncludeMode } from "./e-include-mode";

export type CommandCallback = (
    npmPackageCollection: NpmPackageCollection,
    unscopedNpmPackageCollection: NpmPackageCollection,
    configFile: IConfigFile
) => void | Promise<void>;

export interface ICommandRunnerOptions {
    command?: string,
    symlinkedProjectsOnly?: boolean,
    parameters?: Record<string, string | undefined>
}

export class CommandRunner implements IRunner<CommandCallback, void, ICommandRunnerOptions> {
    constructor( private _npmProjectService: INpmProjectService, private _npmWorkspaceService: INpmWorkspaceService ) {
    }

    public async run(
        configFile: IConfigFile,
        fn: CommandCallback,
        mode: EMode,
        workspacesIncludeMode: EIncludeMode,
        silent: boolean,
        printTargetPackages: boolean,
        runnerOptions: ICommandRunnerOptions,
        npmPackageScopes?: INpmPackageScopes,
        isInitializing?: boolean
    ): Promise<void> {
        await this._prepareExecution(
            configFile, fn, mode, workspacesIncludeMode, silent, printTargetPackages,
            runnerOptions, npmPackageScopes, isInitializing
        )
    }

    private async _prepareExecution(
        configFile: IConfigFile,
        fn: CommandCallback,
        mode: EMode,
        workspacesIncludeMode: EIncludeMode,
        silent: boolean,
        printTargetPackages: boolean,
        runnerOptions: ICommandRunnerOptions,
        npmPackageScopes?: INpmPackageScopes,
        isInitializing?: boolean
    ): Promise<void> {
        const unscopedNpmPackageCollection: NpmPackageCollection = await this._getNpmPackageCollection(
            configFile, workspacesIncludeMode );

        const npmPackageCollection: NpmPackageCollection = await this._getNpmPackageCollection(
            configFile, workspacesIncludeMode, npmPackageScopes );
        const prunedNpmPackageScopes: INpmPackageScopes | undefined = await this._getPrunedNpmPackageScopes(
            npmPackageCollection, npmPackageScopes );

        await this._printCommandInfo(
            runnerOptions, prunedNpmPackageScopes, npmPackageCollection,
            workspacesIncludeMode, silent, printTargetPackages
        );

        if ( npmPackageCollection.packages.length === 0 ) {
            LoggerUtil.printNote( "No packages affected" );
            return await this._exitPrompt(
                runnerOptions, prunedNpmPackageScopes, fn, npmPackageCollection,
                unscopedNpmPackageCollection, configFile, mode, isInitializing, workspacesIncludeMode, silent,
                printTargetPackages
            );
        }

        if ( mode === EMode.COMMAND || silent ) {
            await this._printCommandInfo(
                runnerOptions, prunedNpmPackageScopes, npmPackageCollection,
                workspacesIncludeMode, silent, printTargetPackages
            );
            return this._execute(
                runnerOptions, prunedNpmPackageScopes, fn, npmPackageCollection,
                unscopedNpmPackageCollection, configFile, mode, isInitializing, workspacesIncludeMode, silent,
                printTargetPackages
            );
        } else {
            const promptScopesResult: INpmPackageScopes | "abort" | "continue" = await this._promptManageScopes(
                npmPackageCollection, prunedNpmPackageScopes, isInitializing );
            switch ( promptScopesResult ) {
                case "continue":
                    await this._printCommandInfo(
                        runnerOptions, prunedNpmPackageScopes, npmPackageCollection,
                        workspacesIncludeMode, silent, printTargetPackages
                    );
                    return this._execute(
                        runnerOptions, prunedNpmPackageScopes, fn, npmPackageCollection,
                        unscopedNpmPackageCollection, configFile, mode, isInitializing, workspacesIncludeMode, silent,
                        printTargetPackages
                    );
                case "abort":
                    return;
                default:
                    return this._prepareExecution(
                        configFile, fn, mode, workspacesIncludeMode, silent,
                        printTargetPackages, runnerOptions, promptScopesResult, isInitializing
                    );
            }
        }
    }

    private async _printCommandInfo(
        runnerOptions: ICommandRunnerOptions,
        prunedNpmPackageScopes: INpmPackageScopes | undefined,
        npmPackageCollection: NpmPackageCollection,
        workspacesIncludeMode: EIncludeMode,
        silent: boolean,
        printTargetPackages: boolean
    ): Promise<void> {
        console.clear();
        await LoggerUtil.printWelcome();

        const command: string | undefined = this._assembleCommand( runnerOptions, prunedNpmPackageScopes );

        if ( !!command ) {
            LoggerUtil.printCommand( command );
            LoggerUtil.printSpacing();
        }

        if ( !silent || printTargetPackages ) {
            this._listAffectedPackages( npmPackageCollection, workspacesIncludeMode );
        }
    }

    private async _execute(
        runnerOptions: ICommandRunnerOptions,
        prunedNpmPackageScopes: INpmPackageScopes | undefined,
        commandCallback: CommandCallback,
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile,
        mode: EMode,
        isInitializing: boolean | undefined,
        workspacesIncludeMode: EIncludeMode,
        silent: boolean,
        printTargetPackages: boolean
    ) {
        await this._printCommandInfo(
            runnerOptions, prunedNpmPackageScopes, npmPackageCollection,
            workspacesIncludeMode, silent, printTargetPackages
        );

        await commandCallback( npmPackageCollection, unscopedNpmPackageCollection, configFile );

        if ( (mode === EMode.INTERACTIVE) && !isInitializing ) {
            await this._exitPrompt(
                runnerOptions, prunedNpmPackageScopes, commandCallback, npmPackageCollection,
                unscopedNpmPackageCollection, configFile, mode, isInitializing, workspacesIncludeMode, silent,
                printTargetPackages
            );
        }
        return;
    }

    private async _getPrunedNpmPackageScopes(
        npmPackageCollection: NpmPackageCollection,
        npmPackageScopes?: INpmPackageScopes
    ) {
        let prunedNpmPackageScopes: INpmPackageScopes | undefined;
        if ( !!npmPackageScopes ) {
            prunedNpmPackageScopes = PackageUtil.pruneUnusedNpmPackageScopes(
                npmPackageCollection.packages, npmPackageScopes );
        }

        return prunedNpmPackageScopes;
    }


    private _listAffectedPackages( npmPackageCollection: NpmPackageCollection, workspacesIncludeMode: EIncludeMode ) {
        LoggerUtil.printNote( "Affected packages" )

        if ( workspacesIncludeMode !== EIncludeMode.NONE ) {
            this._npmWorkspaceService.list( npmPackageCollection.workspaces, ENpmPackageType.WORKSPACE );
            LoggerUtil.printSpacing();
        }

        this._npmProjectService.list( npmPackageCollection.projects, ENpmPackageType.PROJECT );
    }

    private _sortPackagesInAlphabeticalOrder( packages: INpmPackage[] ) {
        return packages.sort( ( a, b ) => {
            if ( a.packageJson.name > b.packageJson.name ) {
                return 1;
            }
            if ( a.packageJson.name < b.packageJson.name ) {
                return -1;
            }
            return 0;
        } )

    }

    private async _exitPrompt(
        runnerOptions: ICommandRunnerOptions,
        prunedNpmPackageScopes: INpmPackageScopes | undefined,
        commandCallback: CommandCallback,
        npmPackageCollection: NpmPackageCollection,
        unscopedNpmPackageCollection: NpmPackageCollection,
        configFile: IConfigFile,
        mode: EMode,
        isInitializing: boolean | undefined,
        workspacesIncludeMode: EIncludeMode,
        silent: boolean,
        printTargetPackages: boolean
    ): Promise<void> {
        const backToMainNavigationMessage: string = chalk.bgGreen.black(
            `  Press ${ chalk.bold.black( "<ENTER>" ) } to return back to the main navigation  ` );
        const rerunMessage: string = chalk.bgYellow.black(
            `  Press ${ chalk.bold.black( "<r>" ) } to rerun the task ` );

        LoggerUtil.printDemandActionMessage( `${ backToMainNavigationMessage }${ rerunMessage }` );

        const keyPressed: string = await KeyPromptUtil.setKeyPrompt( () => [], [ "return", "r" ] )

        if ( keyPressed === "r" ) {
            await this._execute(
                runnerOptions, prunedNpmPackageScopes, commandCallback, npmPackageCollection,
                unscopedNpmPackageCollection, configFile, mode, isInitializing, workspacesIncludeMode, silent,
                printTargetPackages
            );
        }

        return;
    }

    private _assembleCommand(
        runnerCommandOptions: ICommandRunnerOptions,
        npmPackageScopes?: INpmPackageScopes
    ): string | undefined {
        if ( !runnerCommandOptions.command ) return;

        const command: string[] = [ 'pkgm', runnerCommandOptions.command ];

        for ( let parametersKey in runnerCommandOptions.parameters ) {
            command.push( [
                parametersKey, runnerCommandOptions.parameters[ parametersKey ]
            ].filter( Boolean ).join( "=" ) )
        }

        if ( npmPackageScopes?.pathScopes ) {
            npmPackageScopes.pathScopes?.forEach( ( pathScope: string ) => {
                command.push( '--scope-path=' + pathScope );
            } )
        }

        if ( npmPackageScopes?.packageNameScopes ) {
            npmPackageScopes.packageNameScopes?.forEach( ( npmPackageScope: string ) => {
                command.push( '--scope-package-name=' + npmPackageScope );
            } )
        }

        if ( npmPackageScopes?.excludedPackagePaths ) {
            npmPackageScopes.excludedPackagePaths.forEach( ( path: string ) => {
                command.push( '--exclude-path=' + path )
            } )
        }

        if ( npmPackageScopes?.packagePaths ) {
            npmPackageScopes.packagePaths.forEach( ( path: string ) => {
                command.push( '--package-path=' + path )
            } )
        }

        return command.join( " " );
    }

    private async _promptManageScopes(
        npmPackageCollection: NpmPackageCollection,
        npmPackageScopes?: INpmPackageScopes,
        isInitializing?: boolean
    ): Promise<INpmPackageScopes | "continue" | "abort"> {
        let packageNameScopes: Set<string> = new Set( npmPackageScopes?.packageNameScopes );
        let pathScopes: Set<string> = new Set( npmPackageScopes?.pathScopes );
        let excludedPackagePaths: Set<string> = new Set( npmPackageScopes?.excludedPackagePaths );
        let packagePaths: Set<string> = new Set( npmPackageScopes?.packagePaths );

        LoggerUtil.printPromptTitle( "Edit scopes?" )
        let choices = [
            {
                name: 'Continue',
                value: 'continue',
            }, {
                name: npmPackageScopes?.pathScopes?.length ?? 0 > 0 ? 'Rerun with another path scope' : 'Add path scope',
                value: 'addPathScope'
            }, {
                name: npmPackageScopes?.packageNameScopes?.length ?? 0 > 0 ? 'Rerun with another package name scope' : 'Add package name scope',
                value: 'addPackageNameScope'
            }, {
                name: 'Exclude manually',
                value: 'excludeManually'
            }, {
                name: 'Select manually',
                value: 'selectManually'
            },
        ]

        if ( npmPackageScopes?.packageNameScopes || npmPackageScopes?.pathScopes ) {
            choices.push( {
                name: 'Remove all scopes',
                value: 'removeAllScopes'
            } )
        }

        if ( !isInitializing ) {
            choices.push( {
                name: "Back to main navigation",
                value: "backToMainNavigation"
            } )
        }

        const answer: string = await select( {
            message: 'Add or remove scopes',
            choices: choices,
            loop: false
        } );

        switch ( answer ) {
            case("addPathScope"):
                const suggestedPathScope: string | null = this._generateScopeSuggestion(
                    npmPackageCollection.packagePaths );

                const pathScopeInput: string = await input( {
                    message: 'Enter a path scope',
                    default: suggestedPathScope ?? undefined
                } );

                pathScopes = new Set( [ pathScopeInput ] );
                break;
            case("addPackageNameScope"):
                const packageJsonNames: string [] = npmPackageCollection.packages.map(
                    ( npmPackage ) => npmPackage.packageJson.name );
                const suggestedPackageNameScope: string | null = this._generateScopeSuggestion( packageJsonNames );

                const packageNameScopeInput: string = await input( {
                    message: 'Enter a package name scope',
                    default: suggestedPackageNameScope ?? undefined
                } );
                packageNameScopes = new Set( [ packageNameScopeInput ] );
                break;
            case("excludeManually"):
                const excludeManuallyExcludedPackagePaths: string[] = await this._promptExcludePackagesManually(
                    npmPackageCollection, npmPackageScopes );
                excludedPackagePaths = new Set( excludeManuallyExcludedPackagePaths )
                break;
            case("selectManually"):
                const selectedPackagePaths: string[] = await this._promptSelectPackagesManually(
                    npmPackageCollection, npmPackageScopes );
                packagePaths = new Set( selectedPackagePaths )
                break;
            case("removeAllScopes"):
                return {};
            case("continue"):
                return "continue"
            case("backToMainNavigation"):
                return "abort";
        }

        return {
            packageNameScopes: [ ...packageNameScopes ],
            pathScopes: [ ...pathScopes ],
            excludedPackagePaths: [ ...excludedPackagePaths ],
            packagePaths: [ ...packagePaths ]
        }
    }

    private async _getNpmPackageCollection(
        configs: IConfigFile,
        workspacesIncludeMode: EIncludeMode,
        projectScopes?: INpmPackageScopes
    ): Promise<NpmPackageCollection> {
        const npmProjects: INpmProject[] = await this._npmProjectService.getPackages( configs.projects, projectScopes );
        const projectPaths: string[] = npmProjects.map( npmProject => npmProject.path );

        let includedWorkspaces: INpmWorkspace[] = [];
        if ( workspacesIncludeMode !== EIncludeMode.NONE ) {
            const npmWorkspaces: INpmWorkspace[] = await this._npmWorkspaceService.getPackages(
                configs.workspaces ?? [], projectScopes );

            if ( workspacesIncludeMode === EIncludeMode.ONLY_AFFECTED ) {
                includedWorkspaces = npmWorkspaces.filter( ( workspace: INpmWorkspace ) => {
                    return !!projectPaths.find( projectPath => projectPath.includes( workspace.path ) );
                } );
            } else {
                includedWorkspaces = npmWorkspaces;
            }
        }

        return new NpmPackageCollection( npmProjects, includedWorkspaces );
    }

    private async _promptExcludePackagesManually(
        npmPackageCollection: NpmPackageCollection,
        npmPackageScopes: INpmPackageScopes = {}
    ): Promise<string[]> {
        LoggerUtil.printPromptTitle( "Select all packages, which should be excluded." )

        const sortedNpmPackages: INpmPackage[] = this._sortPackagesInAlphabeticalOrder( npmPackageCollection.packages );

        const choices = sortedNpmPackages.map( ( npmPackage ) => {
            const isChecked: boolean = !!npmPackageScopes.excludedPackagePaths?.includes( npmPackage.path );

            return {
                name: npmPackage.packageJson.name,
                value: npmPackage.path,
                checked: isChecked
            }
        } )

        return checkbox( {
            message: "Select packages to exclude from linking",
            choices: choices,
            loop: false,
            pageSize: 50
        } );
    }

    private async _promptSelectPackagesManually(
        npmPackageCollection: NpmPackageCollection,
        npmPackageScopes: INpmPackageScopes = {}
    ): Promise<string[]> {
        LoggerUtil.printPromptTitle( "Select all packages, which should be included." )

        const sortedNpmPackages: INpmPackage[] = this._sortPackagesInAlphabeticalOrder( npmPackageCollection.packages );

        const choices = sortedNpmPackages.map( ( npmPackage ) => {
            const isChecked: boolean = !!npmPackageScopes.packagePaths?.includes( npmPackage.path );

            return {
                name: npmPackage.packageJson.name,
                value: npmPackage.path,
                checked: isChecked
            }
        } )

        return checkbox( {
            message: "Select packages to include in linking",
            choices: choices,
            loop: false,
            pageSize: 50
        } );
    }

    private _generateScopeSuggestion( inputs: string[] ): string | null {
        if ( inputs.length === 0 ) return null;

        // Create a map to count occurrences of each prefix
        const prefixCountMap: { [ key: string ]: number } = {};

        // Loop through the array and count the occurrences of each prefix
        for ( const str of inputs ) {
            // For each string, generate all possible prefixes
            for ( let i = 1; i <= str.length; i++ ) {
                const prefix = str.slice( 0, i );
                if ( prefixCountMap[ prefix ] ) {
                    prefixCountMap[ prefix ]++;
                } else {
                    prefixCountMap[ prefix ] = 1;
                }
            }
        }

        // Find the prefix with the maximum count
        let mostFrequentPrefix: string | null = null;
        let maxCount = 0;

        for ( const prefix in prefixCountMap ) {
            if ( prefixCountMap[ prefix ] >= maxCount ) {
                maxCount = prefixCountMap[ prefix ];
                if ( mostFrequentPrefix?.length ?? 0 < prefix.length ) {
                    mostFrequentPrefix = prefix;
                }
            }
        }

        return mostFrequentPrefix;
    }
}