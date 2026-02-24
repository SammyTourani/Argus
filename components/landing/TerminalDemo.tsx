"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TerminalLine {
  text: string;
  color?: string;
  delay?: number;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const SEQUENCE: { type: "type" | "line" | "spinner" | "files" | "result" | "cta"; data: string; delay: number }[] = [
  { type: "type", data: "$ argus clone https://linear.app --style brutalism", delay: 1600 },
  { type: "spinner", data: "Scraping linear.app...", delay: 1500 },
  { type: "line", data: "✓ Scraped 847 elements, 12 components identified    1.2s", delay: 500 },
  { type: "line", data: "✓ Brand extracted: #5E6AD2, Inter, 8px radius       0.3s", delay: 500 },
  { type: "spinner", data: "Generating React components...", delay: 500 },
  { type: "files", data: "", delay: 0 },
  { type: "result", data: "▸ Live preview ready at localhost:5173          total: 28.4s", delay: 500 },
  { type: "cta", data: "", delay: 0 },
];

const FILES = [
  { name: "App.tsx", dots: "·················" },
  { name: "Header.tsx", dots: "··············" },
  { name: "HeroSection.tsx", dots: "·········" },
  { name: "FeatureGrid.tsx", dots: "·········" },
  { name: "PricingTable.tsx", dots: "········" },
  { name: "Footer.tsx", dots: "··············" },
  { name: "styles/globals.css", dots: "······" },
];

