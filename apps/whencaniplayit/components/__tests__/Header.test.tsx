import { render, screen } from "@testing-library/react";
import type React from "react";
import { Header } from "../Header";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("../ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">Toggle</button>,
}));

jest.mock("../ViewToggle", () => ({
  ViewToggle: () => <button type="button">Views</button>,
}));

describe("Header", () => {
  it("renders branding and toggle", () => {
    render(<Header />);

    expect(screen.getByRole("button", { name: "Toggle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Views" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WhenCanIPlayIt/i })).toHaveAttribute("href", "/");
  });
});
