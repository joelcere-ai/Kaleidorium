/** Shared OpenAI Assistants runner for The Kurator (asst_KKXnbPckdCyhE2hUrxCaA9vM). */
export const KURATOR_ASSISTANT_ID = "asst_KKXnbPckdCyhE2hUrxCaA9vM"

const OPENAI_HEADERS = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "OpenAI-Beta": "assistants=v2",
})

function cleanAssistantJson(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim()
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim()
  }
  return cleaned
}

/**
 * Run The Kurator assistant with a text prompt and return the raw assistant reply.
 */
export async function runKuratorAssistant(
  prompt: string,
  options?: { maxPollAttempts?: number; pollIntervalMs?: number }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY")

  const maxAttempts = options?.maxPollAttempts ?? 30
  const pollIntervalMs = options?.pollIntervalMs ?? 1500

  const threadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: OPENAI_HEADERS(apiKey),
    body: JSON.stringify({}),
  })
  const threadData = await threadRes.json()
  if (!threadRes.ok) {
    throw new Error(threadData.error?.message || "Failed to create Kurator thread")
  }
  const threadId = threadData.id as string

  const messageRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers: OPENAI_HEADERS(apiKey),
    body: JSON.stringify({ role: "user", content: prompt }),
  })
  const messageData = await messageRes.json()
  if (!messageRes.ok) {
    throw new Error(messageData.error?.message || "Failed to add message to Kurator thread")
  }

  const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers: OPENAI_HEADERS(apiKey),
    body: JSON.stringify({ assistant_id: KURATOR_ASSISTANT_ID }),
  })
  const runData = await runRes.json()
  if (!runRes.ok) {
    throw new Error(runData.error?.message || "Failed to start Kurator run")
  }
  const runId = runData.id as string

  let runStatus = runData.status as string
  let attempts = 0
  while (runStatus !== "completed" && attempts < maxAttempts) {
    await new Promise((res) => setTimeout(res, pollIntervalMs))
    const statusRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      { headers: OPENAI_HEADERS(apiKey) }
    )
    const statusData = await statusRes.json()
    if (!statusRes.ok) {
      throw new Error(statusData.error?.message || "Failed to check Kurator run status")
    }
    runStatus = statusData.status
    attempts++
    if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
      throw new Error(`Kurator run ${runStatus}`)
    }
  }
  if (runStatus !== "completed") {
    throw new Error("Kurator run timed out")
  }

  const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    headers: OPENAI_HEADERS(apiKey),
  })
  const messagesData = await messagesRes.json()
  if (!messagesRes.ok) {
    throw new Error(messagesData.error?.message || "Failed to retrieve Kurator messages")
  }

  const aiMessage = [...messagesData.data]
    .reverse()
    .find((msg: { role: string }) => msg.role === "assistant")

  if (!aiMessage?.content?.[0]?.text?.value) {
    throw new Error("No Kurator assistant response found")
  }

  return cleanAssistantJson(aiMessage.content[0].text.value)
}
