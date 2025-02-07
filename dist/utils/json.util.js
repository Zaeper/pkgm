"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonUtil = void 0;
const fs_1 = __importDefault(require("fs"));
class JsonUtil {
    static readJson(filePath) {
        const jsonData = fs_1.default.readFileSync(filePath, 'utf-8');
        return JSON.parse(jsonData);
    }
}
exports.JsonUtil = JsonUtil;
