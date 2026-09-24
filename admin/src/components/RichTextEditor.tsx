import { useEffect } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export default function RichTextEditor({ value, onChange, disabled = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'document-editor',
        'aria-label': 'Reply message',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) =>
      instance
        ? {
            bold: instance.isActive('bold'),
            italic: instance.isActive('italic'),
            underline: instance.isActive('underline'),
            strike: instance.isActive('strike'),
            bulletList: instance.isActive('bulletList'),
            orderedList: instance.isActive('orderedList'),
            canUndo: instance.can().undo(),
            canRedo: instance.can().redo(),
          }
        : null,
  });

  if (!editor || !state || disabled) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" aria-hidden="true" />;
  }

  const formattingButtons = [
    { label: 'Bold', Icon: Bold, active: state.bold, available: true, run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', Icon: Italic, active: state.italic, available: true, run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', Icon: UnderlineIcon, active: state.underline, available: true, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Strikethrough', Icon: Strikethrough, active: state.strike, available: true, run: () => editor.chain().focus().toggleStrike().run() },
    { label: 'Bulleted list', Icon: List, active: state.bulletList, available: true, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', Icon: ListOrdered, active: state.orderedList, available: true, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Undo', Icon: Undo2, active: false, available: state.canUndo, run: () => editor.chain().focus().undo().run() },
    { label: 'Redo', Icon: Redo2, active: false, available: state.canRedo, run: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1d2620]">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50/70 px-2 py-1.5 dark:border-white/10 dark:bg-white/5" role="toolbar" aria-label="Formatting">
        {formattingButtons.map(({ label, Icon, active, available, run }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={active}
            disabled={!available}
            onClick={run}
            className={`grid h-8 w-8 place-items-center rounded-lg transition disabled:opacity-40 ${
              active
                ? 'bg-gray-200 text-gray-900 dark:bg-white/15 dark:text-white'
                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
        <span className="ml-auto pr-1 text-[10px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">Document</span>
      </div>
      <div className="max-h-80 overflow-y-auto bg-[#eef0ea] p-4 dark:bg-[#141814]">
        <div className="mx-auto w-full max-w-[44rem] rounded-sm bg-white px-6 py-6 shadow-[0_1px_3px_rgb(15_23_42_/_0.12)] sm:px-10 sm:py-8 dark:bg-[#1f2a23] dark:shadow-[0_1px_3px_rgb(0_0_0_/_0.5)]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
