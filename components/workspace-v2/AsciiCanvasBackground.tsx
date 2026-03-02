// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';

export default function AsciiCanvasBackground() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    var canvas = document.getElementById('asciiCanvas') as HTMLCanvasElement | null;
    var parent = document.getElementById('asciiBg');
    if (!canvas || !parent) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var CODE_CHARS = '{}()<>/;:=01[]&|!?#@$%_+-*~^';
    var DENSITY = 18;
    var OPACITY = 0.30;
    var scrollY = 0;
    var grid: { x: number; y: number; char: string; changeAt: number; seed: number }[] = [];
    var animId: number;

    var vw = 0, vh = 0, centerX = 0, centerY = 0;
    var fontSize = Math.max(DENSITY - 4, 10);
    var fontStr = fontSize + 'px "Geist Mono", "Roboto Mono", "JetBrains Mono", monospace';
    var halfD = DENSITY / 2;

    // Pre-render each character to a tiny offscreen canvas (sprite).
    // drawImage (GPU blit) is ~3-5x faster than fillText (CPU rasterize).
    var charSprites: Record<string, HTMLCanvasElement> = {};
    for (var c = 0; c < CODE_CHARS.length; c++) {
      var ch = CODE_CHARS[c];
      var off = document.createElement('canvas');
      off.width = DENSITY;
      off.height = DENSITY;
      var oc = off.getContext('2d')!;
      oc.font = fontStr;
      oc.textBaseline = 'middle';
      oc.fillStyle = 'rgb(82,16,0)';
      oc.fillText(ch, 0, halfD);
      charSprites[ch] = off;
    }

    // Panel culling — skip cells behind the opaque panel
    var panelEl = document.querySelector('.pricing-panel');
    var cullEnabled = false;
    var CULL_PAD = 20;
    var pL = 0, pR = 0, pT = 0, pB = 0;

    function updatePanelBounds() {
      if (!panelEl) return;
      var pr = panelEl.getBoundingClientRect();
      pL = pr.left + CULL_PAD;
      pR = pr.right - CULL_PAD;
      pT = pr.top + CULL_PAD;
      pB = pr.bottom - CULL_PAD;
    }

    var cullTimeout = setTimeout(function() {
      cullEnabled = true;
      updatePanelBounds();
    }, 700);

    function initGrid(width: number, height: number) {
      var g: { x: number; y: number; char: string; changeAt: number; seed: number }[] = [];
      var now = performance.now();
      for (var x = 0; x < width; x += DENSITY) {
        for (var y = 0; y < height; y += DENSITY) {
          g.push({
            x: x,
            y: y,
            char: CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
            changeAt: now + 500 + Math.random() * 1500,
            seed: Math.random() * Math.PI * 2
          });
        }
      }
      return g;
    }

    function resize() {
      vw = window.innerWidth;
      vh = window.innerHeight;
      centerX = vw / 2;
      centerY = vh / 2;
      // 1x resolution — CSS scales canvas to fill viewport.
      // Decorative BG doesn't need Retina; saves 75% pixel work on 2x displays.
      canvas!.width = vw;
      canvas!.height = vh;
      grid = initGrid(vw, vh);
      if (cullEnabled) updatePanelBounds();
    }

    resize();
    window.addEventListener('resize', resize);

    var scrollHandler = function() {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    function draw(time: number) {
      animId = requestAnimationFrame(draw);

      ctx!.clearRect(0, 0, vw, vh);

      var sc = scrollY;
      var cull = cullEnabled;
      var len = grid.length;

      for (var i = 0; i < len; i++) {
        var cell = grid[i];

        if (cull && cell.x > pL && cell.x < pR && cell.y > pT && cell.y < pB) continue;

        // Character cycling
        if (time > cell.changeAt) {
          cell.char = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
          cell.changeAt = time + 500 + Math.random() * 1500;
        }

        // Scroll-linked wave distortion
        var scrollWave = Math.sin(cell.x * 0.01 + cell.y * 0.006 + sc * 0.004 + cell.seed);
        var timeWave = Math.sin(cell.x * 0.016 + time * 0.0012 + cell.seed)
                     * Math.cos(cell.y * 0.012 + time * 0.0008);

        var drawX = cell.x + scrollWave * 6 + timeWave * 5;
        var drawY = cell.y + timeWave * 4 + Math.sin(cell.x * 0.02 + sc * 0.002) * 3;

        // Radial opacity falloff from center
        var nxC = (drawX - centerX) / (centerX || 1);
        var nyC = (drawY - centerY) / (centerY || 1);
        var distFromCenter = Math.sqrt(nxC * nxC + nyC * nyC);
        var radialFade = distFromCenter * 0.8;
        if (radialFade > 1) radialFade = 1;
        var waveBrightness = 0.6 + scrollWave * 0.2 + timeWave * 0.2;
        var alpha = OPACITY * radialFade * waveBrightness * 0.8;

        if (alpha < 0.01) continue;

        // Sprite blit — orders of magnitude faster than fillText
        ctx!.globalAlpha = alpha;
        ctx!.drawImage(charSprites[cell.char], drawX, drawY - halfD);
      }

      ctx!.globalAlpha = 1;
    }

    animId = requestAnimationFrame(draw);

    // Pause when tab hidden
    var visibilityHandler = function() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(cullTimeout);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scrollHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  return (
    <div className="ascii-bg" id="asciiBg">
      <canvas id="asciiCanvas" />
    </div>
  );
}
