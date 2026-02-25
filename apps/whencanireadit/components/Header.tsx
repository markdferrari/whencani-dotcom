import { Header as SharedHeader } from "@whencani/ui/header";
import { SearchBar } from "@whencani/ui/search-bar";
import { RegionSwitcher } from "@/components/RegionSwitcher";

const isSearchEnabled = process.env.NEXT_PUBLIC_FEATURE_SEARCH === "true";
const isRegionSwitcherEnabled =
  process.env.NEXT_PUBLIC_FEATURE_REGION_SWITCHER === "true";

export function Header() {
  // Region is detected client-side via cookie in RegionSwitcher — avoids calling
  // cookies()/headers() which would make every page in the layout dynamic.
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
          <RegionSwitcher detectedRegion="US" />
        ) : undefined
      }
    />
  );
}
