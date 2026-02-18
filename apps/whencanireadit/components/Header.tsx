import { Header as SharedHeader } from "@whencani/ui/header";
import { SearchBar } from "@whencani/ui/search-bar";
import { cookies, headers } from "next/headers";
import { RegionSwitcher } from "@/components/RegionSwitcher";
import { REGION_COOKIE_NAME, parseRegionCookie, type Region } from "@/lib/region";

const isSearchEnabled = process.env.NEXT_PUBLIC_FEATURE_SEARCH === "true";
const isRegionSwitcherEnabled =
  process.env.NEXT_PUBLIC_FEATURE_REGION_SWITCHER === "true";

export async function Header() {
  let detectedRegion: Region = "US";

  if (isRegionSwitcherEnabled) {
    const cookieStore = await cookies();
    const cookieRegion = parseRegionCookie(
      cookieStore.get(REGION_COOKIE_NAME)?.value,
    );

    if (cookieRegion) {
      detectedRegion = cookieRegion;
    } else {
      const hdrs = await headers();
      const cc =
        hdrs.get("cf-ipcountry") ?? hdrs.get("x-vercel-ip-country") ?? "US";
      detectedRegion = cc.toUpperCase() === "GB" ? "GB" : "US";
    }
  }

  return (
    <SharedHeader
      logoSrc="/logo.png"
      logoAlt="WhenCanIReadIt"
      savedItemsLabel="Bookshelf"
      savedItemsHref="/bookshelf"
      searchSlot={
        isSearchEnabled ? (
          <SearchBar
            searchEndpoint="/api/search"
            placeholder="Search books..."
          />
        ) : undefined
      }
      actionsSlot={
        isRegionSwitcherEnabled ? (
          <RegionSwitcher detectedRegion={detectedRegion} />
        ) : undefined
      }
    />
  );
}
