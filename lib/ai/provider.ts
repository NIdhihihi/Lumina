export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CompletionOptions = {
  temperature?: number;
  maxTokens?: number;
};

export type CompletionResult =
  | { ok: true; content: string }
  | { ok: false; error: string; code: "MISSING_KEY" | "PROVIDER_ERROR" | "UNSUPPORTED" };

function getProviderConfig() {
  return {
    provider: (process.env.AI_PROVIDER || "anthropic").toLowerCase(),
    apiKey: process.env.AI_API_KEY || "",
    model: process.env.AI_MODEL || "claude-sonnet-4-6",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  };
}

async function callAnthropic(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  opts: CompletionOptions
): Promise<CompletionResult> {
  if (!apiKey) {
    return { ok: false, error: "AI API key is not configured. Set AI_API_KEY in your environment.", code: "MISSING_KEY" };
  }

  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.3,
      system: system || undefined,
      messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: `Anthropic API error: ${response.status} ${body.slice(0, 200)}`, code: "PROVIDER_ERROR" };
  }

  const data = await response.json();
  const text = data.content?.map((block: { text?: string }) => block.text).join("") ?? "";
  return { ok: true, content: text };
}

async function callOpenAI(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  opts: CompletionOptions
): Promise<CompletionResult> {
  if (!apiKey) {
    return { ok: false, error: "AI API key is not configured. Set AI_API_KEY in your environment.", code: "MISSING_KEY" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 1024,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: `OpenAI API error: ${response.status} ${body.slice(0, 200)}`, code: "PROVIDER_ERROR" };
  }

  const data = await response.json();
  return { ok: true, content: data.choices?.[0]?.message?.content ?? "" };
}

async function callOllama(
  messages: ChatMessage[],
  model: string,
  baseUrl: string,
  opts: CompletionOptions
): Promise<CompletionResult> {
  const prompt = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "llama3",
        prompt,
        stream: false,
        options: { temperature: opts.temperature ?? 0.3 },
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: "Ollama is not responding. Start Ollama locally or switch AI_PROVIDER to anthropic/openai.",
        code: "PROVIDER_ERROR",
      };
    }

    const data = await response.json();
    return { ok: true, content: data.response ?? "" };
  } catch {
    return {
      ok: false,
      error: "Ollama is not reachable. Start Ollama locally or switch AI_PROVIDER to anthropic/openai.",
      code: "PROVIDER_ERROR",
    };
  }
}

export async function generateCompletion(
  messages: ChatMessage[],
  opts: CompletionOptions = {}
): Promise<CompletionResult> {
  const { provider, apiKey, model, ollamaBaseUrl } = getProviderConfig();

  switch (provider) {
    case "anthropic":
      return callAnthropic(messages, model, apiKey, opts);
    case "openai":
      return callOpenAI(messages, model, apiKey, opts);
    case "ollama":
      return callOllama(messages, model, ollamaBaseUrl, opts);
    default:
      return { ok: false, error: `Unsupported AI provider: ${provider}`, code: "UNSUPPORTED" };
  }
}
