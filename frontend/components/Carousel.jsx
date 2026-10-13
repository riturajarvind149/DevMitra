"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export default function Carousel({ items = [], renderItem, autoPlay = true, interval = 5000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = items.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (!autoPlay || isPaused || total <= 1) return;
    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, nextSlide, total]);

  if (total === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-[#10141d] border border-[#222b3d] rounded-sm p-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Area */}
      <div className="w-full transition-opacity duration-200">
        {renderItem(items[currentIndex], currentIndex)}
      </div>

      {/* Footer Navigation Bar */}
      {total > 1 && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1e2638]">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 transition-all rounded-[1px] ${
                  idx === currentIndex
                    ? "w-6 bg-amber-500"
                    : "w-2 bg-[#2a3447] hover:bg-[#3d4b63]"
                }`}
                aria-label={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-gray-500 mr-2">
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={prevSlide}
              className="p-1 bg-[#171e2b] hover:bg-[#232d40] text-gray-300 hover:text-white border border-[#263246] rounded-sm transition"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-1 bg-[#171e2b] hover:bg-[#232d40] text-gray-300 hover:text-white border border-[#263246] rounded-sm transition"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
