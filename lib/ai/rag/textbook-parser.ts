import type { NoteAttachment } from "@/lib/types";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

/**
 * Extracts text page by page from an uploaded textbook PDF using pdfjs-dist.
 * Runs completely client-side in the browser, keeping textbook content offline.
 */
export async function extractPagesFromPDF(file: File): Promise<ExtractedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await import("pdfjs-dist");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const pages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .filter(Boolean);
    const text = strings.join(" ").trim();
    if (text) {
      pages.push({ pageNumber: pageNum, text });
    }
  }

  return pages;
}

export function pagesToNoteAttachments(fileName: string, pages: ExtractedPage[]): NoteAttachment[] {
  return pages.map((p) => ({
    name: `${fileName} (Page ${p.pageNumber})`,
    textContent: p.text,
    approxPage: p.pageNumber,
  }));
}
