import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type { AgentChatInput, AgentChatResponse } from "./types";

export const agent = {
  chat: (input: AgentChatInput) =>
    topdukaRequest<AgentChatResponse>(routes.agentChat, {
      method: "POST",
      body: {
        messages: [
          ...(input.messages ?? []),
          { role: "user", content: input.message },
        ],
        session_id: input.session_id,
      },
    }),
};
