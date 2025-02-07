"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyMap = void 0;
const preload_1 = __importDefault(require("semver/preload"));
class DependencyMap {
    _dependencies;
    _peerDependencies;
    _devDependencies;
    constructor(dependencies, peerDependencies, devDependencies) {
        this._dependencies = dependencies;
        this._peerDependencies = peerDependencies;
        this._devDependencies = devDependencies;
    }
    get dependencies() {
        return this._dependencies;
    }
    get peerDependencies() {
        return this._peerDependencies;
    }
    get devDependencies() {
        return this._devDependencies;
    }
    get summarizedDependencies() {
        const dependencyList = [
            this._dependencies,
            this._devDependencies,
            this._peerDependencies
        ];
        return dependencyList.reduce((acc, curr) => {
            Object.entries(curr).forEach(([dependencyName, dependencyVersion]) => {
                const accDependencyVersion = acc[dependencyName];
                if (!!accDependencyVersion) {
                    if (preload_1.default.lt(dependencyVersion, accDependencyVersion)) {
                        acc[dependencyName] = dependencyVersion;
                    }
                }
                else {
                    acc[dependencyName] = dependencyVersion;
                }
            });
            return acc;
        }, {});
    }
}
exports.DependencyMap = DependencyMap;
