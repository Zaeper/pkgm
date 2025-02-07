"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceUtil = void 0;
class WorkspaceUtil {
    static getPaths(workspaces) {
        return workspaces.map(workspaces => workspaces.path);
    }
}
exports.WorkspaceUtil = WorkspaceUtil;
