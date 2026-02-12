import { Header as SharedHeader } from "@whencani/ui/header";
import { SearchBar } from "@whencani/ui/search-bar";

const isSearchEnabled = process.env.NEXT_PUBLIC_FEATURE_SEARCH === "true";

export function Header() {
  return (
    <SharedHeader
      logoSrc="/logo.png"
      logoAlt="WhenCanIWatchIt.com"
      searchSlot={
        isSearchEnabled ? (
          <SearchBar
            searchEndpoint="/api/search"
            placeholder="Search movies..."
          />
        ) : undefined
      }
    />
  );
}
