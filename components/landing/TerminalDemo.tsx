"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

const SPINNER = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];

const FILES = [
  { name: "App.tsx", dots: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" },
  { name: "Header.tsx", dots: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" },
  { name: "HeroSection.tsx", dots: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" },
  { name: "FeatureGrid.tsx", dots: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" },
  { name: "PricingTable.tsx", dots: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" },
  { name: "Footer.tsx", dots: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" },
  { name: "styles/globals.css", dots: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" },
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

  const scrollToBottom = useCallback(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    const el = termRef.current;
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.1 }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [started]);

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
      setCursorBlink(true);
      await sleep(800);
      setCursorBlink(false);
      await typeText("$ argus clone https://linear.app --style brutalism", 40);
      await sleep(300);
      setLines((p) => [...p, { text: "$ argus clone https://linear.app --style brutalism", className: "text-white" }]);
      setTypingText("");
      scrollToBottom();
      setLines((p) => [...p, { text: "", className: "" }]);
      await sleep(200);
      await runSpinner("Scraping linear.app...", 1500);
      setLines((p) => [...p, { text: "\u2713 Scraped 847 elements, 12 components identified    1.2s", className: "text-[#42C366]" }]);
      scrollToBottom();
      await sleep(400);
      setLines((p) => [...p, { text: "\u2713 Brand extracted: #5E6AD2, Inter, 8px radius       0.3s", className: "text-[#42C366]" }]);
      scrollToBottom();
      await sleep(500);
      setLines((p) => [...p, { text: "", className: "" }]);
      await runSpinner("Generating React components...", 800);
      setLines((p) => [...p, { text: "Generating React components...", className: "text-white/60" }]);
      scrollToBottom();
      await sleep(300);
      const statuses = new Array(FILES.length).fill("queued");
      setFileStatuses([...statuses]);
      for (let i = 0; i < FILES.length; i++) {
        if (cancelled) return;
        statuses[i] = "streaming";
        setFileStatuses([...statuses]);
        scrollToBottom();
        await sleep(250);
        if (i > 0) { statuses[i - 1] = "done"; setFileStatuses([...statuses]); }
        await sleep(200);
      }
      statuses[FILES.length - 1] = "done";
      setFileStatuses([...statuses]);
      scrollToBottom();
      await sleep(600);
      setLines((p) => [...p, { text: "", className: "" }]);
      setShowResult(true);
      scrollToBottom();
      await sleep(500);
      setShowCta(true);
      scrollToBottom();
    };

    run();
    return () => { cancelled = true; };
  }, [started, scrollToBottom]);

  return (
    <section className="w-full py-48 lg:py-80 relative">
      <div className="max-w-900 mx-auto px-16 lg:px-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-24">
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--landing-text-tertiary)]">[ TERMINAL ]</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-32 lg:mb-48 font-sans"
        >
          Don&apos;t imagine it. Watch it.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-12 border border-[var(--landing-border)] overflow-hidden relative scanline-overlay"
          style={{ boxShadow: "0 25px 80px -12px rgba(0,0,0,0.5), 0 0 60px -20px rgba(250,93,25,0.06)" }}
        >
          {/* macOS title bar */}
          <div className="flex items-center gap-8 px-16 py-10 bg-[#0E0E13] border-b border-[var(--landing-border)] relative z-[2]">
            <div className="flex gap-7">
              <span className="w-12 h-12 rounded-full bg-[#FF5F57]" />
              <span className="w-12 h-12 rounded-full bg-[#FEBC2E]" />
              <span className="w-12 h-12 rounded-full bg-[#28C840]" />
            </div>
            <span className="text-[#555] text-mono-x-small ml-auto font-mono">argus &mdash; terminal</span>
          </div>

          <div
            ref={termRef}
            className="bg-[#08080C] p-12 sm:p-16 lg:p-24 font-ascii text-[11px] sm:text-[14px] leading-[18px] sm:leading-[22px] min-h-[280px] sm:min-h-[320px] max-h-[480px] overflow-y-auto overflow-x-auto relative z-[2]"
          >
            {cursorBlink && lines.length === 0 && !typingText && (
              <div className="text-white"><span className="animate-cursor-blink">{"\u2588"}</span></div>
            )}
            {lines.map((line, i) => (
              <div key={i} className={line.className || "text-white/60"}>{line.text || "\u00A0"}</div>
            ))}
            {typingText && (
              <div className="text-white">{typingText}<span className="animate-cursor-blink text-heat-100">{"\u2588"}</span></div>
            )}
            {spinnerText && <div className="text-heat-100">{SPINNER[spinnerIdx]} {spinnerText}</div>}
            {fileStatuses.length > 0 && (
              <div className="mt-4">
                {FILES.map((file, i) => {
                  if (i >= fileStatuses.length || !fileStatuses[i]) return null;
                  const isLast = i === FILES.length - 1;
                  const prefix = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500";
                  const status = fileStatuses[i];
                  const statusColor = status === "done" ? "text-[#42C366]" : status === "streaming" ? "text-heat-100 animate-pulse" : "text-[#555]";
                  const statusText = status === "done" ? "done \u2713" : status === "streaming" ? "streaming" : "queued";
                  return (
                    <div key={file.name} className="text-white/80">
                      {prefix} {file.name} {file.dots} <span className={statusColor}>{statusText}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {showResult && <div className="text-[#42C366] mt-8">{"\u25B8"} Live preview ready at localhost:5173          total: 28.4s</div>}
            {showCta && (
              <div className="flex gap-12 mt-16">
                <a href="/generation" className="px-16 py-8 bg-heat-100 text-white rounded-8 text-label-small hover:opacity-90 transition-opacity">Open Live Preview</a>
                <button className="px-16 py-8 border border-[var(--landing-border)] text-white/60 rounded-8 text-label-small hover:text-white hover:border-[var(--landing-border-hover)] transition-colors">Download ZIP</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
