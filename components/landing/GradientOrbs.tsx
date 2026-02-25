"use client";

/**
 * Drifting gradient blur orbs that float behind content.
 * Inspired by propolis.tech's ambient glow effect.
 */
export default function GradientOrbs({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {/* Orange orb — top right */}
      <div
        className="absolute animate-orb-1"
        style={{
          top: "-10%",
          right: "-5%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(250, 93, 25, 0.06) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      {/* Purple orb — bottom left */}
      <div
        className="absolute animate-orb-2"
        style={{
          bottom: "5%",
          left: "-8%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(144, 97, 255, 0.05) 0%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />
      {/* Small orange orb — mid left */}
      <div
        className="absolute animate-orb-3 hidden lg:block"
        style={{
          top: "40%",
          left: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(250, 93, 25, 0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
