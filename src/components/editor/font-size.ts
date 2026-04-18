import { Mark } from "@tiptap/core";

/**
 * Minimal FontSize mark on top of TextStyle so users can pick a size from a toolbar.
 * Stored as inline style: <span style="font-size: 18px">...</span>
 */
export const FontSize = Mark.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) => (attrs.size ? { style: `font-size: ${attrs.size}` } : {}),
      },
    };
  },
  parseHTML() { return [{ style: "font-size" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", HTMLAttributes, 0]; },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) => chain().setMark(this.name, { size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) => chain().unsetMark(this.name).run(),
    } as any;
  },
});
