import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationDisplay, getToolLabel } from "../ToolInvocationDisplay";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "call",
  result?: unknown
) {
  return { toolCallId: "test-id", toolName, args, state, result } as any;
}

// --- getToolLabel unit tests ---

test("str_replace_editor create pending", () => {
  expect(getToolLabel(makeInvocation("str_replace_editor", { command: "create", path: "src/App.jsx" }))).toBe("Creating App.jsx");
});

test("str_replace_editor create result", () => {
  expect(getToolLabel(makeInvocation("str_replace_editor", { command: "create", path: "src/App.jsx" }, "result", "ok"))).toBe("Created App.jsx");
});

test("str_replace_editor str_replace pending", () => {
  expect(getToolLabel(makeInvocation("str_replace_editor", { command: "str_replace", path: "src/Card.tsx" }))).toBe("Editing Card.tsx");
});

test("str_replace_editor str_replace result", () => {
  expect(getToolLabel(makeInvocation("str_replace_editor", { command: "str_replace", path: "src/Card.tsx" }, "result", "ok"))).toBe("Edited Card.tsx");
});

test("str_replace_editor insert pending", () => {
  expect(getToolLabel(makeInvocation("str_replace_editor", { command: "insert", path: "src/utils.ts" }))).toBe("Editing utils.ts");
});

test("str_replace_editor undo_edit pending", () => {
  expect(getToolLabel(makeInvocation("str_replace_editor", { command: "undo_edit", path: "src/utils.ts" }))).toBe("Editing utils.ts");
});

test("str_replace_editor view", () => {
  expect(getToolLabel(makeInvocation("str_replace_editor", { command: "view", path: "src/utils.ts" }))).toBe("Reading utils.ts");
});

test("file_manager rename pending", () => {
  expect(getToolLabel(makeInvocation("file_manager", { command: "rename", path: "src/old.tsx" }))).toBe("Renaming old.tsx");
});

test("file_manager rename result", () => {
  expect(getToolLabel(makeInvocation("file_manager", { command: "rename", path: "src/old.tsx" }, "result", { success: true }))).toBe("Renamed old.tsx");
});

test("file_manager delete pending", () => {
  expect(getToolLabel(makeInvocation("file_manager", { command: "delete", path: "src/Button.tsx" }))).toBe("Deleting Button.tsx");
});

test("file_manager delete result", () => {
  expect(getToolLabel(makeInvocation("file_manager", { command: "delete", path: "src/Button.tsx" }, "result", { success: true }))).toBe("Deleted Button.tsx");
});

test("unknown tool falls back to toolName", () => {
  expect(getToolLabel(makeInvocation("some_other_tool", {}))).toBe("some_other_tool");
});

// --- ToolInvocationDisplay render tests ---

test("shows spinner when pending", () => {
  render(<ToolInvocationDisplay toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.jsx" })} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(document.querySelector(".animate-spin")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when result", () => {
  render(<ToolInvocationDisplay toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.jsx" }, "result", "ok")} />);
  expect(screen.getByText("Created App.jsx")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeDefined();
  expect(document.querySelector(".animate-spin")).toBeNull();
});
