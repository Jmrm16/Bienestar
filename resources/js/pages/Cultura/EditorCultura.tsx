import { useEffect, useRef } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
// @ts-expect-error The package does not expose compatible types in this project.
import Embed from '@editorjs/embed';

interface EditorCulturaProps {
  data: OutputData | string | null;
  onChange: (data: OutputData) => void;
}

function parseEditorData(data: OutputData | string | null): OutputData {
  const emptyContent: OutputData = {
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: '',
        },
      },
    ],
  };

  if (!data) {
    return emptyContent;
  }

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as OutputData;
      return parsed?.blocks?.length ? parsed : emptyContent;
    } catch {
      return emptyContent;
    }
  }

  return data?.blocks?.length ? data : emptyContent;
}

export default function EditorCultura({ data, onChange }: EditorCulturaProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const initialDataRef = useRef<OutputData>(parseEditorData(data));

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!holderRef.current || editorRef.current) {
      return;
    }

    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled || !holderRef.current || !document.body.contains(holderRef.current)) {
        return;
      }

      const editor = new EditorJS({
        holder: holderRef.current,
        autofocus: false,
        data: initialDataRef.current,
        tools: {
          header: Header,
          paragraph: Paragraph,
          list: List,
          embed: Embed,
          image: {
            class: ImageTool,
            config: {
              endpoints: {
                byFile: '/culturas/upload-image',
              },
              additionalRequestHeaders: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                'X-Requested-With': 'XMLHttpRequest',
              },
            },
          },
        },
        onChange: async () => {
          const savedData = await editor.save();
          onChangeRef.current(savedData);
        },
      });

      editorRef.current = editor;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);

      const instance = editorRef.current;
      editorRef.current = null;

      if (!instance) {
        return;
      }

      void instance.isReady
        .then(() => {
          instance.destroy();
        })
        .catch(() => {
          // En StrictMode puede desmontarse antes de que EditorJS termine de iniciar.
        });
    };
  }, []);

  return (
    <div
      ref={holderRef}
      className="prose min-h-64 max-w-full rounded-md border bg-white p-4 dark:bg-zinc-900"
    />
  );
}
