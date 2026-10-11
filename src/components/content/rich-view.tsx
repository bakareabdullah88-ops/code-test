import type { ReactNode } from 'react';
import type { RichDoc, RichNode } from '@/types';

function renderNode(n: RichNode, key: number): ReactNode {
  const kids = n.content?.map((c, i) => renderNode(c, i));
  switch (n.type) {
    case 'text': {
      let el: ReactNode = n.text;
      for (const m of n.marks ?? []) {
        if (m.type === 'bold') el = <strong key={key}>{el}</strong>;
        else if (m.type === 'italic') el = <em key={key}>{el}</em>;
      }
      return <span key={key}>{el}</span>;
    }
    case 'paragraph': return <p key={key}>{kids}</p>;
    case 'heading': return <h3 key={key}>{kids}</h3>;
    case 'blockquote': return <blockquote key={key}>{kids}</blockquote>;
    case 'bulletList': return <ul key={key} className="list-disc ps-6">{kids}</ul>;
    case 'orderedList': return <ol key={key} className="list-decimal ps-6">{kids}</ol>;
    case 'listItem': return <li key={key}>{kids}</li>;
    case 'hardBreak': return <br key={key} />;
    default: return <span key={key}>{kids}</span>;
  }
}

/** Renders stored rich text. The schema is limited, so nothing is injected as HTML. */
export function RichView({ doc, className }: { doc: RichDoc; className?: string }) {
  return <div className={className ?? 'prose-reading'}>{doc.content.map((n, i) => renderNode(n, i))}</div>;
}
