// index.css scales the entire app down with `html { zoom: 80% }`.
//
// A CSS zoom belongs to the *visual* coordinate system, not the layout one.
// Everything the browser reports back about the page — getBoundingClientRect(),
// MouseEvent.clientX/clientY — is in zoomed ("client") pixels, while every CSS
// length this app writes back into the page — an SVG user unit, a
// `transform: translate(...)` — is interpreted in the zoomed subtree's own,
// unzoomed space. Measure in one space, write in the other, and the result
// lands at `zoom` times the offset that was intended: 80% of the way there.
//
// react-draggable takes this ratio as its `scale` prop (supported since 3.3.0).
// It divides the pointer deltas it measures in client pixels by `scale` before
// writing them out as a translate, so a dragged column or detail window keeps
// up with the cursor instead of trailing along at 80% of its speed.
//
// Read from the computed style rather than hard-coded, so this stays in step
// with index.css. Where `zoom` is unsupported the parse fails and the fallback
// of 1 is the correct answer anyway, because then nothing is zoomed.
export default function pageZoom() {
  if (typeof window === 'undefined' || !document.documentElement) return 1;
  const zoom = parseFloat(
    window.getComputedStyle(document.documentElement).zoom
  );
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
}
