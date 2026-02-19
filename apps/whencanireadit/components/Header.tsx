import { Header as SharedHeader } from "@whencani/ui/header";
import { SearchBar } from "@whencani/ui/search-bar";
import { RegionSwitcher } from "@/components/RegionSwitcher";
import { detectRegion } from "@/lib/region";

const isSearchEnabled = process.env.NEXT_PUBLIC_FEATURE_SEARCH === "true";
const isRegionSwitcherEnabled =
  process.env.NEXT_PUBLIC_FEATURE_REGION_SWITCHER === "true";

export async function Header() {
  const detectedRegion = isRegionSwitcherEnabled ? await detectRegion() : "US";

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
