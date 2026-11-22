import React from 'react';

/**
 * SalonLogo — Bespoke Barber Face Silhouette Vector Emblem
 * Faithfully recreates the iconic barber silhouette:
 * 1. Flowing wavy hair crest (top) with signature rightward hook flip
 * 2. Barber shears forming glasses/eyes, central pivot nose bridge & crossed blades with finger tang (middle)
 * 3. Barber comb forming the tapered mustache / goatee (bottom)
 *
 * Theme-aware (gold / obsidian), scalable, and sharp at any resolution.
 */
export const SalonLogo = ({ className = 'w-6 h-6', fill = 'currentColor', ...props }) => {
  return (
    <svg
      viewBox="0 0 100 105"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Studio Kashi Barber Silhouette"
      {...props}
    >
      {/* ----------------------------------------------------
          1. TOP: FLOWING WAVY HAIR CREST & LOCKS
      ---------------------------------------------------- */}
      <g id="hair-locks">
        {/* Main top sweeping crest wave with the upward right curl */}
        <path d="M 10 38 C 18 22, 34 14, 52 14 C 68 14, 80 20, 88 14 C 89 16, 90 20, 87 25 C 84 29, 80 30, 75 27 C 67 22, 55 19, 44 21 C 28 24, 18 31, 10 38 Z" />

        {/* Second layered hair strand */}
        <path d="M 15 40 C 26 27, 42 22, 60 22 C 72 22, 80 26, 85 33 C 80 31, 71 28, 59 28 C 42 28, 28 33, 15 40 Z" />

        {/* Third inner wave */}
        <path d="M 22 42 C 32 32, 46 28, 63 29 C 73 30, 79 34, 83 40 C 77 36, 68 34, 57 34 C 43 34, 31 38, 22 42 Z" />

        {/* Fourth lower wave */}
        <path d="M 30 44 C 38 37, 50 34, 64 35 C 72 36, 77 39, 80 44 C 74 41, 66 39, 57 39 C 46 39, 37 42, 30 44 Z" />

        {/* Fifth bottom hair line */}
        <path d="M 38 46 C 44 41, 54 39, 64 40 C 69 41, 74 43, 76 47 C 71 44, 64 43, 57 43 C 49 43, 43 45, 38 46 Z" />
      </g>

      {/* ----------------------------------------------------
          2. MIDDLE: BARBER SHEARS (Glasses / Eyes & Crossed Blades)
      ---------------------------------------------------- */}
      <g id="barber-shears">
        {/* Left Finger Ring Handle (Outer Ring + Cutout Inner Hole) */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 24 39 C 17.4 39, 12 44.4, 12 51 C 12 57.6, 17.4 63, 24 63 C 30.6 63, 36 57.6, 36 51 C 36 44.4, 30.6 39, 24 39 Z M 24 43.5 C 19.9 43.5, 16.5 46.9, 16.5 51 C 16.5 55.1, 19.9 58.5, 24 58.5 C 28.1 58.5, 31.5 55.1, 31.5 51 C 31.5 46.9, 28.1 43.5, 24 43.5 Z"
        />

        {/* Right Finger Ring Handle with Stylist Finger Rest Tang */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 76 39 C 69.4 39, 64 44.4, 64 51 C 64 57.6, 69.4 63, 76 63 C 82.6 63, 88 57.6, 88 51 C 88 44.4, 82.6 39, 76 39 Z M 76 43.5 C 71.9 43.5, 68.5 46.9, 68.5 51 C 68.5 55.1, 71.9 58.5, 76 58.5 C 80.1 58.5, 83.5 55.1, 83.5 51 C 83.5 46.9, 80.1 43.5, 76 43.5 Z"
        />

        {/* Stylist Finger Rest Tang (Curving gracefully off top-right of handle) */}
        <path d="M 85.5 45 C 90 42, 92 37, 91.5 35 C 90 35.5, 88 38, 86.5 42 Z" />

        {/* Left Shank to Pivot */}
        <path d="M 29 48 C 35 51, 41 55, 50 56.5 C 47 53.5, 39 48, 32 44.5 Z" />

        {/* Right Shank to Pivot */}
        <path d="M 71 48 C 65 51, 59 55, 50 56.5 C 53 53.5, 61 48, 68 44.5 Z" />

        {/* Center Pivot Screw */}
        <circle cx="50" cy="56" r="3.2" />
        <circle cx="50" cy="56" r="1.1" fill="#070A0F" />

        {/* Crossed Scissor Blades */}
        {/* Left blade sweeping down-right to sharp cutting tip */}
        <path d="M 47.5 55.5 L 75 74 C 76.2 74.8, 74.5 76.2, 72 74.8 L 45.5 58.5 Z" />
        {/* Right blade sweeping down-left to sharp cutting tip */}
        <path d="M 52.5 55.5 L 25 74 C 23.8 74.8, 25.5 76.2, 28 74.8 L 54.5 58.5 Z" />
      </g>

      {/* ----------------------------------------------------
          3. BOTTOM: BARBER COMB (Mustache / Smile)
      ---------------------------------------------------- */}
      <g id="comb-mustache">
        {/* Curved Comb Spine with rounded ends */}
        <path d="M 28 76 C 28 74.5, 35 73, 50 73 C 65 73, 72 74.5, 72 76 L 72 77.5 C 72 78, 71 78, 70 78 L 30 78 C 29 78, 28 78, 28 77.5 Z" />

        {/* Tapered Mustache Comb Teeth (Outer shorter, Center longer) */}
        {/* 1 */} <rect x="29.5" y="77.5" width="2" height="6.5" rx="0.6" />
        {/* 2 */} <rect x="33.0" y="77.5" width="2" height="8.0" rx="0.6" />
        {/* 3 */} <rect x="36.5" y="77.5" width="2" height="9.2" rx="0.6" />
        {/* 4 */} <rect x="40.0" y="77.5" width="2" height="10.2" rx="0.6" />
        {/* 5 */} <rect x="43.5" y="77.5" width="2" height="11.0" rx="0.6" />
        {/* 6 */} <rect x="47.0" y="77.5" width="2" height="11.5" rx="0.6" />
        {/* 7 */} <rect x="51.0" y="77.5" width="2" height="11.5" rx="0.6" />
        {/* 8 */} <rect x="54.5" y="77.5" width="2" height="11.0" rx="0.6" />
        {/* 9 */} <rect x="58.0" y="77.5" width="2" height="10.2" rx="0.6" />
        {/* 10 */} <rect x="61.5" y="77.5" width="2" height="9.2" rx="0.6" />
        {/* 11 */} <rect x="65.0" y="77.5" width="2" height="8.0" rx="0.6" />
        {/* 12 */} <rect x="68.5" y="77.5" width="2" height="6.5" rx="0.6" />
      </g>
    </svg>
  );
};

export default SalonLogo;
