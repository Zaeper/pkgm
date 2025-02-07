"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathUtil = void 0;
const path_1 = __importDefault(require("path"));
class PathUtil {
    static join(...paths) {
        return PathUtil.normalize(path_1.default.join(...paths));
    }
    static resolve(...paths) {
        return PathUtil.normalize(path_1.default.resolve(...paths));
    }
    static relative(from, to) {
        return PathUtil.normalize(path_1.default.relative(from, to));
    }
    static normalize(path) {
        return path.split("\\").join("/");
    }
}
exports.PathUtil = PathUtil;
