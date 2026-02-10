import { render, screen } from "@testing-library/react";
import type React from "react";
import GameDetailPage from "./page";
import type { IGDBGame } from "@/lib/igdb";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string },
  ) => {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock("@/components/GameLinks", () => ({
  GameLinks: () => <div>Links</div>,
}));

jest.mock("@/components/ReviewSection", () => ({
  ReviewSection: () => <div>Reviews</div>,
}));

jest.mock("@/components/ScreenshotGallery", () => ({
  ScreenshotGallery: ({ title }: { title: string }) => <div>Gallery {title}</div>,
}));

jest.mock("@/components/SimilarGamesCarousel", () => ({
  SimilarGamesCarousel: () => <div>Similar Games Carousel</div>,
}));

jest.mock("@/lib/igdb", () => ({
  getGameById: jest.fn(),
  getSimilarGamesById: jest.fn(),
  formatReleaseDate: jest.fn((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }),
}));

jest.mock("@/lib/notes", () => ({
  getGameNote: jest.fn(),
}));

const mockGame: IGDBGame = {
  id: 1,
  name: "Test Game",
  cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/test.jpg" },
  release_dates: [
    {
      human: "Feb 15, 2026",
      date: Math.floor(new Date("2026-02-15T00:00:00Z").getTime() / 1000),
      platform: { id: 167, name: "PlayStation 5" },
    },
  ],
  platforms: [{ id: 167, name: "PlayStation 5" }],
  summary: "Summary",
  screenshots: [],
};

describe("GameDetailPage", () => {
  const getGameByIdMock = jest.requireMock("@/lib/igdb").getGameById as jest.Mock;
  const getSimilarGamesByIdMock = jest.requireMock("@/lib/igdb").getSimilarGamesById as jest.Mock;
  const getGameNoteMock = jest.requireMock("@/lib/notes").getGameNote as jest.Mock;

  const renderGamePage = async () => {
    getGameByIdMock.mockResolvedValue(mockGame);
    getSimilarGamesByIdMock.mockResolvedValue([]);
    getGameNoteMock.mockResolvedValue(null);

    const ui = await GameDetailPage({
      params: Promise.resolve({ id: "1" }),
    });

    render(ui);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-05T00:00:00Z"));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a prominent release date badge", async () => {
    await renderGamePage();

    const badge = screen.getByTestId("release-date-hero");
    expect(badge).toHaveTextContent("Feb 15, 2026");
    expect(badge).toHaveTextContent("days away");

    const coverWrapper = screen.getByTestId("game-cover-wrapper");
    expect(coverWrapper).toBeInTheDocument();
    expect(coverWrapper.className).toContain("max-w-[min(90vw,360px)]");
    expect(coverWrapper.className).toContain("overflow-hidden");
    expect(coverWrapper.className).toContain("min-w-0");
  });

  it("caps the layout width to the cover size on narrow screens", async () => {
    await renderGamePage();

    const main = screen.getByRole("main");
    expect(main).toHaveClass("w-full");
    expect(main).toHaveClass("max-w-[min(100vw,360px)]");
    expect(main).toHaveClass("lg:max-w-6xl");
  });
});
