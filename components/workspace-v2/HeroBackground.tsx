// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';

// Module-level variables for matrix animation control (shared with HomePage template switcher)
let matrixRunning = false;
let matrixAnimId = 0;
let matrixResizeHandler: (() => void) | null = null;

export function startMatrixAnimation() {
  if (matrixRunning) return;
  matrixRunning = true;
  _initMatrixHero();
}

export function stopMatrixAnimation() {
  matrixRunning = false;
  if (matrixAnimId) {
    cancelAnimationFrame(matrixAnimId);
    matrixAnimId = 0;
  }
  if (matrixResizeHandler) {
    window.removeEventListener('resize', matrixResizeHandler);
    matrixResizeHandler = null;
  }
}

function _initMatrixHero() {
  var canvas = document.getElementById('matrix-hero-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var CHARS = '0123456789{}()<>/;:=[]&|!?#@$%+-*~^';
  var fontSize = 14;
  var drops: number[] = [];
  var speeds: number[] = [];
  var dpr = window.devicePixelRatio || 1;

  function resize() {
    var parent = canvas!.parentElement;
    if (!parent) return;
    var displayW = parent.offsetWidth;
    var displayH = parent.offsetHeight;
    canvas!.width = displayW * dpr;
    canvas!.height = displayH * dpr;
    canvas!.style.width = displayW + 'px';
    canvas!.style.height = displayH + 'px';
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.fillStyle = '#060606';
    ctx!.fillRect(0, 0, displayW, displayH);
    var cols = Math.floor(displayW / fontSize);
    drops = [];
    speeds = [];
    for (var i = 0; i < cols; i++) {
      drops.push(Math.random() * -60);
      speeds.push(0.15 + Math.random() * 0.45);
    }
  }

  resize();
  matrixResizeHandler = resize;
  window.addEventListener('resize', matrixResizeHandler);

  function draw() {
    if (!matrixRunning) return;
    var w = canvas!.offsetWidth;
    var h = canvas!.offsetHeight;

    ctx!.fillStyle = 'rgba(6, 6, 6, 0.04)';
    ctx!.fillRect(0, 0, w, h);

    ctx!.font = fontSize + "px 'JetBrains Mono', 'Geist Mono', monospace";
    ctx!.textBaseline = 'top';

    for (var i = 0; i < drops.length; i++) {
      var x = i * fontSize;
      var y = drops[i] * fontSize;

      if (y > -fontSize * 2 && y < h + fontSize) {
        var char = CHARS[Math.floor(Math.random() * CHARS.length)];

        ctx!.fillStyle = 'rgba(250, 93, 25, 0.9)';
        ctx!.fillText(char, x, y);

        if (drops[i] - 1 > 0) {
          ctx!.fillStyle = 'rgba(250, 93, 25, 0.4)';
          ctx!.fillText(
            CHARS[Math.floor(Math.random() * CHARS.length)],
            x, (drops[i] - 1) * fontSize
          );
        }

        for (var t = 2; t <= 6; t++) {
          var trailY = (drops[i] - t) * fontSize;
          if (trailY > 0 && trailY < h) {
            var alpha = 0.18 * Math.pow(0.5, t - 1);
            ctx!.fillStyle = 'rgba(250, 93, 25, ' + Math.max(alpha, 0.012) + ')';
            ctx!.fillText(
              CHARS[Math.floor(Math.random() * CHARS.length)],
              x, trailY
            );
          }
        }
      }

      if (y > h && Math.random() > 0.98) {
        drops[i] = Math.random() * -30;
        speeds[i] = 0.15 + Math.random() * 0.45;
      }
      drops[i] += speeds[i];
    }

    matrixAnimId = requestAnimationFrame(draw);
  }
  draw();
}

export default function HeroBackground() {
  const gridAnimRef = useRef<number>(0);
  const visionAnimRef = useRef<number>(0);

  // ===== initGrid — Dot-matrix grid canvas animation =====
  useEffect(() => {
    var canvas = document.getElementById('grid-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var w: number, h: number, cols: number, rows: number;
    var time = 0;
    var dotChars = '\u00B7';
    var codeChars = '01{}[]<>()=+-;:_|/\\#@&*~';
    var grid: Array<{ x: number; y: number; char: string; phase: number; speed: number; isCode: boolean; codeTimer: number; codeChar: string }> = [];
    var gridDpr = window.devicePixelRatio || 1;
    var running = true;

    function resize() {
      var displayW = canvas!.parentElement!.offsetWidth;
      var displayH = canvas!.parentElement!.offsetHeight;
      canvas!.width = displayW * gridDpr;
      canvas!.height = displayH * gridDpr;
      canvas!.style.width = displayW + 'px';
      canvas!.style.height = displayH + 'px';
      ctx!.setTransform(gridDpr, 0, 0, gridDpr, 0, 0);
      w = displayW;
      h = displayH;
      var spacing = 20;
      cols = Math.ceil(w / spacing);
      rows = Math.ceil(h / spacing);
      initGridData();
    }

    function initGridData() {
      grid = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          grid.push({
            x: c * 20 + 10, y: r * 20 + 10,
            char: dotChars, phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.4,
            isCode: false, codeTimer: 0, codeChar: '',
          });
        }
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!running) return;
      time += 0.016;
      ctx!.clearRect(0, 0, w, h);
      var centerX = w * 0.5;
      var centerY = h * 0.4;

      for (var i = 0; i < grid.length; i++) {
        var cell = grid[i];
        var dx = cell.x - centerX;
        var dy = cell.y - centerY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        var normalizedDist = dist / maxDist;
        var wave1 = Math.sin(dist * 0.015 - time * 1.2 + cell.phase * 0.3);
        var wave2 = Math.sin(dist * 0.008 - time * 0.7 + Math.PI);
        var wave = (wave1 + wave2) * 0.5;
        var centerFalloff = 1 - normalizedDist * 0.6;
        var baseOpacity = Math.max(0, centerFalloff * 0.2);
        var opacity = baseOpacity + wave * 0.1;
        if (opacity <= 0.01) continue;

        if (!cell.isCode && Math.random() < 0.0004) {
          cell.isCode = true;
          cell.codeTimer = 2 + Math.random() * 4;
          cell.codeChar = codeChars[Math.floor(Math.random() * codeChars.length)];
        }
        if (cell.isCode) {
          cell.codeTimer -= 0.016;
          if (cell.codeTimer <= 0) cell.isCode = false;
        }

        var displayChar = cell.isCode ? cell.codeChar : dotChars;
        var size = cell.isCode ? 11 : 8;
        if (cell.isCode) {
          ctx!.fillStyle = 'rgba(255, 72, 1, ' + Math.min(opacity * 5, 0.55) + ')';
        } else {
          ctx!.fillStyle = 'rgba(255, 72, 1, ' + Math.min(opacity * 2.5, 0.25) + ')';
        }
        ctx!.font = size + "px 'Geist Mono', monospace";
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText(displayChar, cell.x, cell.y);
      }

      var scanY = ((time * 30) % (h + 200)) - 100;
      var scanGrad = ctx!.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      scanGrad.addColorStop(0, 'rgba(255, 72, 1, 0)');
      scanGrad.addColorStop(0.5, 'rgba(255, 72, 1, 0.03)');
      scanGrad.addColorStop(1, 'rgba(255, 72, 1, 0)');
      ctx!.fillStyle = scanGrad;
      ctx!.fillRect(0, scanY - 60, w, 120);

      gridAnimRef.current = requestAnimationFrame(draw);
    }
    gridAnimRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(gridAnimRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ===== initVision — Argus Vision background animation =====
  useEffect(() => {
    var canvas = document.getElementById('vision-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var w: number, h: number, cols: number, rows: number;
    var time = 0;
    var numChars = '0123456789';
    var grid: Array<{ x: number; y: number; char: string; phase: number; speed: number; nextChange: number; baseInterval: number; flash: number; col: number; row: number }> = [];
    var visionDpr = window.devicePixelRatio || 1;
    var frameCount = 0;
    var running = true;

    // --- Video + offscreen canvas for pixel processing ---
    var eyeVideo = document.createElement('video');
    eyeVideo.src = '/argus-assets/final-eye-animation.mp4';
    eyeVideo.loop = true;
    eyeVideo.muted = true;
    eyeVideo.playsInline = true;
    eyeVideo.setAttribute('playsinline', '');
    eyeVideo.play().catch(function() {});

    var OFFSCREEN_W = 427;
    var OFFSCREEN_H = 240;
    var offCanvas = document.createElement('canvas');
    offCanvas.width = OFFSCREEN_W;
    offCanvas.height = OFFSCREEN_H;
    var offCtx = offCanvas.getContext('2d', { willReadFrequently: true })!;

    var cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = OFFSCREEN_W;
    cacheCanvas.height = OFFSCREEN_H;
    var cacheCtx = cacheCanvas.getContext('2d')!;

    var eyeReady = false;
    eyeVideo.addEventListener('canplaythrough', function() { eyeReady = true; });
    if (eyeVideo.readyState >= 4) eyeReady = true;

    function processEyeFrame() {
      if (!eyeReady || eyeVideo.readyState < 2) return;
      offCtx.drawImage(eyeVideo, 0, 0, OFFSCREEN_W, OFFSCREEN_H);
      var imageData = offCtx.getImageData(0, 0, OFFSCREEN_W, OFFSCREEN_H);
      var data = imageData.data;
      var EDGE_FADE = 10;
      var idx = 0;
      for (var py = 0; py < OFFSCREEN_H; py++) {
        var yDist = Math.min(py, OFFSCREEN_H - 1 - py);
        for (var px = 0; px < OFFSCREEN_W; px++) {
          var i = idx * 4;
          var edgeDist = Math.min(px, OFFSCREEN_W - 1 - px, yDist);
          var edgeFade = edgeDist < EDGE_FADE ? edgeDist / EDGE_FADE : 1;

          var luminance = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
          var darkness = 1 - luminance / 255;
          if (darkness < 0.10) darkness = 0;
          else darkness = Math.min(1, (darkness - 0.10) * 2.2);
          data[i] = 255;
          data[i+1] = 255;
          data[i+2] = 255;
          data[i+3] = (darkness * edgeFade * 255) | 0;
          idx++;
        }
      }
      cacheCtx.putImageData(imageData, 0, 0);
    }

    function resize() {
      var parent = canvas!.parentElement;
      if (!parent) return;
      var displayW = parent.offsetWidth;
      var displayH = parent.offsetHeight;
      canvas!.width = displayW * visionDpr;
      canvas!.height = displayH * visionDpr;
      canvas!.style.width = displayW + 'px';
      canvas!.style.height = displayH + 'px';
      ctx!.setTransform(visionDpr, 0, 0, visionDpr, 0, 0);
      w = displayW;
      h = displayH;
      var spacing = 22;
      cols = Math.ceil(w / spacing);
      rows = Math.ceil(h / spacing);
      buildGrid(spacing);
    }

    function buildGrid(spacing: number) {
      grid = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          grid.push({
            x: c * spacing + spacing * 0.5,
            y: r * spacing + spacing * 0.5,
            char: numChars[Math.floor(Math.random() * numChars.length)],
            phase: Math.random() * Math.PI * 2,
            speed: 0.15 + Math.random() * 0.25,
            nextChange: Math.random() * 0.5,
            baseInterval: 0.04 + Math.random() * 0.12,
            flash: 0,
            col: c,
            row: r
          });
        }
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!running) return;
      time += 0.016;
      frameCount++;
      ctx!.clearRect(0, 0, w, h);
      var centerX = w * 0.5;
      var centerY = h * 0.5;
      var maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      // --- Draw eye watermark FIRST (underneath numbers) ---
      if (frameCount % 3 === 0) processEyeFrame();

      if (eyeReady) {
        var eyeW = w * 0.60;
        var eyeH = eyeW * (OFFSCREEN_H / OFFSCREEN_W);
        var eyeX = centerX - eyeW * 0.5 - 15;
        var eyeY = centerY - eyeH * 0.5;
        ctx!.globalAlpha = 0.62;
        ctx!.drawImage(cacheCanvas, eyeX, eyeY, eyeW, eyeH);
        ctx!.globalAlpha = 1.0;
      }

      // --- Draw numbers ON TOP of eye ---
      ctx!.font = "10px 'Geist Mono', 'SF Mono', monospace";
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      // Randomly trigger column cascades (matrix rain effect)
      if (Math.random() < 0.09) {
        var cascadeCol = Math.floor(Math.random() * cols);
        for (var ci = 0; ci < grid.length; ci++) {
          if (grid[ci].col === cascadeCol) {
            grid[ci].nextChange = grid[ci].row * 0.02;
            grid[ci].flash = 0.7;
          }
        }
      }

      for (var i = 0; i < grid.length; i++) {
        var cell = grid[i];

        cell.nextChange -= 0.016;
        if (cell.nextChange <= 0) {
          cell.char = numChars[Math.floor(Math.random() * numChars.length)];
          cell.nextChange = cell.baseInterval + Math.random() * 0.08;
          if (Math.random() < 0.08) cell.flash = 0.5;
        }
        if (cell.flash > 0) cell.flash -= 0.03;

        var dx = cell.x - centerX;
        var dy = cell.y - centerY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var normalizedDist = dist / maxDist;

        var wave = Math.sin(dist * 0.008 - time * 0.4 + cell.phase * 0.3);
        var centerFalloff = 1 - normalizedDist * 0.3;
        var baseOpacity = centerFalloff * 0.26 + wave * 0.07;
        var flashBoost = cell.flash > 0 ? cell.flash * 0.18 : 0;
        var opacity = Math.max(0, Math.min(baseOpacity + flashBoost, 0.50));
        if (opacity <= 0.01) continue;

        // Use workspace-root dark class instead of body dark-mode
        var wsRoot = document.querySelector('.workspace-root');
        var isDark = wsRoot ? wsRoot.classList.contains('dark') : document.body.classList.contains('dark-mode');
        if (cell.flash > 0.25) {
          ctx!.fillStyle = isDark
            ? 'rgba(255, 255, 255, ' + opacity.toFixed(3) + ')'
            : 'rgba(120, 120, 120, ' + opacity.toFixed(3) + ')';
        } else {
          ctx!.fillStyle = isDark
            ? 'rgba(240, 240, 240, ' + opacity.toFixed(3) + ')'
            : 'rgba(105, 105, 105, ' + opacity.toFixed(3) + ')';
        }
        ctx!.fillText(cell.char, cell.x, cell.y);
      }

      visionAnimRef.current = requestAnimationFrame(draw);
    }
    visionAnimRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(visionAnimRef.current);
      window.removeEventListener('resize', resize);
      eyeVideo.pause();
      eyeVideo.removeAttribute('src');
      eyeVideo.load();
    };
  }, []);

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
