import { Helmet } from 'react-helmet-async'

const DEFAULT_SITE_TITLE = 'Bantayog Alert'
const DEFAULT_SITE_DESCRIPTION =
  'Disaster reporting and emergency coordination for Camarines Norte.'
const DEFAULT_OG_IMAGE_PATH = '/og-image.svg'
const FALLBACK_SITE_ORIGIN = 'https://bantayogalert.web.app'

function getSiteOrigin() {
  if (typeof window === 'undefined') {
    return FALLBACK_SITE_ORIGIN
  }

  return window.location.origin
}

function toAbsoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getSiteOrigin()}${normalizedPath}`
}

export interface RouteMetaProps {
  title: string
  description?: string
  canonicalPath: string
  imagePath?: string
  robots?: string
}

export function RouteMeta({
  title,
  description = DEFAULT_SITE_DESCRIPTION,
  canonicalPath,
  imagePath = DEFAULT_OG_IMAGE_PATH,
  robots = 'index, follow',
}: RouteMetaProps) {
  const canonical = toAbsoluteUrl(canonicalPath)
  const image = toAbsoluteUrl(imagePath)
  const documentTitle = `${title} | ${DEFAULT_SITE_TITLE}`

  return (
    <Helmet>
      <title>{documentTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={DEFAULT_SITE_TITLE} />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={documentTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
