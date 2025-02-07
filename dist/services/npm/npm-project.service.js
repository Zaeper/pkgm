"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmProjectService = void 0;
const logger_util_1 = require("../../utils/logger.util");
const e_command_type_1 = require("../../definitions/e-command-type");
const npm_package_service_1 = require("./npm-package.service");
const e_npm_package_type_1 = require("../../definitions/npm/e-npm-package-type");
class NpmProjectService extends npm_package_service_1.NpmPackageService {
    executionService;
    constructor(executionService) {
        super(executionService, e_npm_package_type_1.ENpmPackageType.PROJECT);
        this.executionService = executionService;
    }
    async build(projects, configFile) {
        logger_util_1.LoggerUtil.printAction(`Running npm build in target projects`);
        return this.run(projects, "build", e_command_type_1.ECommandType.NPM_SCRIPT, false, configFile);
    }
    async buildWatch(projects, configFile) {
        logger_util_1.LoggerUtil.printAction(`Running npm build:watch in target projects`);
        return this.run(projects, "build:watch", e_command_type_1.ECommandType.NPM_SCRIPT, true, configFile);
    }
}
exports.NpmProjectService = NpmProjectService;
