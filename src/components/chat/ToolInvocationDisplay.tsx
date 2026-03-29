"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationDisplayProps {
  toolInvocation: ToolInvocation;
}

export function getToolLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args, state } = toolInvocation;
  const done = state === "result";
  const file = args?.path ? args.path.split("/").pop() : undefined;

  if (toolName === "str_replace_editor" && file) {
    const command = args.command as string;
    if (command === "create") return done ? `Created ${file}` : `Creating ${file}`;
    if (command === "view") return `Reading ${file}`;
    if (["str_replace", "insert", "undo_edit"].includes(command)) {
      return done ? `Edited ${file}` : `Editing ${file}`;
    }
  }

  if (toolName === "file_manager" && file) {
    const command = args.command as string;
    if (command === "rename") return done ? `Renamed ${file}` : `Renaming ${file}`;
    if (command === "delete") return done ? `Deleted ${file}` : `Deleting ${file}`;
  }

  return toolName;
}

export function ToolInvocationDisplay({ toolInvocation }: ToolInvocationDisplayProps) {
  const done = toolInvocation.state === "result" && toolInvocation.result;
  const label = getToolLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
