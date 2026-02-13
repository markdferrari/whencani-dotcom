"use client";
import { useEffect } from "react";
import { recordRecentView, type RecentlyViewedItem } from "@/lib/recently-viewed";

export function RecordView({ item }: { item: Omit<RecentlyViewedItem, 'viewedAt'> }) {
  useEffect(() => {
    recordRecentView(item);
  }, [item]);

  return null;
}