export default function TerminalDemo() {
  const [lines, setLines] = useState<{ text: string; className: string }[]>([]);
  const [typingText, setTypingText] = useState("");
  const [spinnerText, setSpinnerText] = useState("");
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [fileStatuses, setFileStatuses] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [started, setStarted] = useState(false);
  const [cursorBlink, setCursorBlink] = useState(true);
  const termRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll terminal to bottom
  const scrollToBottom = useCallback(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, []);

  // Start on scroll into view
  useEffect(() => {
    const el = termRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [started]);

  // Run the animation sequence
  useEffect(() => {
    if (!started) return;

    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const typeText = async (text: string, speed: number) => {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        setTypingText(text.slice(0, i));
        await sleep(speed);
      }
    };

    const runSpinner = async (text: string, duration: number) => {
      setSpinnerText(text);
      const start = Date.now();
      let idx = 0;
      while (Date.now() - start < duration) {
        if (cancelled) return;
        setSpinnerIdx(idx % SPINNER.length);
        idx++;
        await sleep(80);
      }
      setSpinnerText("");
    };

    const run = async () => {
      // Initial cursor blink
      setCursorBlink(true);
      await sleep(800);
      setCursorBlink(false);

      // Type command
      await typeText("$ argus clone https://linear.app --style brutalism", 40);
      await sleep(300);
      setLines((prev) => [
        ...prev,
        { text: "$ argus clone https://linear.app --style brutalism", className: "text-white" },
      ]);
      setTypingText("");
      scrollToBottom();

      // Blank line
      setLines((prev) => [...prev, { text: "", className: "" }]);
      await sleep(200);

      // Scraping spinner
      await runSpinner("Scraping linear.app...", 1500);
      setLines((prev) => [
        ...prev,
        { text: "✓ Scraped 847 elements, 12 components identified    1.2s", className: "text-[#42C366]" },
      ]);
      scrollToBottom();
      await sleep(400);

      setLines((prev) => [
        ...prev,
        { text: "✓ Brand extracted: #5E6AD2, Inter, 8px radius       0.3s", className: "text-[#42C366]" },
      ]);
      scrollToBottom();
      await sleep(500);

      // Blank line
      setLines((prev) => [...prev, { text: "", className: "" }]);

      // Generating spinner
      await runSpinner("Generating React components...", 800);
      setLines((prev) => [
        ...prev,
        { text: "Generating React components...", className: "text-white/60" },
      ]);
      scrollToBottom();
      await sleep(300);

      // File tree animation
      const statuses = new Array(FILES.length).fill("queued");
      setFileStatuses([...statuses]);

      for (let i = 0; i < FILES.length; i++) {
        if (cancelled) return;
        statuses[i] = "streaming";
        setFileStatuses([...statuses]);
        scrollToBottom();
        await sleep(250);

        if (i > 0) {
          statuses[i - 1] = "done";
          setFileStatuses([...statuses]);
        }
        await sleep(200);
      }
      statuses[FILES.length - 1] = "done";
      setFileStatuses([...statuses]);
      scrollToBottom();
      await sleep(600);

      // Blank + result
      setLines((prev) => [...prev, { text: "", className: "" }]);
      setShowResult(true);
      scrollToBottom();
      await sleep(500);
      setShowCta(true);
      scrollToBottom();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [started, scrollToBottom]);

  return (
    <section className="w-full bg-[#0B0B0E] py-48 lg:py-80">
      <div className="max-w-900 mx-auto px-16 lg:px-24">
        <h2 className="text-title-h3 lg:text-title-h2 text-center text-white mb-32 lg:mb-48 font-sans">
          Don&apos;t imagine it. Watch it.
        </h2>

        {/* Terminal window */}
        <div className="rounded-12 border border-[#1E1E24] overflow-hidden shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center gap-8 px-16 py-12 bg-[#161618] border-b border-[#1E1E24]">
            <div className="flex gap-6">
              <span className="w-12 h-12 rounded-full bg-[#FF5F57]" />
              <span className="w-12 h-12 rounded-full bg-[#FEBC2E]" />
              <span className="w-12 h-12 rounded-full bg-[#28C840]" />
            </div>
            <span className="text-[#71717A] text-mono-x-small ml-auto">
              argus &mdash; terminal
            </span>
          </div>

          {/* Terminal body */}
          <div
            ref={termRef}
            className="bg-[#0F0F12] p-12 sm:p-16 lg:p-24 font-ascii text-[11px] sm:text-[14px] leading-[18px] sm:leading-[22px] min-h-[280px] sm:min-h-[320px] max-h-[480px] overflow-y-auto overflow-x-auto"
          >
            {/* Cursor blink before typing */}
            {cursorBlink && lines.length === 0 && !typingText && (
              <div className="text-white">
                <span className="animate-cursor-blink">█</span>
              </div>
            )}

            {/* Rendered lines */}
            {lines.map((line, i) => (
              <div key={i} className={line.className || "text-white/60"}>
                {line.text || "\u00A0"}
              </div>
            ))}

            {/* Currently typing */}
            {typingText && (
              <div className="text-white">
                {typingText}
                <span className="animate-cursor-blink text-heat-100">█</span>
              </div>
            )}

            {/* Spinner */}
            {spinnerText && (
              <div className="text-heat-100">
                {SPINNER[spinnerIdx]} {spinnerText}
              </div>
            )}

            {/* File tree */}
            {fileStatuses.length > 0 && (
              <div className="mt-4">
                {FILES.map((file, i) => {
                  if (i >= fileStatuses.length || !fileStatuses[i]) return null;
                  const isLast = i === FILES.length - 1;
                  const prefix = isLast ? "└──" : "├──";
                  const status = fileStatuses[i];
                  const statusColor =
                    status === "done"
                      ? "text-[#42C366]"
                      : status === "streaming"
                        ? "text-heat-100 animate-pulse"
                        : "text-[#71717A]";
                  const statusText =
                    status === "done" ? "done ✓" : status === "streaming" ? "streaming" : "queued";

                  return (
                    <div key={file.name} className="text-white/80">
                      {prefix} {file.name} {file.dots} <span className={statusColor}>{statusText}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Result */}
            {showResult && (
              <div className="text-[#42C366] mt-8">
                ▸ Live preview ready at localhost:5173          total: 28.4s
              </div>
            )}

            {/* CTA buttons */}
            {showCta && (
              <div className="flex gap-12 mt-16">
                <a
                  href="/generation"
                  className="px-16 py-8 bg-heat-100 text-white rounded-8 text-label-small hover:opacity-90 transition-opacity"
                >
                  Open Live Preview
                </a>
                <button className="px-16 py-8 border border-[#333] text-white/60 rounded-8 text-label-small hover:text-white hover:border-[#555] transition-colors">
                  Download ZIP
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
