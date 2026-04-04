"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPublicAlertMeta = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const announcement_1 = require("../types/announcement");
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function getOrigin(req) {
    const forwardedProto = req.get('x-forwarded-proto') ?? 'https';
    const host = req.get('x-forwarded-host') ?? req.get('host') ?? 'bantayogalert.web.app';
    return `${forwardedProto}://${host}`;
}
function renderAlertShell(params) {
    const { canonicalUrl, title, description, imageUrl } = params;
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
  </head>
  <body>
    <script>
      window.location.replace(${JSON.stringify(canonicalUrl)});
    </script>
    <p>Redirecting to the public alert…</p>
  </body>
</html>`;
}
exports.renderPublicAlertMeta = functions.https.onRequest(async (req, res) => {
    const pathSegments = req.path.split('/').filter(Boolean);
    const alertId = pathSegments.at(-2);
    if (!alertId) {
        res.status(400).send('Missing alertId');
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    const snapshot = await db.collection('announcements').doc(alertId).get();
    if (!snapshot.exists) {
        res.status(404).send('Alert not found');
        return;
    }
    const announcement = snapshot.data();
    if (announcement.status !== announcement_1.AnnouncementStatus.Published) {
        res.status(404).send('Alert not found');
        return;
    }
    const origin = getOrigin(req);
    const canonicalUrl = `${origin}/public/alerts/${alertId}`;
    const imageUrl = `${origin}/og-image.svg`;
    const title = `${announcement.title} | Bantayog Alert`;
    const description = announcement.body.slice(0, 220);
    res
        .status(200)
        .set('cache-control', 'public, max-age=300, s-maxage=600')
        .set('content-type', 'text/html; charset=utf-8')
        .send(renderAlertShell({
        canonicalUrl,
        title,
        description,
        imageUrl,
    }));
});
