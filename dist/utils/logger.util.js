"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerUtil = void 0;
const figlet_1 = __importDefault(require("figlet"));
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = __importDefault(require("readline"));
require('pkginfo')(module, "version");
class LoggerUtil {
    static _WHITE = '\x1b[37m';
    static _YELLOW = '\x1b[33m';
    static _RED = '\x1b[31m';
    static _RESET = '\x1b[0m';
    static _SEPARATOR = "==============================================";
    static printBanner() {
        return new Promise((resolve, reject) => {
            figlet_1.default.text("Zaeper", {
                font: "Ogre",
                horizontalLayout: "full",
                verticalLayout: "default",
                width: 80,
                whitespaceBreak: true,
            }, function (err, data) {
                if (err) {
                    console.log("Something went wrong...");
                    console.dir(err);
                    return;
                }
                if (data) {
                    console.log(data);
                }
                else {
                    LoggerUtil.printTitle("Zaeper");
                }
                resolve();
            });
        });
    }
    static async printWelcome() {
        await LoggerUtil.printBanner();
        const version = module.exports.version;
        LoggerUtil.printNote(` Version ${version} `);
        LoggerUtil.printTitle("PKGM - Zaeper Package Management");
    }
    static printTitle(title) {
        console.log(`${LoggerUtil._SEPARATOR}\n${title}\n${LoggerUtil._SEPARATOR}`);
    }
    static clearBottomLine(offset = 0) {
        const targetLine = process.stdout.rows - 1 - offset;
        readline_1.default.cursorTo(process.stdout, 0, targetLine);
        readline_1.default.clearLine(process.stdout, 0);
    }
    static printDemandActionMessage(message) {
        LoggerUtil.clearBottomLine();
        readline_1.default.cursorTo(process.stdout, 0, process.stdout.rows - 1);
        readline_1.default.clearLine(process.stdout, 0);
        process.stdout.write(`${message}`);
    }
    static printPromptTitle(text) {
        LoggerUtil.printSpacing();
        console.log(chalk_1.default.bgWhite.black.bold(` Prompt: ${text} `));
    }
    static printProject(npmPackage) {
        LoggerUtil.printSpacing();
        console.log(`${chalk_1.default
            .bgCyan.black.bold(` Project: ${npmPackage.packageJson.name} `)} ${chalk_1.default.italic.gray(npmPackage.path)}`);
    }
    static printNote(text) {
        console.log(chalk_1.default.bgCyan.black.bold(` Note: ${text} `));
    }
    static printWarning(text) {
        console.warn(`${chalk_1.default.bgYellow.black.bold(` Warning `)} ${chalk_1.default.yellow(text)}`);
    }
    static printSection(text) {
        console.log(chalk_1.default.bgCyanBright.black.bold(` ${text} `));
    }
    static printInfo(text) {
        console.log(chalk_1.default.cyan(`Info: ${text} `));
    }
    static printHint(text) {
        console.log(chalk_1.default.bgGreen.black.bold(`Hint: ${text} `));
    }
    static printImportantHint(text) {
        console.log(chalk_1.default.bgRedBright.black.bold(`Important!: ${text} `));
    }
    static printOutputTitle(text) {
        console.log(chalk_1.default.white(` ${text}: `));
    }
    static printSuccess(text) {
        console.log(chalk_1.default.bgGreenBright.black.bold(` ${text}`));
    }
    static printAction(text) {
        LoggerUtil.printSpacing();
        console.log(chalk_1.default.bgMagenta.white.bold(` Action: ${text} `));
        LoggerUtil.printSeparator();
    }
    static printSeparator() {
        console.log(chalk_1.default.white("=======>"));
    }
    static printStep(text) {
        console.log(chalk_1.default.magenta(`Step: ${text}`));
    }
    static printCommand(text) {
        console.log(chalk_1.default.bgYellow.black.bold(" Command: "));
        console.log(chalk_1.default.yellow(`${text}`));
    }
    static printIndented(text, level = 0) {
        const spacing = "  ";
        const lines = text.split("\n");
        for (const line of lines) {
            let outputText = "";
            for (let i = 0; i < level; i++) {
                outputText += spacing;
            }
            outputText += line;
            console.log(outputText);
        }
    }
    static printSpacingLg() {
        console.log('\n\n\n\n');
    }
    static printSpacing() {
        console.log('\n');
    }
    static printWhite(text) {
        console.log(`${LoggerUtil._WHITE}${text}${LoggerUtil._RESET}`);
    }
    static printYellow(text) {
        console.log(`${LoggerUtil._YELLOW}${text}${LoggerUtil._RESET}`);
    }
    static printRed(text) {
        console.log(`${LoggerUtil._YELLOW}${text}${LoggerUtil._RESET}`);
    }
}
exports.LoggerUtil = LoggerUtil;
