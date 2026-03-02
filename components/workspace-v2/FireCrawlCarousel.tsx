// @ts-nocheck
'use client';

// The carousel rendering and event handling is driven by ChatBox.tsx
// (renderCarousel, attachCarouselEvents). This component provides the container elements.
// No separate useEffect needed — ChatBox populates carouselInner via innerHTML.

export default function FireCrawlCarousel() {
  return (
    <div className="carousel-section" id="carouselSection">
      <div className="carousel-fade-left"></div>
      <div className="carousel-fade-right"></div>
      <div className="carousel-inner" id="carouselInner"></div>
    </div>
  );
}
