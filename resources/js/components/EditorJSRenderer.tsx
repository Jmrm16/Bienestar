import { OutputData } from '@editorjs/editorjs';
import { useEffect, useRef } from 'react';
import edjsHTML from 'editorjs-html';

interface Props {
  data: OutputData;
}

export default function EditorJSRenderer({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const edjsParser = edjsHTML();
    const parsed = edjsParser.parse(data); // 👈 Devuelve un array de strings

    if (Array.isArray(parsed)) {
      containerRef.current.innerHTML = parsed.join('');
    } else {
      containerRef.current.innerHTML = parsed; // fallback
    }
  }, [data]);

  return <div ref={containerRef} />;
}
