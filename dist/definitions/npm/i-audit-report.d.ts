export declare enum EAuditVulnerabilitySeverity {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    NONE = "none"
}
export interface IAuditVulnerability {
    "name": string;
    "severity": EAuditVulnerabilitySeverity;
    "isDirect": boolean;
    "via": string[];
    "effects": string[];
    "range": string;
    "nodes": string[];
    "fixAvailable": Record<string, IAuditVulnerabilityFixAvailable>;
}
export interface IAuditVulnerabilityFixAvailable {
    "name": string;
    "version": string;
    "isSemVerMajor": boolean;
}
export interface IAuditReport {
    "auditReportVersion": number;
    "vulnerabilities": Record<string, IAuditVulnerability>;
    "metadata": {
        "vulnerabilities": {
            "info": number;
            "low": number;
            "moderate": number;
            "high": number;
            "critical": number;
            "total": number;
        };
        "dependencies": {
            "prod": number;
            "dev": number;
            "optional": number;
            "peer": number;
            "peerOptional": number;
            "total": number;
        };
    };
}
