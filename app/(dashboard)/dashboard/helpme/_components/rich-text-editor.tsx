"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Strikethrough } from "lucide-react";
import { useEffect } from "react";

interface RichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	disabled?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: false,
				codeBlock: false,
			}),
			Link.configure({
				openOnClick: false,
				autolink: true,
				HTMLAttributes: {
					rel: "noopener noreferrer nofollow",
					target: "_blank",
				},
			}),
		],
		content: value,
		editable: !disabled,
		editorProps: {
			attributes: {
				class:
					"prose prose-sm dark:prose-invert max-w-none min-h-[120px] px-4 py-3 focus:outline-none",
				"data-placeholder": placeholder ?? "",
			},
		},
		onUpdate: ({ editor: e }) => {
			onChange(e.getHTML());
		},
	});

	useEffect(() => {
		if (!editor) return;
		if (value === editor.getHTML()) return;
		editor.commands.setContent(value || "", { emitUpdate: false });
	}, [editor, value]);

	if (!editor) {
		return (
			<div className="min-h-[160px] rounded-xl border border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-white/5" />
		);
	}

	function promptLink() {
		if (!editor) return;
		const prev = editor.getAttributes("link").href as string | undefined;
		const url = window.prompt("Link URL", prev ?? "https://");
		if (url === null) return;
		if (url === "") {
			editor.chain().focus().unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}

	return (
		<div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/30 dark:border-white/10 dark:bg-white/5">
			<div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white/50 px-2 py-1.5 dark:border-white/10 dark:bg-white/5">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive("bold")}
					label="Bold"
				>
					<Bold size={16} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive("italic")}
					label="Italic"
				>
					<Italic size={16} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleStrike().run()}
					active={editor.isActive("strike")}
					label="Strikethrough"
				>
					<Strikethrough size={16} />
				</ToolbarButton>
				<div className="mx-1 h-5 w-px bg-gray-200 dark:bg-white/10" />
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive("bulletList")}
					label="Bullet list"
				>
					<List size={16} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive("orderedList")}
					label="Ordered list"
				>
					<ListOrdered size={16} />
				</ToolbarButton>
				<div className="mx-1 h-5 w-px bg-gray-200 dark:bg-white/10" />
				<ToolbarButton onClick={promptLink} active={editor.isActive("link")} label="Link">
					<LinkIcon size={16} />
				</ToolbarButton>
			</div>
			<EditorContent editor={editor} />
		</div>
	);
}

function ToolbarButton({
	onClick,
	active,
	label,
	children,
}: {
	onClick: () => void;
	active: boolean;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			aria-pressed={active}
			className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-200/60 dark:hover:bg-white/10 ${
				active ? "bg-gray-200/80 text-foreground dark:bg-white/15" : ""
			}`}
		>
			{children}
		</button>
	);
}
