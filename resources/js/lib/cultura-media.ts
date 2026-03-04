type CulturaImageLike = {
  imagen_url?: string | null;
  imagen_banner?: string | null;
  contenido_json?: unknown;
};

export function normalizeCulturaImageUrl(value?: string | null): string | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const raw = value.trim();

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);

      if (url.pathname.startsWith('/media/cultura/')) {
        return `${url.pathname}${url.search}`;
      }

      if (url.pathname.startsWith('/storage/')) {
        return `/media/cultura/${url.pathname.slice('/storage/'.length)}${url.search}`;
      }

      return raw;
    } catch {
      return raw;
    }
  }

  if (raw.startsWith('/media/cultura/')) {
    return raw;
  }

  if (raw.startsWith('media/cultura/')) {
    return `/${raw}`;
  }

  if (raw.startsWith('/storage/')) {
    return `/media/cultura/${raw.slice('/storage/'.length)}`;
  }

  if (raw.startsWith('storage/')) {
    return `/media/cultura/${raw.slice('storage/'.length)}`;
  }

  if (raw.startsWith('/cultura/')) {
    return `/media/cultura/${raw.slice(1)}`;
  }

  if (raw.startsWith('cultura/')) {
    return `/media/cultura/${raw}`;
  }

  return raw.startsWith('/') ? raw : `/media/cultura/${raw}`;
}

export function extractFirstImageFromEditorJS(json: unknown): string | null {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;

    if (!parsed || typeof parsed !== 'object' || !('blocks' in parsed)) {
      return null;
    }

    const blocks = (parsed as { blocks?: Array<{ type?: string; data?: { file?: { url?: string } } }> }).blocks ?? [];
    const imageBlock = blocks.find((block) => block?.type === 'image');
    const imageUrl = imageBlock?.data?.file?.url;

    return normalizeCulturaImageUrl(imageUrl) ?? imageUrl ?? null;
  } catch {
    return null;
  }
}

export function resolveCulturaImageUrl(item: CulturaImageLike, fallback: string): string {
  return (
    normalizeCulturaImageUrl(item.imagen_url) ||
    extractFirstImageFromEditorJS(item.contenido_json) ||
    normalizeCulturaImageUrl(item.imagen_banner) ||
    fallback
  );
}
