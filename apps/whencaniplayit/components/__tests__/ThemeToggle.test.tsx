import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../ThemeToggle";

type MatchMediaListener = (event: MediaQueryListEvent) => void;

const createMatchMedia = (matches: boolean) => {
  let listener: MatchMediaListener | null = null;
  return (query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_event, cb) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
    dispatchEvent: () => false,
    addListener: () => {},
    removeListener: () => {},
  });
};

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    localStorage.clear();
  });

  it("toggles the dark class on the document element", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: createMatchMedia(false),
    });

    const user = userEvent.setup();
    render(<ThemeToggle />);

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("button", { name: /toggle dark mode/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
