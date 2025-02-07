"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionUtil = void 0;
const semver_1 = __importDefault(require("semver"));
class VersionUtil {
    static getVersionOperator(version, range) {
        if (!semver_1.default.valid(version)) {
            throw new Error(`Invalid version: ${version}`);
        }
        if (!semver_1.default.validRange(range)) {
            throw new Error(`Invalid range: ${range}`);
        }
        const parsedVersion = semver_1.default.coerce(version);
        const parsedRange = new semver_1.default.Range(range);
        if (!semver_1.default.satisfies(version, range) || parsedVersion === null) {
            return null;
        }
        const rangeSets = parsedRange.set;
        if (rangeSets.length === 1) {
            const definedOperator = range.match(/^\D/)?.[0];
            if (definedOperator === undefined)
                return "^";
            if (["~", "^"].includes(definedOperator)) {
                return definedOperator;
            }
            if ([">"].includes(definedOperator)) {
                return "^";
            }
            if (["<"].includes(definedOperator)) {
                if (parsedVersion.major > parsedVersion.major) {
                    return "^";
                }
                if (parsedVersion.minor > parsedVersion.minor) {
                    return "~";
                }
            }
            return null;
        }
        for (const subRange of rangeSets) {
            const maxRangeVersion = subRange.find((r) => r.operator === "<=" || r.operator === "<");
            if (maxRangeVersion && semver_1.default.lt(version, maxRangeVersion.semver.version)) {
                if (maxRangeVersion.semver.major > parsedVersion.major) {
                    return "^";
                }
                if (maxRangeVersion.semver.minor > parsedVersion.minor) {
                    return "~";
                }
                return null;
            }
        }
        return null;
    }
}
exports.VersionUtil = VersionUtil;
