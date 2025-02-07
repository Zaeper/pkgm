"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmClientService = void 0;
const logger_1 = __importDefault(require("@ptkdev/logger"));
const child_process_1 = __importDefault(require("child_process"));
const ora_1 = __importDefault(require("ora"));
class NpmClientService {
    static _LOGGER = new logger_1.default();
    constructor() {
    }
    async installNpmClient(npmClient) {
        if (npmClient !== "npm") {
            const isNpmClientAlreadyInstalled = await this._checkIfClientIsInstalled(npmClient);
            if (isNpmClientAlreadyInstalled)
                return;
            await this._installNpmClient(npmClient);
        }
        return;
    }
    async _installNpmClient(npmClient) {
        const installingNpmClientSpinner = (0, ora_1.default)('Checking if npm client is installed').start();
        const command = `npm install -g ${npmClient}@latest`;
        await this._executeTerminalCommand(command);
        installingNpmClientSpinner.stop();
    }
    async _checkIfClientIsInstalled(npmClient) {
        const checkNpmClientInstalledSpinner = (0, ora_1.default)('Checking if npm client is installed').start();
        const command = `npm list -g ${npmClient} --json`;
        const output = await this._executeTerminalCommand(command);
        const npmListReport = JSON.parse(output);
        checkNpmClientInstalledSpinner.stop();
        return Object.entries(npmListReport.dependencies ?? {}).length > 0;
    }
    _executeTerminalCommand(command) {
        return new Promise((resolve, reject) => {
            child_process_1.default.exec(command, {
                encoding: "utf-8"
            }, (error, stdout, stderr) => {
                if (stderr) {
                    console.error(stderr);
                }
                resolve(stdout);
            });
        });
    }
}
exports.NpmClientService = NpmClientService;
