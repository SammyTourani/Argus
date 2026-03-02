'use client';

// JS IIFEs that correspond to this component:
// - Grid canvas animation (heroTemplate1 / #grid-canvas)
// - Vision canvas animation (heroTemplate2 / #vision-canvas)
// - Matrix canvas animation (heroTemplate3 / #matrix-hero-canvas)

export default function HeroBackground() {
  return (
    <div className="hero-bg">
      {/* Template 1: Classic (original dot-matrix) */}
      <div className="hero-template active" id="heroTemplate1">
        <div className="hero-gradient"></div>
        <canvas id="grid-canvas" />
      </div>

      {/* Template 2: Argus Vision */}
      <div className="hero-template" id="heroTemplate2">
        <div className="hero-gradient-vision"></div>
        <canvas id="vision-canvas" />
      </div>

      {/* Template 3: Matrix */}
      <div className="hero-template" id="heroTemplate3">
        <div className="hero-gradient-matrix"></div>
        <canvas id="matrix-hero-canvas" />
        <div className="matrix-vignette"></div>
      </div>
    </div>
  );
}
