// Registry: block type -> renderer. Keys must match BLOCKS in src/lib/blocks/schemas.js.
import Hero from './Hero';
import RichText from './RichText';
import ImageText from './ImageText';
import Stats from './Stats';
import CardGrid from './CardGrid';
import CtaBanner from './CtaBanner';
import Faq from './Faq';
import DocumentList from './DocumentList';
import ComplianceTable from './ComplianceTable';
import ContactInfo from './ContactInfo';
import Embed from './Embed';

export const BLOCK_COMPONENTS = {
  hero: Hero,
  rich_text: RichText,
  image_text: ImageText,
  stats: Stats,
  card_grid: CardGrid,
  cta_banner: CtaBanner,
  faq: Faq,
  document_list: DocumentList,
  compliance_table: ComplianceTable,
  contact_info: ContactInfo,
  embed: Embed,
};
