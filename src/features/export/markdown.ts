type JSONNode = {
  type?: string;
  attrs?: Record<string, any>;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  content?: JSONNode[];
};

const escapeMd = (s: string) => s.replace(/[<>*_`~|]/g, (m) => `\\${m}`);

function renderText(node: JSONNode): string {
  let text = node.text || '';
  const marks = node.marks || [];
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        text = `**${text}**`;
        break;
      case 'italic':
        text = `_${text}_`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'strike':
        text = `~~${text}~~`;
        break;
      case 'link':
        text = `[${text}](${mark.attrs?.href || '#'})`;
        break;
      default:
        break;
    }
  }
  return escapeMd(text);
}

function renderInline(nodes: JSONNode[] = []): string {
  return nodes
    .map((n) => (n.type === 'text' ? renderText(n) : n.type ? renderNode(n) : ''))
    .join('');
}

function renderList(nodes: JSONNode[] = [], ordered = false, depth = 0): string {
  const lines: string[] = [];
  nodes.forEach((n, i) => {
    if (n.type !== 'listItem') return;
    const bullet = ordered ? `${i + 1}.` : '-';
    const paragraph = (n.content || []).find((c) => c.type === 'paragraph');
    const rest = (n.content || []).filter((c) => c !== paragraph);
    const prefix = '  '.repeat(depth) + bullet + ' ';
    if (paragraph) lines.push(prefix + renderInline(paragraph.content));
    rest.forEach((child) => {
      if (child.type === 'bulletList') lines.push(renderList(child.content, false, depth + 1));
      if (child.type === 'orderedList') lines.push(renderList(child.content, true, depth + 1));
      if (child.type === 'paragraph') lines.push('  '.repeat(depth + 1) + renderInline(child.content));
    });
  });
  return lines.join('\n');
}

function renderNode(node: JSONNode): string {
  switch (node.type) {
    case 'heading': {
      const level = Math.max(1, Math.min(6, node.attrs?.level || 1));
      return `${'#'.repeat(level)} ${renderInline(node.content)}\n\n`;
    }
    case 'paragraph':
      return `${renderInline(node.content)}\n\n`;
    case 'blockquote':
      return renderInline(node.content)
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n') + '\n\n';
    case 'codeBlock':
    case 'code_block':
      return '```\n' + (node.content || []).map((n) => n.text || '').join('') + '\n```\n\n';
    case 'bulletList':
      return renderList(node.content, false) + '\n';
    case 'orderedList':
      return renderList(node.content, true) + '\n';
    case 'hardBreak':
      return '  \n';
    case 'image': {
      const alt = node.attrs?.alt || 'image';
      const src = node.attrs?.src || '';
      return `![${alt}](${src})\n\n`;
    }
    default:
      // Fallback: render children
      return renderInline(node.content);
  }
}

export function tiptapJsonToMarkdown(doc: JSONNode): string {
  if (!doc || !Array.isArray(doc.content)) return '';
  return doc.content.map(renderNode).join('').trim() + '\n';
}


