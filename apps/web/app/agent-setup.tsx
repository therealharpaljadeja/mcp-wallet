"use client";

import { type ReactNode, useRef, useState } from "react";

type AgentId = "codex" | "claude" | "cursor";

type AgentGuide = {
  id: AgentId;
  name: string;
  steps: ReactNode[];
  snippet: string;
  snippetLabel: string;
  copyLabel: string;
  action?: {
    href: string;
    label: string;
  };
};

function encodeBase64(value: string) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let result = "";

  for (let index = 0; index < value.length; index += 3) {
    const first = value.charCodeAt(index);
    const second = value.charCodeAt(index + 1);
    const third = value.charCodeAt(index + 2);
    const block = (first << 16) | ((second || 0) << 8) | (third || 0);

    result += alphabet[(block >> 18) & 63];
    result += alphabet[(block >> 12) & 63];
    result += Number.isNaN(second) ? "=" : alphabet[(block >> 6) & 63];
    result += Number.isNaN(third) ? "=" : alphabet[block & 63];
  }

  return result;
}

function getGuides(mcpUrl: string): AgentGuide[] {
  return [
    {
      id: "codex",
      name: "Codex",
      steps: [
        <>Copy and run the setup command below.</>,
        <>Approve access when Codex opens the authorization page.</>,
        <>Restart Codex, then ask it for your wallet address.</>,
      ],
      snippetLabel: "Terminal",
      snippet: `codex mcp add mcp-wallet --url ${mcpUrl}\ncodex mcp login mcp-wallet`,
      copyLabel: "Copy setup command",
    },
    {
      id: "claude",
      name: "Claude Code",
      steps: [
        <>Copy and run the setup command below.</>,
        <>
          In Claude Code, run <code>/mcp</code> and select{" "}
          <strong>mcp-wallet</strong>.
        </>,
        <>
          Choose <strong>Authenticate</strong> and approve access in your
          browser.
        </>,
      ],
      snippetLabel: "Terminal",
      snippet: `claude mcp add --transport http --scope user mcp-wallet ${mcpUrl}`,
      copyLabel: "Copy setup command",
    },
    {
      id: "cursor",
      name: "Cursor",
      steps: [
        <>
          Select <strong>Add to Cursor</strong> and approve the configuration.
        </>,
        <>
          Or copy the configuration below into <code>~/.cursor/mcp.json</code>.
        </>,
        <>
          Open <strong>Cursor Settings → Tools & MCP</strong>, enable the
          server, and authenticate.
        </>,
      ],
      snippetLabel: "mcp.json",
      snippet: `{
  "mcpServers": {
    "mcp-wallet": {
      "url": "${mcpUrl}"
    }
  }
}`,
      copyLabel: "Copy configuration",
      action: {
        label: "Add to Cursor",
        href: `cursor://anysphere.cursor-deeplink/mcp/install?name=mcp-wallet&config=${encodeURIComponent(
          encodeBase64(JSON.stringify({ url: mcpUrl })),
        )}`,
      },
    },
  ];
}

export function AgentSetup({ mcpUrl }: { mcpUrl: string }) {
  const guides = getGuides(mcpUrl);
  const defaultGuide = guides[0]!;
  const [activeId, setActiveId] = useState<AgentId>("codex");
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeGuide =
    guides.find((guide) => guide.id === activeId) ?? defaultGuide;

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }

  function selectGuide(id: AgentId) {
    setActiveId(id);
    setCopied(false);
  }

  function moveTab(currentIndex: number, direction: number) {
    const nextIndex = (currentIndex + direction + guides.length) % guides.length;
    const nextGuide = guides[nextIndex]!;
    selectGuide(nextGuide.id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="agent-setup" aria-labelledby="agent-setup-title">
      <div className="setup-heading">
        <div>
          <h2 id="agent-setup-title">Add MCP Wallet to your agent</h2>
          <p>Choose an agent. Connect in a few steps.</p>
        </div>
      </div>

      <div className="agent-tabs" role="tablist" aria-label="Coding agents">
        {guides.map((guide, index) => (
          <button
            key={guide.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={`agent-tab-${guide.id}`}
            className="agent-tab"
            role="tab"
            type="button"
            aria-selected={activeId === guide.id}
            aria-controls={`agent-panel-${guide.id}`}
            tabIndex={activeId === guide.id ? 0 : -1}
            onClick={() => selectGuide(guide.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                moveTab(index, 1);
              } else if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowUp"
              ) {
                event.preventDefault();
                moveTab(index, -1);
              }
            }}
          >
            {guide.name}
          </button>
        ))}
      </div>

      <div
        className="agent-guide"
        id={`agent-panel-${activeGuide.id}`}
        role="tabpanel"
        aria-labelledby={`agent-tab-${activeGuide.id}`}
      >
        {activeGuide.action ? (
          <a className="setup-action" href={activeGuide.action.href}>
            {activeGuide.action.label}
          </a>
        ) : null}

        <ol className="setup-steps">
          {activeGuide.steps.map((step, index) => (
            <li key={index}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>

        <div className="setup-snippet">
          <span>{activeGuide.snippetLabel}</span>
          <pre>
            <code>{activeGuide.snippet}</code>
          </pre>
          <button
            className="setup-copy-action"
            type="button"
            onClick={() => copy(activeGuide.snippet)}
          >
            {copied ? "Copied" : activeGuide.copyLabel}
          </button>
        </div>

        <p className="setup-test">
          <span>Test it</span>
          Ask your agent: <q>What is my MCP Wallet address?</q>
        </p>
      </div>
    </section>
  );
}
