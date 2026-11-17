export type EmbeddingResult =
  | { ok: true; vector: number[] }
  | { ok: false; error: string };

function getEmbeddingConfig() {
  return {
    provider: (process.env.EMBEDDING_PROVIDER || "openai").toLowerCase(),
    apiKey: process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY || "",
    model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  };
}

async function embedOpenAI(text: string, apiKey: string, model: string): Promise<EmbeddingResult> {
  if (!apiKey) {
    return { ok: false, error: "Embedding API key is not configured. Set EMBEDDING_API_KEY or AI_API_KEY." };
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: `OpenAI embeddings error: ${response.status} ${body.slice(0, 200)}` };
  }

  const data = await response.json();
  const vector = data.data?.[0]?.embedding;
  if (!Array.isArray(vector)) {
    return { ok: false, error: "OpenAI embeddings returned an invalid vector." };
  }
  return { ok: true, vector };
}

async function embedOllama(text: string, baseUrl: string): Promise<EmbeddingResult> {
  try {
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
    });

    if (!response.ok) {
      return { ok: false, error: "Ollama embeddings unavailable." };
    }

    const data = await response.json();
    if (!Array.isArray(data.embedding)) {
      return { ok: false, error: "Ollama embeddings returned an invalid vector." };
    }
    return { ok: true, vector: data.embedding };
  } catch {
    return { ok: false, error: "Ollama embeddings unreachable." };
  }
}

export async function embedText(text: string): Promise<EmbeddingResult> {
  const { provider, apiKey, model, ollamaBaseUrl } = getEmbeddingConfig();

  switch (provider) {
    case "openai":
      return embedOpenAI(text, apiKey, model);
    case "ollama":
      return embedOllama(text, ollamaBaseUrl);
    default:
      return { ok: false, error: `Unsupported embedding provider: ${provider}` };
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
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
