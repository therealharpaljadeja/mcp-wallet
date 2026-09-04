"use client";

import { type ReactNode, useRef, useState } from "react";

type AgentId = "codex" | "claude" | "cursor";

type AgentGuide = {
  id: AgentId;
  name: string;
  icon: ReactNode;
  steps: ReactNode[];
  snippet?: string;
  snippetLabel?: string;
};

function getGuides(mcpUrl: string): AgentGuide[] {
  return [
    {
      id: "codex",
      name: "Codex",
      icon: <CodexIcon />,
      steps: [
        <>Open <strong>Settings → MCP servers → Add server</strong>.</>,
        <>
          Choose <strong>Streamable HTTP</strong>, name it <code>mcp-wallet</code>,
          and paste the URL below.
        </>,
        <>
          Save, restart Codex, then select <strong>Authenticate</strong> and approve
          access.
        </>,
      ],
      snippetLabel: "Or use the CLI",
      snippet: `codex mcp add mcp-wallet --url ${mcpUrl}\ncodex mcp login mcp-wallet`,
    },
    {
      id: "claude",
      name: "Claude Code",
      icon: <ClaudeIcon />,
      steps: [
        <>Run the command below in your terminal.</>,
        <>
          In Claude Code, run <code>/mcp</code> and select <strong>mcp-wallet</strong>.
        </>,
        <>
          Choose <strong>Authenticate</strong> and approve access in your browser.
        </>,
      ],
      snippetLabel: "Terminal",
      snippet: `claude mcp add --transport http mcp-wallet ${mcpUrl}`,
    },
    {
      id: "cursor",
      name: "Cursor",
      icon: <CursorIcon />,
      steps: [
        <>Open the global <code>~/.cursor/mcp.json</code> file.</>,
        <>Add the configuration below and save it.</>,
        <>
          Open <strong>Cursor Settings → Tools & MCP</strong>, enable the server,
          and authenticate.
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
    },
  ];
}

export function AgentSetup({ mcpUrl }: { mcpUrl: string }) {
  const guides = getGuides(mcpUrl);
  const defaultGuide = guides[0]!;
  const [activeId, setActiveId] = useState<AgentId>("codex");
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeGuide = guides.find((guide) => guide.id === activeId) ?? defaultGuide;

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }

  function moveTab(currentIndex: number, direction: number) {
    const nextIndex = (currentIndex + direction + guides.length) % guides.length;
    const nextGuide = guides[nextIndex]!;
    setActiveId(nextGuide.id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="agent-setup" aria-labelledby="agent-setup-title">
      <div className="setup-heading">
        <div>
          <h2 id="agent-setup-title">Connect your agent</h2>
          <p>Choose your coding agent and follow the steps.</p>
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
            onClick={() => setActiveId(guide.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                moveTab(index, 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                moveTab(index, -1);
              }
            }}
          >
            {guide.icon}
            <span>{guide.name}</span>
          </button>
        ))}
      </div>

      <div
        className={activeGuide.snippet ? "agent-guide" : "agent-guide no-snippet"}
        id={`agent-panel-${activeGuide.id}`}
        role="tabpanel"
        aria-labelledby={`agent-tab-${activeGuide.id}`}
      >
        <ol className="setup-steps">
          {activeGuide.steps.map((step, index) => (
            <li key={index}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>

        {activeGuide.snippet ? (
          <div className="setup-snippet">
            <span>{activeGuide.snippetLabel}</span>
            <pre>
              <code>{activeGuide.snippet}</code>
            </pre>
            <CopyButton
              label={
                copied ? "Configuration copied" : "Copy configuration"
              }
              copied={copied}
              onClick={() => copy(activeGuide.snippet!)}
            />
          </div>
        ) : null}

        <p className="setup-test">
          <span>Test it</span>
          Ask your agent: <q>What is my MCP Wallet address?</q>
        </p>
      </div>
    </section>
  );
}

function CopyButton({
  label,
  copied,
  onClick,
}: {
  label: string;
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="setup-copy-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {copied ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 4 4L19 6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="8" width="11" height="11" rx="2" />
          <path d="M16 8V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1" />
        </svg>
      )}
    </button>
  );
}

function CodexIcon() {
  return (
    <svg className="agent-logo codex-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.086.457a6.105 6.105 0 0 1 3.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 0 0 .107.029c1.408-.346 2.762-.224 4.061.366l.217.106c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 0 1-.18 1.631.167.167 0 0 0 .04.155 5.982 5.982 0 0 1 1.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 0 1-2.934 1.851.162.162 0 0 0-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 0 0-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 0 1-2.595-.622 6.058 6.058 0 0 1-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 0 1-.495-1.283 6.11 6.11 0 0 1-.017-3.064.166.166 0 0 0 .008-.074.115.115 0 0 0-.037-.064 5.958 5.958 0 0 1-1.38-2.202 5.196 5.196 0 0 1-.333-1.589 6.915 6.915 0 0 1 .188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 0 0 .087-.087A6.016 6.016 0 0 1 5.635 2.31C6.315 1.464 7.132.846 8.086.457Zm-.804 7.85a.848.848 0 0 0-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 0 0 1.46.864l1.94-3.272a.849.849 0 0 0 .007-.854l-1.94-3.393Zm5.446 6.24a.849.849 0 0 0 0 1.695h4.848a.849.849 0 0 0 0-1.696h-4.848Z"
      />
    </svg>
  );
}

function ClaudeIcon() {
  return (
    <svg className="agent-logo claude-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949ZM6 10.949h1.488V8.102H6v2.847Zm10.51 0H18V8.102h-1.49v2.847Z"
      />
    </svg>
  );
}

function CursorIcon() {
  return (
    <svg className="agent-logo cursor-logo" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="cursor-top-left" x1="6" y1="9" x2="12" y2="5">
          <stop stopColor="#f2f1ed" />
          <stop offset="1" stopColor="#5e5d59" />
        </linearGradient>
        <linearGradient id="cursor-top-right" x1="12" y1="5" x2="18" y2="9">
          <stop stopColor="#171714" />
          <stop offset="1" stopColor="#6f6e6a" />
        </linearGradient>
        <linearGradient id="cursor-bottom-left" x1="6" y1="16" x2="12" y2="19">
          <stop stopColor="#4a4946" />
          <stop offset="1" stopColor="#f2f1ed" />
        </linearGradient>
      </defs>
      <path fill="url(#cursor-top-left)" d="m12 4.5-6.5 4H12v-4Z" />
      <path fill="url(#cursor-top-right)" d="m12 4.5 6.5 4H12v-4Z" />
      <path fill="#fafafa" d="M5.5 8.5h13L12 12.3 5.5 8.5Z" />
      <path fill="#393835" d="m5.5 8.5 6.5 3.8-6.5 3.8V8.5Z" />
      <path fill="#dfdfdc" d="m12 12.3 6.5-3.8-3.1 6.2L12 19.5v-7.2Z" />
      <path fill="#171714" d="m18.5 8.5-3.1 6.2 3.1 1.4V8.5Z" />
      <path fill="url(#cursor-bottom-left)" d="m5.5 16.1 6.5-3.8v7.2l-6.5-3.4Z" />
      <path fill="#f2f1ed" d="m12 19.5 3.4-4.8 3.1 1.4-6.5 3.4Z" />
    </svg>
  );
}
