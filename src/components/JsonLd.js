// Renders one or more JSON-LD objects. `<` is escaped so content can't break out of the script tag.
export default function JsonLd({ data }) {
  const items = Array.isArray(data) ? data : [data];
  return items.filter(Boolean).map((d, i) => (
    <script key={i} type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\\u003c') }} />
  ));
}
