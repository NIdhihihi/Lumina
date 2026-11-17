import type { SourceCitation } from "@/lib/types";
import { cosineSimilarity, embedText } from "./embeddings";
import { sanitizeRetrievedChunk } from "./guard";
import { loadVectors } from "./vector-store";

export type RetrievedChunk = SourceCitation & { score: number; text: string };

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 4
): Promise<{ chunks: RetrievedChunk[]; error?: string }> {
  const embedded = await embedText(query);
  if (!embedded.ok) {
    return { chunks: [], error: embedded.error };
  }

  const vectors = loadVectors();
  if (vectors.length === 0) {
    return { chunks: [] };
  }

  const ranked = vectors
    .map((record) => ({
      record,
      score: cosineSimilarity(embedded.vector, record.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const chunks: RetrievedChunk[] = [];
  for (const item of ranked) {
    const sanitized = sanitizeRetrievedChunk(item.record.metadata.text);
    if (sanitized.flagged) continue;
    chunks.push({
      noteId: item.record.metadata.noteId,
      noteTitle: item.record.metadata.noteTitle,
      attachmentName: item.record.metadata.attachmentName,
      approxPage: item.record.metadata.approxPage,
      snippet: sanitized.text.slice(0, 280),
      text: sanitized.text,
      score: item.score,
    });
  }

  return { chunks };
}

export function chunksToCitations(chunks: RetrievedChunk[]): SourceCitation[] {
  return chunks.map(({ noteId, noteTitle, attachmentName, approxPage, snippet }) => ({
    noteId,
    noteTitle,
    attachmentName,
    approxPage,
    snippet,
  }));
}
