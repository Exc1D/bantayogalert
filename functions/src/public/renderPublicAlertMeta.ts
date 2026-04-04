import * as functions from 'firebase-functions'
import { getFirestore } from 'firebase-admin/firestore'
import { AnnouncementStatus } from '../types/announcement'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getOrigin(req: functions.https.Request) {
  const forwardedProto = req.get('x-forwarded-proto') ?? 'https'
  const host = req.get('x-forwarded-host') ?? req.get('host') ?? 'bantayogalert.web.app'
  return `${forwardedProto}://${host}`
}

function renderAlertShell(params: {
  canonicalUrl: string
  title: string
  description: string
  imageUrl: string
}) {
  const { canonicalUrl, title, description, imageUrl } = params

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
</html>`
}

export const renderPublicAlertMeta = functions.https.onRequest(
  async (req, res) => {
    const pathSegments = req.path.split('/').filter(Boolean)
    const alertId = pathSegments.at(-2)

    if (!alertId) {
      res.status(400).send('Missing alertId')
      return
    }

    const db = getFirestore()
    const snapshot = await db.collection('announcements').doc(alertId).get()

    if (!snapshot.exists) {
      res.status(404).send('Alert not found')
      return
    }

    const announcement = snapshot.data() as {
      title: string
      body: string
      status: string
    }

    if (announcement.status !== AnnouncementStatus.Published) {
      res.status(404).send('Alert not found')
      return
    }

    const origin = getOrigin(req)
    const canonicalUrl = `${origin}/public/alerts/${alertId}`
    const imageUrl = `${origin}/og-image.svg`
    const title = `${announcement.title} | Bantayog Alert`
    const description = announcement.body.slice(0, 220)

    res
      .status(200)
      .set('cache-control', 'public, max-age=300, s-maxage=600')
      .set('content-type', 'text/html; charset=utf-8')
      .send(
        renderAlertShell({
          canonicalUrl,
          title,
          description,
          imageUrl,
        })
      )
  }
)
