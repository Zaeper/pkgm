"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmWorkspaceService = void 0;
const npm_package_service_1 = require("./npm-package.service");
const e_npm_package_type_1 = require("../../definitions/npm/e-npm-package-type");
class NpmWorkspaceService extends npm_package_service_1.NpmPackageService {
    executionService;
    constructor(executionService) {
        super(executionService, e_npm_package_type_1.ENpmPackageType.WORKSPACE);
        this.executionService = executionService;
    }
}
exports.NpmWorkspaceService = NpmWorkspaceService;
