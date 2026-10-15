import ScrollReveal from '@/components/ScrollReveal';
import { isAllowedEmbed } from '@/lib/sanitize';

const RATIOS = { '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1' };

export default function Embed({ props, preview }) {
  if (!isAllowedEmbed(props.url)) {
    return preview ? <div className="cms-block-warning">Embed not shown: the URL is missing or its host is not allowed (YouTube, Vimeo, Google Maps over https).</div> : null;
  }
  return (
    <section className="section">
      <div className="container-narrow">
        <ScrollReveal>
          <div className="cms-embed" style={{ aspectRatio: RATIOS[props.ratio] || RATIOS['16:9'] }}>
            <iframe src={props.url} title={props.title} loading="lazy" allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
