"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKFLOW_TO_PUBLIC_STATUS = exports.WORKFLOW_TO_OWNER_STATUS = void 0;
const report_1 = require("./report");
exports.WORKFLOW_TO_OWNER_STATUS = {
    [report_1.WorkflowState.Pending]: report_1.ReportStatus.Submitted,
    [report_1.WorkflowState.Verified]: report_1.ReportStatus.Verified,
    [report_1.WorkflowState.Rejected]: report_1.ReportStatus.Rejected,
    [report_1.WorkflowState.Dispatched]: report_1.ReportStatus.Dispatched,
    [report_1.WorkflowState.Acknowledged]: report_1.ReportStatus.Acknowledged,
    [report_1.WorkflowState.InProgress]: report_1.ReportStatus.InProgress,
    [report_1.WorkflowState.Resolved]: report_1.ReportStatus.Resolved,
};
exports.WORKFLOW_TO_PUBLIC_STATUS = {
    [report_1.WorkflowState.Pending]: 'Pending Verification',
    [report_1.WorkflowState.Verified]: 'Verified',
    [report_1.WorkflowState.Rejected]: 'Resolved',
    [report_1.WorkflowState.Dispatched]: 'Verified',
    [report_1.WorkflowState.Acknowledged]: 'Verified',
    [report_1.WorkflowState.InProgress]: 'Verified',
    [report_1.WorkflowState.Resolved]: 'Resolved',
};
