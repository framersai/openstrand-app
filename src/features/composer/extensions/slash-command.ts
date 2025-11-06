import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

type CommandItem = {
  title: string;
  keywords?: string[];
  command: (props: { editor: any; range: { from: number; to: number } }) => void;
};

const commands: CommandItem[] = [
  {
    title: 'Heading 1',
    keywords: ['h1', 'title'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    keywords: ['h2', 'subtitle'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Bullet List',
    keywords: ['ul', 'list'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Checklist',
    keywords: ['tasks', 'todo'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Quote',
    keywords: ['blockquote', 'quote'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setBlockquote().run(),
  },
  {
    title: 'Code Block',
    keywords: ['code'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
  {
    title: 'Template: Note',
    keywords: ['note', 'template'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent(
        `# Note Title\n\nA one-line summary.\n\n## Key points\n- Point 1\n- Point 2\n\n## Next steps\n- [ ] Task 1\n- [ ] Task 2\n`
      ).run();
    },
  },
  {
    title: 'Template: Lesson',
    keywords: ['lesson', 'education', 'template'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent(
        `# Lesson Title\n\n## Objectives\n- Objective 1\n- Objective 2\n\n## Explanation\nDescribe the concept...\n\n## Practice\n1. Exercise A\n2. Exercise B\n`
      ).run();
    },
  },
  {
    title: 'Template: Dataset',
    keywords: ['dataset', 'data', 'template'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent(
        `## Dataset Summary\nSource: ...  Format: CSV\n\n\`\`\`json\n{\n  "schema": { "fields": ["id", "name", "value"] },\n  "rows": 0\n}\n\`\`\`\n`
      ).run();
    },
  },
];

export const SlashCommand = Extension.create({
  name: 'slash-command',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        allowSpaces: true,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase();
          return commands.filter((item) => {
            return (
              item.title.toLowerCase().includes(q) ||
              (item.keywords || []).some((k) => k.toLowerCase().includes(q))
            );
          }).slice(0, 8);
        },
        render: () => {
          let el: HTMLDivElement;
          return {
            onStart: (props: any) => {
              el = document.createElement('div');
              el.className = 'z-50 rounded-md border border-border/60 bg-popover p-1 shadow-lg';
              Object.assign(el.style, {
                position: 'absolute',
                left: `${props.clientRect().left}px`,
                top: `${(props.clientRect().bottom || 0) + 4}px`,
              });
              document.body.appendChild(el);
              renderList(el, props);
            },
            onUpdate: (props: any) => {
              Object.assign(el.style, {
                left: `${props.clientRect().left}px`,
                top: `${(props.clientRect().bottom || 0) + 4}px`,
              });
              renderList(el, props);
            },
            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                props.event.preventDefault();
                props.command('close');
                return true;
              }
              return false;
            },
            onExit: () => {
              el?.remove();
            },
          };
        },
        command: ({ editor, range, props }: any) => {
          (props as CommandItem).command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    // @ts-ignore - Suggestion plugin typing
    return [Suggestion(this.options.suggestion)];
  },
});

function renderList(container: HTMLDivElement, props: any) {
  const { items, selected } = props;
  container.innerHTML = '';
  const ul = document.createElement('ul');
  ul.className = 'max-h-64 w-64 overflow-auto';
  items.forEach((item: CommandItem, index: number) => {
    const li = document.createElement('li');
    li.className = `cursor-pointer rounded px-2 py-1 text-sm ${index === selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`;
    li.textContent = item.title;
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      props.command(item);
    });
    ul.appendChild(li);
  });
  container.appendChild(ul);
}


