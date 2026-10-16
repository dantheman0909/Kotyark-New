import './blocks.css';
import { BLOCK_COMPONENTS } from './index';

/**
 * Renders a page's block list. Unknown block types render nothing publicly and a warning in preview.
 * One failing block must not take the whole page down, so each renders independently.
 */
export default function BlockRenderer({ blocks, preview = false }) {
  if (!Array.isArray(blocks)) return null;
  return (
    <>
      {blocks.map((block, i) => {
        const Component = BLOCK_COMPONENTS[block?.type];
        const key = block?.id || i;
        if (!Component) {
          return preview ? <div key={key} className="cms-block-warning">Unknown block type: <code>{String(block?.type)}</code></div> : null;
        }
        return <Component key={key} props={block.props || {}} preview={preview} />;
      })}
    </>
  );
}
