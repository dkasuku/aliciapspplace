import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type { AgentChatInput, AgentChatResponse } from "./types";

export const agent = {
  chat: (input: AgentChatInput, agentId?: string) =>
    topdukaRequest<AgentChatResponse>(agentId ? routes.agentChatWithId(agentId) : routes.agentChat, {
      method: "POST",
      body: {
        messages: [
          ...(input.messages ?? []),
          { role: "user", content: input.message },
        ],
        session_id: input.session_id,
      },
    }),
  discover: (input: Record<string, unknown>) =>
    topdukaRequest<Record<string, unknown>>(routes.aiDiscover, { method: "POST", body: input }),
};
