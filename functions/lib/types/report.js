"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogEntrySchema = exports.ReportPrivateSchema = exports.ReportSchema = exports.ReportMediaSchema = exports.GeoLocationSchema = exports.ReportStatus = exports.WorkflowState = exports.Severity = exports.IncidentType = void 0;
const zod_1 = require("zod");
var IncidentType;
(function (IncidentType) {
    IncidentType["Flood"] = "flood";
    IncidentType["Landslide"] = "landslide";
    IncidentType["Fire"] = "fire";
    IncidentType["Earthquake"] = "earthquake";
    IncidentType["Medical"] = "medical";
    IncidentType["VehicleAccident"] = "vehicle_accident";
    IncidentType["Crime"] = "crime";
    IncidentType["Other"] = "other";
})(IncidentType || (exports.IncidentType = IncidentType = {}));
var Severity;
(function (Severity) {
    Severity["Critical"] = "critical";
    Severity["High"] = "high";
    Severity["Medium"] = "medium";
    Severity["Low"] = "low";
})(Severity || (exports.Severity = Severity = {}));
var WorkflowState;
(function (WorkflowState) {
    WorkflowState["Pending"] = "pending";
    WorkflowState["Verified"] = "verified";
    WorkflowState["Rejected"] = "rejected";
    WorkflowState["Dispatched"] = "dispatched";
    WorkflowState["Acknowledged"] = "acknowledged";
    WorkflowState["InProgress"] = "in_progress";
    WorkflowState["Resolved"] = "resolved";
})(WorkflowState || (exports.WorkflowState = WorkflowState = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["Submitted"] = "submitted";
    ReportStatus["UnderReview"] = "under_review";
    ReportStatus["Verified"] = "verified";
    ReportStatus["Rejected"] = "rejected";
    ReportStatus["Dispatched"] = "dispatched";
    ReportStatus["Acknowledged"] = "acknowledged";
    ReportStatus["InProgress"] = "in_progress";
    ReportStatus["Resolved"] = "resolved";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
exports.GeoLocationSchema = zod_1.z.object({
    lat: zod_1.z.number().min(13.8).max(14.8),
    lng: zod_1.z.number().min(122.3).max(123.3),
    geohash: zod_1.z.string().length(9),
});
exports.ReportMediaSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    type: zod_1.z.enum(['image/jpeg', 'image/png', 'image/webp']),
    filename: zod_1.z.string().max(255),
    sizeBytes: zod_1.z.number().max(10 * 1024 * 1024),
    uploadedAt: zod_1.z.string().datetime(),
});
exports.ReportSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(IncidentType),
    severity: zod_1.z.nativeEnum(Severity),
    description: zod_1.z.string().min(10).max(2000),
    location: exports.GeoLocationSchema,
    municipalityCode: zod_1.z.string().length(3),
    barangayCode: zod_1.z.string().length(6),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).max(5),
});
exports.ReportPrivateSchema = zod_1.z.object({
    exactLocation: zod_1.z.object({
        lat: zod_1.z.number().min(13.8).max(14.8),
        lng: zod_1.z.number().min(122.3).max(123.3),
    }),
    priority: zod_1.z.number().int().min(1).max(5).optional(),
    internalNotes: zod_1.z.string().max(5000).optional(),
});
exports.ActivityLogEntrySchema = zod_1.z.object({
    action: zod_1.z.string(),
    performedBy: zod_1.z.string(),
    performedAt: zod_1.z.string().datetime(),
    details: zod_1.z.string().optional(),
});
