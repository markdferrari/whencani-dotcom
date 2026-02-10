import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { ScreenshotGallery } from "../ScreenshotGallery";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

describe("ScreenshotGallery", () => {
  const screenshots = [
    "/api/image?url=https%3A%2F%2Fimages.igdb.com%2Fone.jpg",
    "/api/image?url=https%3A%2F%2Fimages.igdb.com%2Ftwo.jpg",
  ];

  it("opens and closes the lightbox", async () => {
    const user = userEvent.setup();
    render(<ScreenshotGallery screenshots={screenshots} title="Test Game" />);

    await user.click(screen.getAllByRole("button", { name: /open screenshot/i })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close preview/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a constrained mobile scroll track", () => {
    render(<ScreenshotGallery screenshots={screenshots} title="Test Game" />);

    const wrapper = screen.getByTestId("screenshot-gallery-mobile-wrapper");
    expect(wrapper).toHaveClass("max-w-full");
    expect(wrapper).toHaveClass("overflow-hidden");

    const track = screen.getByTestId("screenshot-gallery-mobile-track");
    expect(track).toHaveClass("overflow-x-auto");
    expect(track).toHaveClass("px-4");
  });
});
