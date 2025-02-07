"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmPackageDependency = void 0;
const preload_1 = __importDefault(require("semver/preload"));
class NpmPackageDependency {
    _name;
    _versions;
    _versionEntries;
    _isTypeDeclarationPackage;
    _addedBy;
    constructor(name, versionEntries, isTypeDeclarationPackage, addedBy) {
        this._name = name;
        this._versionEntries = this._prepareVersionEntries(versionEntries);
        this._versions = this._getVersions(this._versionEntries);
        this._isTypeDeclarationPackage = isTypeDeclarationPackage;
        this._addedBy = addedBy;
    }
    get name() {
        return this._name;
    }
    get versions() {
        return this._versions;
    }
    get versionEntries() {
        return this._versionEntries;
    }
    get isTypeDeclarationPackage() {
        return this._isTypeDeclarationPackage;
    }
    get addedBy() {
        return this._addedBy;
    }
    _prepareVersionEntries(versionEntries) {
        const stableOnlyVersionEntries = this._getStableOnlyVersions(versionEntries);
        return this._sortVersionEntries(stableOnlyVersionEntries);
    }
    _getStableOnlyVersions(versionEntries) {
        return versionEntries.filter(versionEntry => {
            return !!versionEntry.version.match(new RegExp("^\\d+\\.\\d+\\.\\d+$"));
        });
    }
    _getVersions(versionEntries) {
        return versionEntries.map((versionInfo) => versionInfo.version);
    }
    _sortVersionEntries(versions) {
        return [...versions].sort((a, b) => {
            if (preload_1.default.lt(a.version, b.version))
                return 1;
            if (preload_1.default.gt(a.version, b.version))
                return -1;
            return 0;
        });
    }
}
exports.NpmPackageDependency = NpmPackageDependency;
