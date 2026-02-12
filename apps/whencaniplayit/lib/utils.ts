// Re-export cn utility from shared package
export { cn } from "@whencani/ui";

/**
 * Transforms IGDB image URLs to higher resolution versions for desktop viewing
 * IGDB uses Cloudinary, so we can modify the size parameter in the URL
 */
export function getHighResImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // IGDB URLs are in format: //images.igdb.com/igdb/image/upload/t_thumb/image.jpg
  // We want to change t_thumb to t_cover_big for higher resolution
  return url.replace('/t_thumb/', '/t_cover_big/');
}

