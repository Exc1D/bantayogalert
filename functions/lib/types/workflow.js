"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_TRANSITIONS = void 0;
exports.canTransition = canTransition;
/**
 * Workflow state machine types for Cloud Functions (Node runtime).
 * Mirrors src/types/workflow.ts — duplicated here because functions cannot import from src/
 */
const report_1 = require("./report");
exports.VALID_TRANSITIONS = {
    [report_1.WorkflowState.Pending]: [report_1.WorkflowState.Verified, report_1.WorkflowState.Rejected],
    [report_1.WorkflowState.Verified]: [report_1.WorkflowState.Dispatched, report_1.WorkflowState.Rejected],
    [report_1.WorkflowState.Rejected]: [],
    [report_1.WorkflowState.Dispatched]: [report_1.WorkflowState.Acknowledged, report_1.WorkflowState.Dispatched],
    [report_1.WorkflowState.Acknowledged]: [report_1.WorkflowState.InProgress],
    [report_1.WorkflowState.InProgress]: [report_1.WorkflowState.Resolved],
    [report_1.WorkflowState.Resolved]: [],
};
function canTransition(from, to) {
    return exports.VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
