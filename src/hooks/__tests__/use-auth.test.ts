import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);
});

describe("useAuth — isLoading", () => {
  test("starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("is true during signIn and false after", async () => {
    let resolveSignIn!: (v: any) => void;
    mockSignInAction.mockReturnValue(
      new Promise((res) => {
        resolveSignIn = res;
      })
    );

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signIn("a@b.com", "pass");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignIn({ success: false });
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("is true during signUp and false after", async () => {
    let resolveSignUp!: (v: any) => void;
    mockSignUpAction.mockReturnValue(
      new Promise((res) => {
        resolveSignUp = res;
      })
    );

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signUp("a@b.com", "pass");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignUp({ success: false });
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("useAuth — signIn", () => {
  test("calls signInAction with email and password", async () => {
    mockSignInAction.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "secret");
    });

    expect(mockSignInAction).toHaveBeenCalledWith("user@example.com", "secret");
  });

  test("returns the result from signInAction", async () => {
    const actionResult = { success: false, error: "Invalid credentials" };
    mockSignInAction.mockResolvedValue(actionResult);

    const { result } = renderHook(() => useAuth());
    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "wrong");
    });

    expect(returnValue).toEqual(actionResult);
  });

  test("does not navigate when signIn fails", async () => {
    mockSignInAction.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "wrong");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("isLoading is false after signIn throws", async () => {
    mockSignInAction.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("useAuth — signUp", () => {
  test("calls signUpAction with email and password", async () => {
    mockSignUpAction.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("new@example.com", "password");
    });

    expect(mockSignUpAction).toHaveBeenCalledWith("new@example.com", "password");
  });

  test("returns the result from signUpAction", async () => {
    const actionResult = { success: false, error: "Email taken" };
    mockSignUpAction.mockResolvedValue(actionResult);

    const { result } = renderHook(() => useAuth());
    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signUp("taken@example.com", "pass");
    });

    expect(returnValue).toEqual(actionResult);
  });

  test("does not navigate when signUp fails", async () => {
    mockSignUpAction.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("user@example.com", "pass");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("isLoading is false after signUp throws", async () => {
    mockSignUpAction.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("user@example.com", "pass").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("useAuth — handlePostSignIn with anonymous work", () => {
  test("creates a project with anon work and navigates to it", async () => {
    const anonWork = {
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: { "/App.jsx": { type: "file", content: "..." } },
    };
    mockGetAnonWorkData.mockReturnValue(anonWork);
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);
    mockSignInAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
  });

  test("project name includes a time string when using anon work", async () => {
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "hi" }],
      fileSystemData: {},
    });
    mockCreateProject.mockResolvedValue({ id: "x" } as any);
    mockSignInAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    const callArg = mockCreateProject.mock.calls[0][0];
    expect(callArg.name).toMatch(/^Design from /);
  });

  test("does not call getProjects when anon work exists", async () => {
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "hi" }],
      fileSystemData: {},
    });
    mockCreateProject.mockResolvedValue({ id: "x" } as any);
    mockSignInAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockGetProjects).not.toHaveBeenCalled();
  });
});

describe("useAuth — handlePostSignIn without anonymous work", () => {
  test("navigates to most recent existing project when no anon work", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([
      { id: "recent-project" },
      { id: "older-project" },
    ] as any);
    mockSignInAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockPush).toHaveBeenCalledWith("/recent-project");
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  test("creates a new project and navigates to it when no projects exist", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "brand-new" } as any);
    mockSignInAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });

  test("new project name matches expected pattern when no projects exist", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "x" } as any);
    mockSignInAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    const callArg = mockCreateProject.mock.calls[0][0];
    expect(callArg.name).toMatch(/^New Design #\d+$/);
  });

  test("ignores anon work with empty messages array", async () => {
    mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
    mockGetProjects.mockResolvedValue([{ id: "existing" }] as any);
    mockSignInAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    // Should fall through to getProjects path, not create project with anon data
    expect(mockGetProjects).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/existing");
  });

  test("signUp also navigates to most recent project on success", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([{ id: "proj-1" }] as any);
    mockSignUpAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("new@example.com", "pass");
    });

    expect(mockPush).toHaveBeenCalledWith("/proj-1");
  });
});
