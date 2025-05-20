"use client";

import React, { useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuBold,
  LuItalic,
  LuStrikethrough,
  LuHighlighter,
  LuAlignLeft,
  LuAlignCenter,
  LuAlignRight,
  LuAlignJustify,
  LuText,
  LuList,
  LuListOrdered,
  LuCheck,
  LuQuote,
  LuCode,
  LuMinus,
  LuUndo,
  LuRedo,
  LuImage,
  LuCornerDownLeft,
  LuLink,
  LuPaintbrush,
  LuTable,
  LuTrash,
  LuColumns2,
  LuRows2,
  LuUnderline,
} from "react-icons/lu";

function IconButton({ onClick, active, Icon, label }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition ${
        active ? "bg-blue-500 text-white" : "hover:bg-white/20"
      }`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function ColorPicker({ editor }: { editor: Editor }) {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setColor(e.target.value).run();
  };
  return (
    <div className="flex items-center gap-1">
      <LuPaintbrush className="w-5 h-5" />
      <input
        type="color"
        onInput={handleColorChange}
        value={editor.getAttributes("textStyle").color || "#ffffff"}
        className="w-6 h-6 cursor-pointer bg-transparent border-none"
      />
    </div>
  );
}

function MenuBar({ editor }: { editor: Editor | null }) {
  // --- FIX: Moved useCallback Hooks to the top ---
  const addImage = useCallback(() => {
    // Original logic: relies on 'editor' being non-null if called.
    // The 'if (!editor) return null;' below will prevent UI that uses this from rendering.
    const url = window.prompt("Image URL:");
    if (
      editor &&
      url &&
      (url.startsWith("http://") || url.startsWith("https://"))
    ) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    // Original logic: relies on 'editor' being non-null.
    if (!editor) return; // Added guard for safety if somehow called when editor is null, though UI should prevent this.
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL", previous);
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    // Original logic: relies on 'editor' being non-null.
    if (!editor) return; // Added guard for safety.
    const rows = parseInt(window.prompt("Rows:", "3") || "3", 10);
    const cols = parseInt(window.prompt("Cols:", "3") || "3", 10);
    if (!isNaN(rows) && !isNaN(cols)) {
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
    }
  }, [editor]);
  // --- End of Hook declarations ---

  if (!editor) return null; // This conditional return is now AFTER all Hook calls

  return (
    <div className="menu-bar flex flex-wrap gap-1">
      <IconButton
        onClick={() => editor.chain().focus().toggleMark("underline").run()}
        active={editor.isActive("underline")}
        Icon={LuUnderline}
        label="Underline"
      />
      {/* Text */}
      <IconButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive("paragraph")}
        Icon={LuText}
        label="Paragraph"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        Icon={LuHeading1}
        label="H1"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        Icon={LuHeading2}
        label="H2"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        Icon={LuHeading3}
        label="H3"
      />
      {/* Formatting */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        Icon={LuBold}
        label="Bold"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        Icon={LuItalic}
        label="Italic"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        Icon={LuStrikethrough}
        label="Strike"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive("highlight")}
        Icon={LuHighlighter}
        label="Highlight"
      />
      <ColorPicker editor={editor} />
      {/* Lists */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        Icon={LuList}
        label="Bullet List"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        Icon={LuListOrdered}
        label="Ordered List"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
        Icon={LuCheck}
        label="Task List"
      />
      {/* Blocks */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        Icon={LuQuote}
        label="Quote"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        Icon={LuCode}
        label="Code Block"
      />
      {/* Insertions */}
      <IconButton
        onClick={setLink}
        active={editor.isActive("link")}
        Icon={LuLink}
        label="Link"
      />
      <IconButton
        onClick={addImage}
        active={false} // Assuming active state for addImage is always false or managed differently
        Icon={LuImage}
        label="Image"
      />
      <IconButton
        onClick={insertTable}
        active={false} // Assuming active state for insertTable is always false
        Icon={LuTable}
        label="Insert Table"
      />
      <IconButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        Icon={LuMinus}
        label="Divider"
      />
      <IconButton
        onClick={() => editor.chain().focus().setHardBreak().run()}
        active={false}
        Icon={LuCornerDownLeft}
        label="Break"
      />
      {/* Table Actions */}
      <IconButton
        onClick={() => editor.chain().focus().deleteTable().run()}
        active={false} // Consider editor.can().deleteTable() for active/disabled state
        Icon={LuTrash}
        label="Delete Table"
      />
      <IconButton
        onClick={() => editor.chain().focus().deleteRow().run()}
        active={false} // Consider editor.can().deleteRow()
        Icon={LuRows2}
        label="Delete Row"
      />
      <IconButton
        onClick={() => editor.chain().focus().deleteColumn().run()}
        active={false} // Consider editor.can().deleteColumn()
        Icon={LuColumns2}
        label="Delete Column"
      />
      {/* Alignment */}
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={
          editor.isActive({ textAlign: "left" }) ||
          (!editor.isActive({ textAlign: "center" }) &&
            !editor.isActive({ textAlign: "right" }) &&
            !editor.isActive({ textAlign: "justify" }))
        }
        Icon={LuAlignLeft}
        label="Align Left"
      />
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        Icon={LuAlignCenter}
        label="Center"
      />
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        Icon={LuAlignRight}
        label="Align Right"
      />
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        active={editor.isActive({ textAlign: "justify" })}
        Icon={LuAlignJustify}
        label="Justify"
      />
      {/* History */}
      <IconButton
        onClick={() => editor.chain().focus().undo().run()}
        active={false} // Consider !editor.can().undo() for disabled state
        Icon={LuUndo}
        label="Undo"
      />
      <IconButton
        onClick={() => editor.chain().focus().redo().run()}
        active={false} // Consider !editor.can().redo() for disabled state
        Icon={LuRedo}
        label="Redo"
      />
      {/* <button onClick={() => editor?.commands.setColumns(2)}>
        Add 2 Columns
      </button>
      <button onClick={() => editor?.commands.unsetColumns()}>
        Remove Columns
      </button> */}
    </div>
  );
}

export default MenuBar;
