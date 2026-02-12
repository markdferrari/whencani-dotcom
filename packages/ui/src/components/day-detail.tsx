"use client";

import Link from "next/link";
import { CalendarItem } from "../types/calendar";

interface DayDetailProps {
  date: string;
  items: CalendarItem[];
  onClose: () => void;
}

export function DayDetail({ date, items, onClose }: DayDetailProps) {
  return (
    <>
      {/* Mobile bottom sheet */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={onClose}>
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">{new Date(date).toLocaleDateString()}</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 text-2xl">×</button>
          </div>
          <div className="p-4 space-y-2">
            {items.map(item => (
              <Link key={item.id} href={item.href} className="block p-2 border rounded hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <div className="flex items-center gap-3">
                  <img src={item.imageUrl || '/placeholder.png'} alt={item.title} className="w-12 h-16 object-cover rounded" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop modal */}
      <div className="hidden md:fixed md:inset-0 md:bg-black md:bg-opacity-50 md:flex md:items-center md:justify-center md:z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{new Date(date).toLocaleDateString()}</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">×</button>
          </div>
          <div className="space-y-2">
            {items.map(item => (
              <Link key={item.id} href={item.href} className="block p-2 border rounded hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <div className="flex items-center gap-3">
                  <img src={item.imageUrl || '/placeholder.png'} alt={item.title} className="w-12 h-16 object-cover rounded" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}