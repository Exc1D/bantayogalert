import { Helmet } from 'react-helmet-async'

export interface PrivateRouteMetaProps {
  title?: string
}

export function PrivateRouteMeta({
  title = 'Secure workspace',
}: PrivateRouteMetaProps) {
  return (
    <Helmet>
      <title>{`${title} | Bantayog Alert`}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  )
}
