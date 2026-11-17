import type { Note, TextChunk } from "@/lib/types";

const APPROX_CHARS_PER_TOKEN = 4;
const CHUNK_SIZE_TOKENS = 500;
const CHUNK_OVERLAP_TOKENS = 80;

function splitIntoParagraphs(text: string): string[] {
  return text
   .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

function chunkText(
  text: string,
  metadataBase: Omit<TextChunk["metadata"], "chunkIndex">
): TextChunk[] {
  const chunkCharSize = CHUNK_SIZE_TOKENS * APPROX_CHARS_PER_TOKEN;
  const overlapCharSize = CHUNK_OVERLAP_TOKENS * APPROX_CHARS_PER_TOKEN;
  const chunks: TextChunk[] = [];

  let index = 0;
  let start = 0;

  while (start < text.length) {
    const end = Math.min(text.length, start + chunkCharSize);
    const slice = text.slice(start, end).trim();
    if (slice) {
      chunks.push({
        text: slice,
        metadata: {
          ...metadataBase,
          chunkIndex: index,
        },
      });
      index += 1;
    }
    if (end >= text.length) break;
    start = Math.max(start + 1, end - overlapCharSize);
  }

  return chunks;
}

export function chunkNote(note: Note): TextChunk[] {
  const chunks: TextChunk[] = [];

  if (note.content?.trim()) {
    chunks.push(
      ...chunkText(note.content, {
        noteId: note.id,
        noteTitle: note.title,
      })
    );
  }

  for (const attachment of note.attachments ?? []) {
    if (!attachment.textContent?.trim()) continue;
    chunks.push(
      ...chunkText(attachment.textContent, {
        noteId: note.id,
        noteTitle: note.title,
        attachmentName: attachment.name,
        approxPage: attachment.approxPage,
      })
    );
  }

  if (chunks.length === 0 && note.title.trim()) {
    chunks.push({
      text: note.title,
      metadata: {
        noteId: note.id,
        noteTitle: note.title,
        chunkIndex: 0,
      },
    });
  }

  return chunks;
}

export function chunkNotes(notes: Note[]): TextChunk[] {
  return notes.flatMap(chunkNote);
}

export function estimatePageFromOffset(fullText: string, offset: number, totalPages?: number): number | undefined {
  if (!totalPages || totalPages <= 0 || fullText.length === 0) return undefined;
  const ratio = offset / fullText.length;
  return Math.max(1, Math.min(totalPages, Math.ceil(ratio * totalPages)));
}

export function splitIntoParagraphChunks(text: string): string[] {
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length === 0) return [text];
  return paragraphs.filter((p) => estimateTokens(p) <= CHUNK_SIZE_TOKENS * 1.5);
}
