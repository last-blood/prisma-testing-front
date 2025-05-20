// src/components/RichTextEditor.tsx
"use client";

import "highlight.js/styles/github-dark.css"; // for code block highlighting

import React, { useEffect } from "react"; // useEffect can be removed if not used elsewhere
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
// import { ColumnExtension } from "@gocapsule/column-extension"; // Uncomment if you use this

import { createLowlight } from "lowlight";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";

import MenuBar from "./MenuBar"; // Ensure this path is correct

// --- Setup syntax highlighting ---
const lowlight = createLowlight();
lowlight.register({ xml });
lowlight.register({ css });
lowlight.register({ javascript });
lowlight.register({ typescript });
lowlight.registerAlias({ xml: ["html"] });

// --- Props Interface ---
interface RichTextEditorProps {
  initialContent?: string; // Optional initial content
  onChange: (htmlContent: string) => void; // Callback for content changes
}

function RichTextEditor({
  initialContent = "",
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We replace StarterKit's codeBlock with CodeBlockLowlight
        heading: {
          // Configure heading levels within StarterKit
          levels: [1, 2, 3],
        },
        // bulletList, orderedList, listItem will use their defaults from StarterKit
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      Image, // Ensure you have a way to upload/manage images if you use this
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: "https",
      }),
      Color,
      TextStyle,
      Underline,
      // ColumnExtension, // Uncomment if you use this
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[50vh] p-5 rounded-lg bg-white/5 text-white prose-invert", // Added prose-invert for better dark mode compatibility with Tailwind Typography
      },
    },
    onUpdate: ({ editor: currentEditor }: { editor: Editor }) => {
      // console.log("HTML:", currentEditor.getHTML()); // Debugging output
      onChange(currentEditor.getHTML()); // Call the passed onChange function
    },
    immediatelyRender: false, // To avoid SSR hydration mismatches
  });

  useEffect(() => {
    if (editor && editor.isEditable) {
      const currentEditorHTML = editor.getHTML();
      // Only update if the prop is different from current content
      if (currentEditorHTML !== initialContent) {
        // If initialContent is "" and the editor is just an empty paragraph,
        // Tiptap might represent this as "<p></p>".
        // We explicitly tell it to set the content to the new initialContent.
        editor.commands.setContent(initialContent, false); // 'false' prevents emitting an update event
      }
    }
  }, [initialContent, editor]); // Depend on initialContent and editor instance
  // It's also good practice to destroy the editor instance on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return null; // Or a loading indicator
  }
  return (
    <div className="flex flex-col gap-3 w-full ">
      {/* Toolbar */}
      <MenuBar editor={editor} />
      {/* Editor */}
      <div className="rounded-lg border border-white/20">
        <EditorContent editor={editor} />{" "}
      </div>
    </div>
  );
}

export default RichTextEditor;
