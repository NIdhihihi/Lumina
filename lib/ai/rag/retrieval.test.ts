import { describe, it, expect } from "vitest";
import { indexNotes } from "./vector-store";
import { retrieveRelevantChunks } from "./retrieval";
import { runCopilot } from "@/lib/ai/orchestrator";
import type { Note } from "@/lib/types";

describe("Offline Second Brain RAG Retrieval (TensorFlow.js)", () => {
  const testNotes: Note[] = [
    {
      id: "note-1",
      title: "Academic Policy Handbook",
      content: "Official college attendance rules.",
      attachments: [
        {
          name: "Handbook.pdf",
          approxPage: 12,
          textContent: "Section 4.2: All students must maintain a minimum attendance of 75 percent in each course.",
        },
      ],
    },
    {
      id: "note-2",
      title: "Theory of Computation",
      content: "Automata and formal languages.",
      attachments: [
        {
          name: "Automata.pdf",
          approxPage: 126,
          textContent: "The Pumping Lemma for regular languages states that any sufficiently long string can be pumped.",
        },
      ],
    },
  ];

  it("indexes notes with TensorFlow.js vectors and retrieves relevant chunk with page number", async () => {
    const indexResult = await indexNotes(testNotes);
    expect(indexResult.indexed).toBeGreaterThan(0);

    const retrieval = await retrieveRelevantChunks("attendance 75 percent requirement", 2);
    expect(retrieval.chunks.length).toBeGreaterThan(0);
    const chunkWithPage = retrieval.chunks.find((c) => c.approxPage !== undefined);
    expect(chunkWithPage).toBeDefined();
    expect(chunkWithPage?.approxPage).toBe(12);
  });

  it("runs offline copilot and returns offline shield response without cloud AI", async () => {
    const res = await runCopilot("What is the pumping lemma for regular languages?");
    expect(res.aiUnavailable).toBe(false);
    expect(res.response).toContain("Offline Second Brain");
    expect(res.sources.length).toBeGreaterThan(0);
  });
});
