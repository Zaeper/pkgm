"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyPromptUtil = void 0;
const core_1 = require("@inquirer/core");
class KeyPromptUtil {
    static async setKeyPrompt(callback, keyId) {
        process.stdout.write("\x1b[?25l");
        const input = (0, core_1.createPrompt)((config, done) => {
            (0, core_1.useKeypress)((key, inquirerReadline) => {
                if (key.name === keyId) {
                    callback();
                    done("");
                    process.stdout.write("\x1b[?25h");
                }
                else {
                    inquirerReadline.clearLine(0);
                }
            });
            return "\x1b[1A\x1b[9999C";
        });
        await input({});
    }
}
exports.KeyPromptUtil = KeyPromptUtil;
