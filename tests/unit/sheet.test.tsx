import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "@/components/ui/Sheet";

describe("Sheet keyboard navigation", () => {
  it("contains focus and restores page scrolling on close", () => {
    const { unmount } = render(
      <Sheet open onClose={vi.fn()} title="Settings">
        <button>Last control</button>
      </Sheet>,
    );
    const dialog = screen.getByRole("dialog");
    const last = screen.getByRole("button", { name: "Last control" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(dialog.querySelector("button")).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and restores the opener", () => {
    const onClose = vi.fn();
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const { unmount } = render(
      <Sheet open onClose={onClose} title="Settings">
        Content
      </Sheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("does not render when closed", () => {
    render(
      <Sheet open={false} onClose={vi.fn()} title="Settings">
        Content
      </Sheet>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("only closes the topmost sheet on Escape", () => {
    const closeParent = vi.fn();
    const closeChild = vi.fn();
    render(
      <Sheet open onClose={closeParent} title="Recap">
        <Sheet open onClose={closeChild} title="Proof">
          Ball details
        </Sheet>
      </Sheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closeChild).toHaveBeenCalledOnce();
    expect(closeParent).not.toHaveBeenCalled();
  });
});
