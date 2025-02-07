import figlet from "figlet";
import chalk from "chalk";
import readline from "readline";
import {INpmPackage} from "../definitions/npm/i-npm-package";

require('pkginfo')(module, "version");

export class LoggerUtil {
    private static _WHITE: string = '\x1b[37m';
    private static _YELLOW: string = '\x1b[33m'
    private static _RED: string = '\x1b[31m'
    private static _RESET: string = '\x1b[0m';
    private static _SEPARATOR: string = "==============================================";

    public static printBanner(): Promise<void> {
        return new Promise((
            resolve,
            reject
        ) => {
            figlet.text("Zaeper", {
                font: "Ogre",
                horizontalLayout: "full",
                verticalLayout: "default",
                width: 80,
                whitespaceBreak: true,
            }, function (
                err,
                data
            ) {
                if (err) {
                    console.log("Something went wrong...");
                    console.dir(err);
                    return;
                }
                if (data) {
                    console.log(data)
                } else {
                    LoggerUtil.printTitle("Zaeper")
                }
                resolve();
            });
        })
    }

    public static async printWelcome() {
        await LoggerUtil.printBanner();
        const version = module.exports.version;

        LoggerUtil.printNote(` Version ${version} `);
        LoggerUtil.printTitle("PKGM - Zaeper Package Management");
    }

    public static printTitle(title: string): void {
        console.log(`${LoggerUtil._SEPARATOR}\n${title}\n${LoggerUtil._SEPARATOR}`);
    }

    public static clearBottomLine(offset: number = 0) {
        const targetLine = process.stdout.rows - 1 - offset;
        readline.cursorTo(process.stdout, 0, targetLine);
        readline.clearLine(process.stdout, 0);
    }

    public static printDemandActionMessage(message: string) {
        LoggerUtil.clearBottomLine();
        readline.cursorTo(process.stdout, 0, process.stdout.rows - 1);
        readline.clearLine(process.stdout, 0);
        process.stdout.write(`${message}`)
    }

    public static printPromptTitle(text: string): void {
        LoggerUtil.printSpacing();
        console.log(chalk.bgWhite.black.bold(` Prompt: ${text} `));
    }

    public static printProject(npmPackage: INpmPackage) {
        LoggerUtil.printSpacing();
        console.log(`${chalk
            .bgCyan.black.bold(` Project: ${npmPackage.packageJson.name} `)} ${chalk.italic.gray(npmPackage.path)}`);
    }

    public static printNote(text: string): void {
        console.log(chalk.bgCyan.black.bold(` Note: ${text} `));
    }

    public static printWarning(text: string): void {
        console.warn(`${chalk.bgYellow.black.bold(` Warning `)} ${chalk.yellow(text)}`);
    }

    public static printSection(text: string): void {
        console.log(chalk.bgCyanBright.black.bold(` ${text} `));
    }

    public static printInfo(text: string): void {
        console.log(chalk.cyan(`Info: ${text} `));
    }

    public static printHint(text: string): void {
        console.log(chalk.bgGreen.black.bold(`Hint: ${text} `));
    }

    public static printImportantHint(text: string): void {
        console.log(chalk.bgRedBright.black.bold(`Important!: ${text} `));
    }

    public static printOutputTitle(text: string): void {
        console.log(chalk.white(` ${text}: `));
    }

    public static printSuccess(text: string): void {
        console.log(chalk.bgGreenBright.black.bold(` ${text}`))
    }

    public static printAction(text: string): void {
        LoggerUtil.printSpacing();
        console.log(chalk.bgMagenta.white.bold(` Action: ${text} `));
        LoggerUtil.printSeparator();
    }

    public static printSeparator() {
        console.log(chalk.white("=======>"))
    }

    public static printStep(text: string): void {
        console.log(chalk.magenta(`Step: ${text}`));
    }

    public static printCommand(text: string) {
        console.log(chalk.bgYellow.black.bold(" Command: "));
        console.log(chalk.yellow(`${text}`));
    }

    public static printIndented(
        text: string,
        level: number = 0
    ): void {
        const spacing: string = "  ";

        const lines: string[] = text.split("\n");
        for (const line of lines) {
            let outputText: string = "";

            for (let i = 0; i < level; i++) {
                outputText += spacing
            }

            outputText += line;

            console.log(outputText)
        }
    }

    public static printSpacingLg() {
        console.log('\n\n\n\n');
    }

    public static printSpacing() {
        console.log('\n');
    }

    public static printWhite(text: string): void {
        console.log(`${LoggerUtil._WHITE}${text}${LoggerUtil._RESET}`);
    }

    public static printYellow(text: string): void {
        console.log(`${LoggerUtil._YELLOW}${text}${LoggerUtil._RESET}`);
    }

    public static printRed(text: string): void {
        console.log(`${LoggerUtil._YELLOW}${text}${LoggerUtil._RESET}`);
    }
}