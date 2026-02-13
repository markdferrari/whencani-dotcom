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

jest.mock("@whencani/ui/detail-back-link", () => ({
  DetailBackLink: () => <div>Back</div>,
}));

jest.mock("@whencani/ui/detail-hero-card", () => ({
  DetailHeroCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="detail-hero-card">{title}{children}</div>
  ),
}));

jest.mock("@whencani/ui/media-carousel", () => ({
  MediaCarousel: ({ label }: { label: string }) => <div>{label}</div>,
}));

jest.mock("@/components/RecordView", () => ({
  RecordView: () => null,
}));

jest.mock("@whencani/ui/screenshot-carousel", () => ({
  ScreenshotCarousel: ({ title }: { title: string }) => <div>Screenshots {title}</div>,
}));

jest.mock("@whencani/ui/trailer-section", () => ({
  TrailerSection: () => <div>Trailer</div>,
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

  it("renders the game title and release date", async () => {
    await renderGamePage();

    expect(screen.getAllByText("Test Game").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Feb 15, 2026")).toBeInTheDocument();
  });

  it("renders the main layout wrapper", async () => {
    await renderGamePage();

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });
});
