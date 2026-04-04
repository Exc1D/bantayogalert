"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementSchema = exports.AnnouncementStatus = exports.AnnouncementSeverity = exports.AnnouncementType = void 0;
const zod_1 = require("zod");
var AnnouncementType;
(function (AnnouncementType) {
    AnnouncementType["Alert"] = "alert";
    AnnouncementType["Advisory"] = "advisory";
    AnnouncementType["Update"] = "update";
    AnnouncementType["AllClear"] = "all_clear";
})(AnnouncementType || (exports.AnnouncementType = AnnouncementType = {}));
var AnnouncementSeverity;
(function (AnnouncementSeverity) {
    AnnouncementSeverity["Info"] = "info";
    AnnouncementSeverity["Warning"] = "warning";
    AnnouncementSeverity["Critical"] = "critical";
})(AnnouncementSeverity || (exports.AnnouncementSeverity = AnnouncementSeverity = {}));
var AnnouncementStatus;
(function (AnnouncementStatus) {
    AnnouncementStatus["Draft"] = "draft";
    AnnouncementStatus["Published"] = "published";
    AnnouncementStatus["Cancelled"] = "cancelled";
})(AnnouncementStatus || (exports.AnnouncementStatus = AnnouncementStatus = {}));
exports.AnnouncementSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    body: zod_1.z.string().min(10).max(5000),
    type: zod_1.z.nativeEnum(AnnouncementType),
    severity: zod_1.z.nativeEnum(AnnouncementSeverity),
    targetScope: zod_1.z.discriminatedUnion('type', [
        zod_1.z.object({ type: zod_1.z.literal('province') }),
        zod_1.z.object({
            type: zod_1.z.literal('municipality'),
            municipalityCodes: zod_1.z.array(zod_1.z.string().min(3).max(4)).min(1).max(1),
        }),
        zod_1.z.object({
            type: zod_1.z.literal('multi_municipality'),
            municipalityCodes: zod_1.z.array(zod_1.z.string().min(3).max(4)).min(2).max(12),
        }),
    ]),
});
