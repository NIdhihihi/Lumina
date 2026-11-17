import * as tf from "@tensorflow/tfjs";

export type EmbeddingResult =
  | { ok: true; vector: number[] }
  | { ok: false; error: string };

const EMBEDDING_DIM = 256;

function getEmbeddingConfig() {
  return {
    provider: (process.env.EMBEDDING_PROVIDER || "local").toLowerCase(),
    apiKey: process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY || "",
    model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  };
}

/**
 * 32-bit FNV-1a hash algorithm for deterministic subword hashing
 */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Generates local on-device dense embeddings using subword n-grams and TensorFlow.js tensor math.
 * 100% offline, privacy-first, zero data leaves the device.
 */
export function embedTensorFlow(text: string): EmbeddingResult {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return { ok: true, vector: new Array(EMBEDDING_DIM).fill(0) };
  }

  try {
    const vector = tf.tidy(() => {
      const rawVector = new Float32Array(EMBEDDING_DIM);
      const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
      const words = clean.split(/\s+/).filter(Boolean);

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordHash = fnv1a(word);
        const wordDim = wordHash % EMBEDDING_DIM;
        const wordSign = (wordHash & 0x80000000) === 0 ? 1 : -1;
        rawVector[wordDim] += wordSign * 1.5;

        // Character 3-grams for subword morphology
        if (word.length >= 3) {
          for (let j = 0; j <= word.length - 3; j++) {
            const gram = word.slice(j, j + 3);
            const gramHash = fnv1a(gram);
            const dim = gramHash % EMBEDDING_DIM;
            const sign = (gramHash & 0x80000000) === 0 ? 1 : -1;
            rawVector[dim] += sign * 0.8;
          }
        }

        // Character 4-grams for technical terminology
        if (word.length >= 4) {
          for (let j = 0; j <= word.length - 4; j++) {
            const gram4 = word.slice(j, j + 4);
            const gramHash4 = fnv1a(gram4);
            const dim4 = gramHash4 % EMBEDDING_DIM;
            const sign4 = (gramHash4 & 0x80000000) === 0 ? 1 : -1;
            rawVector[dim4] += sign4 * 0.5;
          }
        }
      }

      // TensorFlow.js tensor creation and L2 unit-sphere normalization
      const tensor = tf.tensor1d(rawVector);
      const norm = tf.norm(tensor);
      const normVal = norm.dataSync()[0];

      if (normVal === 0) {
        return Array.from(rawVector);
      }

      const normalized = tf.div(tensor, norm);
      return Array.from(normalized.dataSync());
    });

    return { ok: true, vector };
  } catch (error: any) {
    return { ok: false, error: error?.message || "TensorFlow.js embedding generation failed." };
  }
}

async function embedOpenAI(text: string, apiKey: string, model: string): Promise<EmbeddingResult> {
  if (!apiKey) {
    return embedTensorFlow(text);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: text }),
    });

    if (!response.ok) {
      // Graceful fallback to offline TensorFlow.js
      return embedTensorFlow(text);
    }

    const data = await response.json();
    const vector = data.data?.[0]?.embedding;
    if (!Array.isArray(vector)) {
      return embedTensorFlow(text);
    }
    return { ok: true, vector };
  } catch {
    // If offline or network error in basement, use local TF.js
    return embedTensorFlow(text);
  }
}

async function embedOllama(text: string, baseUrl: string): Promise<EmbeddingResult> {
  try {
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
    });

    if (!response.ok) {
      return embedTensorFlow(text);
    }

    const data = await response.json();
    if (!Array.isArray(data.embedding)) {
      return embedTensorFlow(text);
    }
    return { ok: true, vector: data.embedding };
  } catch {
    return embedTensorFlow(text);
  }
}

export async function embedText(text: string): Promise<EmbeddingResult> {
  const { provider, apiKey, model, ollamaBaseUrl } = getEmbeddingConfig();

  switch (provider) {
    case "openai":
      return embedOpenAI(text, apiKey, model);
    case "ollama":
      return embedOllama(text, ollamaBaseUrl);
    case "local":
    case "tensorflow":
    case "tfjs":
    default:
      return embedTensorFlow(text);
  }
}

export async function embedTexts(texts: string[]): Promise<EmbeddingResult[] | { ok: false; error: string }> {
  const results: EmbeddingResult[] = [];
  for (const text of texts) {
    const result = await embedText(text);
    if (!result.ok) return result;
    results.push(result);
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  
  return tf.tidy(() => {
    const tA = tf.tensor1d(a);
    const tB = tf.tensor1d(b);
    const dot = tf.dot(tA, tB).dataSync()[0];
    const normA = tf.norm(tA).dataSync()[0];
    const normB = tf.norm(tB).dataSync()[0];
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
  });
}
