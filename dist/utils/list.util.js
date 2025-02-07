"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUtil = void 0;
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
class ListUtil {
    static async readList(filePath) {
        const lines = [];
        if (!fs_1.default.existsSync(filePath)) {
            return [];
        }
        const fileStream = fs_1.default.createReadStream(filePath);
        const rl = readline_1.default.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        for await (const line of rl) {
            lines.push(line);
        }
        return lines;
    }
}
exports.ListUtil = ListUtil;
