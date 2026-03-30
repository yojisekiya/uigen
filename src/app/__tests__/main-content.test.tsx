import { test, expect, vi, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn().mockReturnValue({
    fileSystem: {},
    selectedFile: null,
    setSelectedFile: vi.fn(),
    getAllFiles: vi.fn().mockReturnValue(new Map()),
    refreshTrigger: 0,
  }),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn().mockReturnValue({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  }),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(cleanup);

describe("MainContent toggle buttons", () => {
  test("shows preview by default", () => {
    render(<MainContent />);
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("file-tree")).toBeNull();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("Preview tab is active by default", () => {
    render(<MainContent />);
    const previewTab = screen.getByRole("tab", { name: "Preview" });
    expect(previewTab.getAttribute("data-state")).toBe("active");
    const codeTab = screen.getByRole("tab", { name: "Code" });
    expect(codeTab.getAttribute("data-state")).toBe("inactive");
  });

  test("clicking Code tab switches to code view", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));

    expect(screen.queryByTestId("preview-frame")).toBeNull();
    expect(screen.getByTestId("file-tree")).toBeDefined();
    expect(screen.getByTestId("code-editor")).toBeDefined();
  });

  test("Code tab becomes active after clicking it", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));

    const codeTab = screen.getByRole("tab", { name: "Code" });
    expect(codeTab.getAttribute("data-state")).toBe("active");
    const previewTab = screen.getByRole("tab", { name: "Preview" });
    expect(previewTab.getAttribute("data-state")).toBe("inactive");
  });

  test("clicking Preview tab switches back to preview", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.queryByTestId("preview-frame")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("file-tree")).toBeNull();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("clicking active tab does not change the view", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    // Click Preview while Preview is already active
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("file-tree")).toBeNull();
  });

  test("can toggle back and forth multiple times", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("file-tree")).toBeDefined();

    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();

    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("file-tree")).toBeDefined();

    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();
  });
});
