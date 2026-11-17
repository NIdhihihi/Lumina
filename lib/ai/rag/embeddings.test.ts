import { describe, it, expect } from "vitest";
import { embedTensorFlow, cosineSimilarity, embedText } from "./embeddings";

describe("Local-First Offline TensorFlow.js Embeddings", () => {
  it("generates 256-dimensional normalized vector on-device", () => {
    const text = "All students must maintain 75% attendance for examinations.";
    const result = embedTensorFlow(text);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.vector).toHaveLength(256);
    // Vector should be unit length
    let sumSq = 0;
    for (const v of result.vector) {
      sumSq += v * v;
    }
    expect(Math.abs(Math.sqrt(sumSq) - 1.0)).toBeLessThan(0.01);
  });

  it("yields high cosine similarity for semantically related engineering concepts", () => {
    const textA = "minimum attendance threshold requirement of 75 percent";
    const textB = "must attend at least 75% of classes to qualify for exams";
    const unrelated = "making chocolate chip pancakes on sunday morning";

    const resA = embedTensorFlow(textA);
    const resB = embedTensorFlow(textB);
    const resUnrelated = embedTensorFlow(unrelated);

    expect(resA.ok && resB.ok && resUnrelated.ok).toBe(true);
    if (!resA.ok || !resB.ok || !resUnrelated.ok) return;

    const simRelated = cosineSimilarity(resA.vector, resB.vector);
    const simUnrelated = cosineSimilarity(resA.vector, resUnrelated.vector);

    expect(simRelated).toBeGreaterThan(simUnrelated);
    expect(simRelated).toBeGreaterThan(0.2);
  });

  it("embedText defaults gracefully to offline TensorFlow.js when no key is set", async () => {
    const res = await embedText("Theory of computation and finite state machines");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.vector.length).toBe(256);
  });
});
