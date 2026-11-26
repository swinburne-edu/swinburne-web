import { serializeJsonLd, type JsonLd as JsonLdData } from '@/lib/seo/jsonld'

export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] | null | undefined }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
