"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  starsLabel?: (r: number) => string;
}

export function StarRating({ rating, onChange, starsLabel }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-2 sm:gap-3"
        role="radiogroup"
        aria-label="Star rating from 1 to 5"
      >
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= displayRating;
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={rating === starValue}
              aria-label={starsLabel ? starsLabel(starValue) : `${starValue} of 5 stars`}
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 sm:p-2 rounded-full transition-transform active:scale-90 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Star
                className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${
                  isFilled
                    ? "fill-amber-400 text-amber-500 stroke-amber-500 drop-shadow-sm"
                    : "text-slate-300 fill-slate-50 stroke-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <span className="text-sm font-medium text-slate-600 animate-fadeIn">
          {starsLabel ? starsLabel(rating) : `${rating} / 5 stars selected`}
        </span>
      )}
    </div>
  );
}
