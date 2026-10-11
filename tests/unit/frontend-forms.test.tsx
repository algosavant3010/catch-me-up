import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SamjhaoSheet } from "@/components/ask/SamjhaoSheet";
import { RoomPanel } from "@/components/game/RoomPanel";

vi.mock("@/components/providers/preferences-provider", () => ({
  usePreferences: () => ({
    locale: "en",
    mode: "pro",
    strings: { "nav.ask": "Ask", "ask.placeholder": "Ask about the match" },
  }),
}));
vi.mock("@/lib/match/match-context", () => ({ useMatchRuntime: () => ({ balls: [] }) }));
vi.mock("@/lib/analytics/track", () => ({ track: vi.fn() }));
vi.mock("@/lib/utils/persistent-store", () => ({
  createPersistentStore: (_key: string, defaults: unknown) => ({
    getSnapshot: () => defaults,
    set: vi.fn(),
  }),
}));

afterEach(() => vi.unstubAllGlobals());

describe("Frontend submission feedback", () => {
  for (const action of ["create", "join"]) {
    it(`shows the leaderboard after room ${action} and keeps the payload`, async () => {
      const leaderboard = [{ nickname: "Fan", totalPoints: 12, personalBest: 12 }];
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ code: "ABC123", leaderboard }) });
      vi.stubGlobal("fetch", fetchMock);
      render(<RoomPanel />);
      if (action === "join")
        fireEvent.change(screen.getByLabelText("Room code"), { target: { value: "abc123" } });
      fireEvent.click(
        screen.getByRole("button", { name: action === "create" ? "Create a room" : "Join" }),
      );
      expect(await screen.findByText("ABC123")).toBeVisible();
      expect(await screen.findByText("1. Fan")).toBeVisible();
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(
        action === "create"
          ? { action, nickname: "Fan" }
          : { action, nickname: "Fan", code: "ABC123" },
      );
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    });

    it(`announces server validation errors for room ${action}`, async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Room unavailable" }) }),
      );
      render(<RoomPanel />);
      fireEvent.click(
        screen.getByRole("button", { name: action === "create" ? "Create a room" : "Join" }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent("Room unavailable");
      expect(screen.getByRole("button", { name: "Join" })).toBeEnabled();
    });
  }

  it("handles non-success question responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<SamjhaoSheet open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Who's on strike?" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
  });
  it("shows a recoverable question error without losing the question", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<SamjhaoSheet open onClose={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Who is on strike?" } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    expect(input).toHaveValue("Who is on strike?");
    expect(screen.getByRole("button", { name: "Ask" })).toBeEnabled();
  });

  it("keeps the existing question payload and renders a successful answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "Six runs per over.",
        refs: [],
        onTopic: true,
        source: "fallback",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<SamjhaoSheet open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "What's the required rate?" }));
    expect(await screen.findByText("Six runs per over.")).toBeVisible();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      question: "What's the required rate?",
      cutoffBall: 0,
      locale: "en",
      mode: "pro",
    });
  });

  it("disables room actions while pending and reports network errors", async () => {
    let rejectRequest: (reason: Error) => void = () => {};
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<RoomPanel />);
    fireEvent.change(screen.getByLabelText("Your nickname"), { target: { value: "Fan One" } });
    fireEvent.click(screen.getByRole("button", { name: "Create a room" }));
    expect(screen.getByRole("button", { name: "Join" })).toBeDisabled();
    rejectRequest(new Error("offline"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Create a room" })).toBeEnabled(),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      action: "create",
      nickname: "Fan One",
    });
  });
});
