import { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import ImageTool from "@editorjs/image";
import List from "@editorjs/list";
// @ts-ignore
import Embed from "@editorjs/embed";

interface EditorCulturaProps {
  data: any;
  onChange: (data: any) => void;
}

export default function EditorCultura({ data, onChange }: EditorCulturaProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holder = "editorjs";

  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = new EditorJS({
        holder,
        autofocus: true,
        data: typeof data === 'string' ? JSON.parse(data) : data || {},
        tools: {
          header: Header,
          paragraph: Paragraph,
          list: List,
          embed: Embed,
        image: {
        class: ImageTool,
        config: {
            endpoints: {
            byFile: "/culturas/upload-image",
            },
            additionalRequestHeaders: {
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            'X-Requested-With': 'XMLHttpRequest',
            },
        },
        },


        },
        onChange: async () => {
          const savedData = await editorRef.current?.save();
          if (savedData) {
            onChange(savedData);
          }
        },
      });
    }

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  return <div id={holder} className="prose max-w-full border rounded-md p-4 bg-white dark:bg-zinc-900" />;
}
