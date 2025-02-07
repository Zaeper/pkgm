import {INpmClientService} from "./i-npm-client.service";
import {NpmClientType} from "../../definitions/npm/npm-client-type";
import Logger from "@ptkdev/logger";
import child_process from "child_process";
import {IListReport} from "../../definitions/npm/i-list-report";
import ora, {Ora} from "ora";

export class NpmClientService implements INpmClientService {
    private static readonly _LOGGER = new Logger();

    constructor() {
    }

    async installNpmClient(npmClient: NpmClientType): Promise<void> {
        if (npmClient !== "npm") {
            const isNpmClientAlreadyInstalled: boolean = await this._checkIfClientIsInstalled(npmClient);

            if (isNpmClientAlreadyInstalled) return;

            await this._installNpmClient(npmClient);
        }

        return;
    }

    async _installNpmClient(npmClient: NpmClientType): Promise<void> {
        const installingNpmClientSpinner: Ora = ora('Checking if npm client is installed').start();

        const command: string = `npm install -g ${npmClient}@latest`;

        await this._executeTerminalCommand(command);

        installingNpmClientSpinner.stop();
    }

    async _checkIfClientIsInstalled(npmClient: NpmClientType): Promise<boolean> {
        const checkNpmClientInstalledSpinner: Ora = ora('Checking if npm client is installed').start();

        const command: string = `npm list -g ${npmClient} --json`;

        const output: string = await this._executeTerminalCommand(command);

        const npmListReport: IListReport = JSON.parse(output);

        checkNpmClientInstalledSpinner.stop();

        return Object.entries(npmListReport.dependencies ?? {}).length > 0;
    }

    _executeTerminalCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            child_process.exec(command, {
                encoding: "utf-8"
            }, (error, stdout, stderr) => {
                if (stderr) {
                    console.error(stderr);
                }
                resolve(stdout)
            });
        })
    }
}