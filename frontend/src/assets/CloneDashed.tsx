import React from 'react'

/* FontAwesome's `clone` with its BACK square dashed — the pop-out icon's counterpart,
   so the pair reads as one gesture and its reverse rather than two unrelated glyphs.
   FA has no dashed clone, but the two halves are separable: the front square is FA's
   own regular-weight path verbatim (already notched where the back square crosses it),
   and the back square is redrawn as a stroked centerline rect at the same weight —
   48 units of 512, the thickness FA's regular style uses.

   `pathLength` declares the perimeter as a round 1200 so the dash pattern divides it
   into exactly 16 even dash-and-gap segments; measuring the real rounded-rect perimeter would leave
   a ragged partial dash at the closing corner. */
export const CloneDashed = props => {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fill="currentColor"
        d="M288 464L64 464c-8.8 0-16-7.2-16-16l0-224c0-8.8 7.2-16 16-16l48 0 0-48-48 0c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l224 0c35.3 0 64-28.7 64-64l0-48-48 0 0 48c0 8.8-7.2 16-16 16z"
      />
      <path
        d="M224 24L448 24A40 40 0 0 1 488 64L488 288A40 40 0 0 1 448 328L224 328A40 40 0 0 1 184 288L184 64A40 40 0 0 1 224 24Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="48"
        pathLength="1200"
        strokeDasharray="45 30"
      />
    </svg>
  )
}
