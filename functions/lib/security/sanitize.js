"use strict";
/**
 * Input sanitization utilities for Cloud Functions.
 *
 * Strips HTML tags from all text fields before writing to Firestore.
 * Uses regex-based approach to avoid external dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeText = sanitizeText;
exports.sanitizeObject = sanitizeObject;
exports.sanitizeUserInput = sanitizeUserInput;
exports.sanitizeReportInput = sanitizeReportInput;
exports.sanitizeContactInput = sanitizeContactInput;
exports.sanitizeAnnouncementInput = sanitizeAnnouncementInput;
// Fields that should be sanitized in user-related documents
const USER_TEXT_FIELDS = ['displayName', 'description', 'notes', 'title', 'body', 'reason', 'summary'];
// Fields that should be sanitized in report documents
const REPORT_TEXT_FIELDS = [...USER_TEXT_FIELDS, 'locationDescription', 'address'];
// Fields that should be sanitized in contact documents
const CONTACT_TEXT_FIELDS = ['name', 'agency', 'notes', 'role', 'title'];
// Fields that should be sanitized in announcement documents
const ANNOUNCEMENT_TEXT_FIELDS = ['title', 'body', 'summary'];
/**
 * Sanitize a single text field by removing HTML tags.
 *
 * @param input - The text to sanitize
 * @returns Sanitized text with HTML tags removed
 */
function sanitizeText(input) {
    if (typeof input !== 'string') {
        return '';
    }
    // Remove HTML tags using regex
    const stripped = input.replace(/<[^>]*>/g, '');
    // Trim leading/trailing whitespace
    return stripped.trim();
}
/**
 * Sanitize specific fields in an object.
 *
 * @param obj - The object containing fields to sanitize
 * @param fieldsToSanitize - Array of field names to sanitize
 * @returns New object with specified fields sanitized
 */
function sanitizeObject(obj, fieldsToSanitize) {
    const result = { ...obj };
    for (const field of fieldsToSanitize) {
        if (field in result) {
            result[field] = sanitizeText(result[field]);
        }
    }
    return result;
}
/**
 * Recursively sanitize an object, processing all string fields.
 *
 * @param data - The data object to sanitize
 * @param knownStringFields - Fields known to be strings that should be sanitized
 * @returns New object with string fields sanitized
 */
function sanitizeRecursively(data, knownStringFields) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
            result[key] = value;
        }
        else if (typeof value === 'string') {
            // Sanitize if it's a known text field
            result[key] = knownStringFields.includes(key) ? sanitizeText(value) : value;
        }
        else if (Array.isArray(value)) {
            // Arrays: sanitize strings within, keep other types
            result[key] = value.map((item) => typeof item === 'string' ? sanitizeText(item) : item);
        }
        else if (typeof value === 'object') {
            // Nested objects: recurse
            result[key] = sanitizeRecursively(value, knownStringFields);
        }
        else {
            // Numbers, booleans, etc.: keep as-is
            result[key] = value;
        }
    }
    return result;
}
/**
 * Sanitize user input data.
 * Applies sanitization to common text fields.
 *
 * @param data - User data to sanitize
 * @returns Sanitized user data
 */
function sanitizeUserInput(data) {
    return sanitizeRecursively(data, USER_TEXT_FIELDS);
}
/**
 * Sanitize report input data.
 * Applies sanitization to report-specific text fields.
 *
 * @param data - Report data to sanitize
 * @returns Sanitized report data
 */
function sanitizeReportInput(data) {
    return sanitizeRecursively(data, REPORT_TEXT_FIELDS);
}
/**
 * Sanitize contact input data.
 * Applies sanitization to contact-specific text fields.
 *
 * @param data - Contact data to sanitize
 * @returns Sanitized contact data
 */
function sanitizeContactInput(data) {
    return sanitizeRecursively(data, CONTACT_TEXT_FIELDS);
}
/**
 * Sanitize announcement input data.
 * Applies sanitization to announcement-specific text fields.
 *
 * @param data - Announcement data to sanitize
 * @returns Sanitized announcement data
 */
function sanitizeAnnouncementInput(data) {
    return sanitizeRecursively(data, ANNOUNCEMENT_TEXT_FIELDS);
}
