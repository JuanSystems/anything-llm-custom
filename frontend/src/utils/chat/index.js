import { THREAD_RENAME_EVENT } from "@/components/Sidebar/ActiveWorkspaces/ThreadContainer";
import { emitAssistantMessageCompleteEvent } from "@/components/contexts/TTSProvider";
export const ABORT_STREAM_EVENT = "abort-chat-stream";

// For handling of chat responses in the frontend by their various types.
export default function handleChat(
  chatResult,
  setLoadingResponse,
  setChatHistory,
  remHistory,
  _chatHistory,
  setWebsocket
) {
  const {
    uuid,
    textResponse,
    type,
    sources = [],
    error,
    close,
    animate = false,
    chatId = null,
    action = null,
    metrics = {},
  } = chatResult;

  if (type === "abort" || type === "statusResponse") {
    setLoadingResponse(false);
    setChatHistory([
      ...remHistory,
      {
        type,
        uuid,
        content: textResponse,
        role: "assistant",
        sources,
        closed: true,
        error,
        animate,
        pending: false,
        metrics,
      },
    ]);
    _chatHistory.push({
      type,
      uuid,
      content: textResponse,
      role: "assistant",
      sources,
      closed: true,
      error,
      animate,
      pending: false,
      metrics,
    });
  } else if (type === "textResponse") {
    setLoadingResponse(false);
    setChatHistory([
      ...remHistory,
      {
        uuid,
        content: textResponse,
        role: "assistant",
        sources,
        closed: close,
        error,
        animate: !close,
        pending: false,
        chatId,
        metrics,
      },
    ]);
    _chatHistory.push({
      uuid,
      content: textResponse,
      role: "assistant",
      sources,
      closed: close,
      error,
      animate: !close,
      pending: false,
      chatId,
      metrics,
    });
    emitAssistantMessageCompleteEvent(chatId);
  } else if (
    type === "textResponseChunk" ||
    type === "finalizeResponseStream"
  ) {
    const chatIdx = _chatHistory.findIndex((chat) => chat.uuid === uuid);
    if (chatIdx !== -1) {
      const existingHistory = { ..._chatHistory[chatIdx] };
      let updatedHistory;

      // If the response is finalized, we can set the loading state to false.
      // and append the metrics to the history.
      if (type === "finalizeResponseStream") {
        updatedHistory = {
          ...existingHistory,
          closed: close,
          animate: !close,
          pending: false,
          chatId,
          metrics,
        };

        _chatHistory[chatIdx - 1] = { ..._chatHistory[chatIdx - 1], chatId }; // update prompt with chatID

        emitAssistantMessageCompleteEvent(chatId);
        setLoadingResponse(false);
      } else {
        updatedHistory = {
          ...existingHistory,
          content: existingHistory.content + textResponse,
          ...(sources && sources.length > 0 ? { sources } : {}),
          error,
          closed: close,
          animate: !close,
          pending: false,
          chatId,
          metrics,
        };
      }
      _chatHistory[chatIdx] = updatedHistory;
    } else {
      _chatHistory.push({
        uuid,
        sources,
        error,
        content: textResponse,
        role: "assistant",
        closed: close,
        animate: !close,
        pending: false,
        chatId,
        metrics,
      });
    }
    setChatHistory([..._chatHistory]);
  } else if (type === "agentInitWebsocketConnection") {
    setWebsocket(chatResult.websocketUUID);
  } else if (type === "stopGeneration") {
    const chatIdx = _chatHistory.length - 1;
    const existingHistory = { ..._chatHistory[chatIdx] };
    const updatedHistory = {
      ...existingHistory,
      sources: [],
      closed: true,
      error: null,
      animate: false,
      pending: false,
      metrics,
    };
    _chatHistory[chatIdx] = updatedHistory;

    setChatHistory([..._chatHistory]);
    setLoadingResponse(false);
  }

  // Action Handling via special 'action' attribute on response.
  if (action === "reset_chat") setChatHistory([]);

  // If thread was updated automatically based on chat prompt
  // then we can handle the updating of the thread here.
  if (action === "rename_thread") {
    if (!!chatResult?.thread?.slug && chatResult.thread.name) {
      window.dispatchEvent(
        new CustomEvent(THREAD_RENAME_EVENT, {
          detail: {
            threadSlug: chatResult.thread.slug,
            newName: chatResult.thread.name,
          },
        })
      );
    }
  }
}

export function getWorkspaceSystemPrompt(workspace) {
  return (
    workspace?.openAiPrompt ??
    "Given the following conversation, relevant context, and a follow up question, reply with an answer to the current question the user is asking. Return only your response to the question given the above information following the users instructions as needed."
  );
}

export function chatQueryRefusalResponse(workspace) {
  return (
    workspace?.queryRefusalResponse ??
    "There is no relevant information in this workspace to answer your query."
  );
}

const SHEBANG_PATTERN = /#!.*\b(bash|sh|zsh|fish)\b/;
const COMMENT_LINE = /^# .+/m;
const CODE_BLOCK_DELIMITER = "\`\`\`";

function detectShellName(message) {
  const match = message.match(SHEBANG_PATTERN);
  if (!match) return "bash";
  return match[1] === "sh" && message.includes("zsh") ? "zsh" : match[1];
}

export function wrapScriptInCodeBlock(message) {
  if (!message || typeof message !== "string") return message;
  if (message.startsWith(CODE_BLOCK_DELIMITER)) return message;

  // 1. Detect shebang (#!/bin/bash, #!/usr/bin/env zsh, etc.)
  if (message.includes("#!")) {
    const shellName = detectShellName(message);
    const normalized = message.endsWith("\n") ? message : message + "\n";
    return `${CODE_BLOCK_DELIMITER}${shellName}\n${normalized}${CODE_BLOCK_DELIMITER}`;
  }

  // 2. Detect script with # comments (3+ lines starting with "# ")
  const lines = message.split("\n");
  let commentLineCount = 0;
  for (const line of lines) {
    if (/^#[\s#]/.test(line.trimStart())) commentLineCount++;
  }
  if (commentLineCount >= 3) {
    const normalized = message.endsWith("\n") ? message : message + "\n";
    return `${CODE_BLOCK_DELIMITER}bash\n${normalized}${CODE_BLOCK_DELIMITER}`;
  }

  return message;
}
