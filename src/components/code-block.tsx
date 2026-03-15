"use client";

import { useRef, useState } from "react";

export function CodeBlock({ children, ...props }: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = preRef.current?.querySelector("code")?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 rounded border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
        aria-label="コードをコピー"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
