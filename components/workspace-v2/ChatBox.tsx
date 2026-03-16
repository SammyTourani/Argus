// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { CONFIG, state, validateUrl, isURL, showToast } from './workspace-state';
import { searchWeb, createProject, createBuild } from './workspace-api';
import { getActiveTeamId } from './workspace-active';

export default function ChatBox() {
  // ===== Chat input handling, URL detection, options panel, style grid, model select, submit =====
  useEffect(() => {
    var chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
    var inputIcon = document.getElementById('inputIcon');
    var submitBtn = document.getElementById('submitBtn');
    var submitText = document.getElementById('submitText');
    var inputRow = document.getElementById('inputRow');
    var selectRow = document.getElementById('selectRow');
    var optionsPanel = document.getElementById('optionsPanel');
    var toggleSwitch = document.getElementById('toggleSwitch');
    var brandWrap = document.getElementById('brandWrap');
    var styleGridWrap = document.getElementById('styleGridWrap');
    var styleGrid = document.getElementById('styleGrid');
    var modelSelect = document.getElementById('modelSelect') as HTMLSelectElement | null;
    var instrInput = document.getElementById('instrInput') as HTMLInputElement | null;
    var carouselSection = document.getElementById('carouselSection');
    var carouselInner = document.getElementById('carouselInner');
    var centerContent = document.getElementById('centerContent');
    var searchAgainBtn = document.getElementById('searchAgainBtn');
    var toggleRow = document.getElementById('toggleRow');

    if (!chatInput || !submitBtn || !styleGrid || !modelSelect) return;

    var cancelled = false;
    var pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    function safeTimeout(fn: Function, ms: number) {
      var id = setTimeout(fn, ms);
      pendingTimeouts.push(id);
      return id;
    }

    // SVG templates
    var ICON_SEARCH = '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="M12.5 12.5L16.5 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    var ICON_SCRAPE = '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 10L9 12L13 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // ===== INIT STYLE GRID =====
    CONFIG.styles.forEach(function(s) {
      var btn = document.createElement('button');
      btn.className = 'style-btn';
      btn.textContent = s.name;
      btn.dataset.id = s.id;
      if (s.id === state.selectedStyle) btn.classList.add('selected');
      btn.addEventListener('click', function() {
        state.selectedStyle = s.id;
        styleGrid!.querySelectorAll('.style-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
      styleGrid!.appendChild(btn);
    });

    // ===== INIT MODEL SELECT =====
    CONFIG.models.forEach(function(m) {
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      modelSelect!.appendChild(opt);
    });

    function handleModelChange(this: HTMLSelectElement) { state.selectedModel = this.value; }
    modelSelect.addEventListener('change', handleModelChange);

    // ===== UPDATE FUNCTIONS =====
    function updateInputIcon() {
      if (inputIcon) inputIcon.innerHTML = isURL(state.url) ? ICON_SCRAPE : ICON_SEARCH;
    }

    function updateSubmitButton() {
      var hasValue = state.url.trim().length > 0;
      submitBtn!.classList.toggle('expanded', hasValue);
      if (submitText) submitText.textContent = isURL(state.url) ? 'Scrape Site' : 'Search';
    }

    function updateOptionsPanel() {
      if (state.isValidUrl && !state.hasSearched) {
        optionsPanel!.classList.add('visible');
        var btns = styleGrid!.querySelectorAll('.style-btn');
        btns.forEach(function(btn, i) {
          (btn as HTMLElement).style.transitionDelay = (150 + i * 35) + 'ms';
          safeTimeout(function() { btn.classList.add('visible'); }, 10);
        });
      } else {
        optionsPanel!.classList.remove('visible');
        styleGrid!.querySelectorAll('.style-btn').forEach(function(btn) {
          btn.classList.remove('visible');
          (btn as HTMLElement).style.transitionDelay = '0ms';
        });
      }
    }

    function updateInputMode() {
      if (state.hasSearched && state.searchResults.length > 0 && !state.isFadingOut) {
        inputRow!.style.display = 'none';
        selectRow!.classList.add('visible');
      } else {
        inputRow!.style.display = 'flex';
        selectRow!.classList.remove('visible');
      }
    }

    function updateCarouselLayout() {
      if (state.showSearchTiles && state.hasSearched) {
        carouselSection!.classList.add('visible');
        centerContent!.classList.add('compact');
      } else {
        carouselSection!.classList.remove('visible');
        centerContent!.classList.remove('compact');
      }
    }

    // ===== TOGGLE (extend brand styles) =====
    function handleToggleClick() {
      state.extendBrandStyles = !state.extendBrandStyles;
      toggleSwitch!.classList.toggle('active', state.extendBrandStyles);
      brandWrap!.classList.toggle('visible', state.extendBrandStyles);
      styleGridWrap!.classList.toggle('hidden', state.extendBrandStyles);
      instrInput!.style.display = state.extendBrandStyles ? 'none' : '';
      modelSelect!.style.flex = state.extendBrandStyles ? '1' : '';
    }
    if (toggleRow) toggleRow.addEventListener('click', handleToggleClick);

    // ===== INPUT HANDLER =====
    function handleInput(this: HTMLInputElement) {
      state.url = this.value;
      state.isValidUrl = validateUrl(this.value);
      updateInputIcon();
      updateSubmitButton();
      updateOptionsPanel();
      if (this.value.trim() === '') {
        state.showSearchTiles = false;
        state.hasSearched = false;
        state.searchResults = [];
        updateInputMode();
        updateCarouselLayout();
      }
    }
    chatInput.addEventListener('input', handleInput);

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !state.isSearching) {
        e.preventDefault();
        handleSubmit();
      }
    }
    chatInput.addEventListener('keydown', handleKeydown as EventListener);

    function handleSubmitClick() {
      if (!state.isSearching) handleSubmit();
    }
    submitBtn.addEventListener('click', handleSubmitClick);

    // ===== SEARCH AGAIN =====
    var searchAgainTimeoutId: ReturnType<typeof setTimeout> | null = null;
    function handleSearchAgain() {
      state.isFadingOut = true;
      carouselSection!.classList.add('fading');
      searchAgainTimeoutId = safeTimeout(function() {
        state.searchResults = [];
        state.hasSearched = false;
        state.showSearchTiles = false;
        state.isFadingOut = false;
        state.url = '';
        chatInput!.value = '';
        carouselSection!.classList.remove('fading');
        updateInputMode();
        updateCarouselLayout();
        updateInputIcon();
        updateSubmitButton();
        updateOptionsPanel();
        chatInput!.focus();
      }, 500);
    }
    if (searchAgainBtn) searchAgainBtn.addEventListener('click', handleSearchAgain);

    // ===== PERFORM SEARCH =====
    async function performSearch(query: string) {
      if (!query.trim() || isURL(query)) {
        state.searchResults = [];
        state.showSearchTiles = false;
        renderCarousel();
        return;
      }

      state.isSearching = true;
      state.showSearchTiles = true;
      state.hasSearched = true;
      submitBtn!.classList.add('disabled');
      updateCarouselLayout();
      renderCarousel(); // shows skeletons

      try {
        var results = await searchWeb(query);
        if (cancelled) return;
        state.searchResults = results;
      } catch (e) {
        if (cancelled) return;
        state.searchResults = [];
      }
      state.isSearching = false;
      submitBtn!.classList.remove('disabled');
      updateInputMode();
      renderCarousel();

      safeTimeout(function() {
        if (cancelled) return;
        carouselSection!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }

    // ===== RENDER CAROUSEL =====
    function renderCarousel() {
      if (!carouselInner) return;

      if (state.isSearching) {
        var skeletons = '';
        for (var i = 0; i < 16; i++) {
          skeletons += '<div class="skeleton-card"><div class="skeleton-shimmer"></div><div class="skeleton-bar"><div class="skeleton-dot"></div><div class="skeleton-dot"></div><div class="skeleton-dot"></div><div class="skeleton-url"></div></div><div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div>';
        }
        carouselInner.innerHTML = '<div class="carousel-track">' + skeletons + '</div>';
        return;
      }

      if (state.searchResults.length > 0) {
        var allResults = state.searchResults.concat(state.searchResults);
        var cards = allResults.map(function(r, idx) {
          var realIdx = idx % state.searchResults.length;
          var previewHTML: string;
          if (r.screenshot) {
            previewHTML = '<img class="result-preview" src="' + r.screenshot + '" alt="' + r.title + '" loading="lazy">';
          } else {
            var wsRoot = document.querySelector('.workspace-root');
            var isDarkMode = wsRoot ? wsRoot.classList.contains('dark') : document.body.classList.contains('dark-mode');
            var fallbackGradient = isDarkMode ? 'linear-gradient(135deg, #2a2a2a, #1e1e1e)' : 'linear-gradient(135deg, #e0e0e0, #f5f5f5)';
            previewHTML = '<div class="result-placeholder" style="background:' + (r.gradient || fallbackGradient) + '">' +
              '<div class="result-placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9H21"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="12" cy="6" r="1" fill="currentColor"/></svg></div>' +
              '<span class="result-placeholder-text">' + r.title + '</span></div>';
          }

          return '<div class="result-card" data-idx="' + realIdx + '">' +
            previewHTML +
            '<div class="result-overlay">' +
              '<div class="result-overlay-default">' +
                '<div class="result-overlay-title">' + r.title + '</div>' +
                '<div class="result-overlay-sub">Choose how to clone this site</div>' +
                '<div class="result-overlay-buttons">' +
                  '<button class="btn-clone" data-action="clone" data-idx="' + realIdx + '"><svg viewBox="0 0 20 20" fill="none"><path d="M11.667 4.792L16.875 10M16.875 10L11.667 15.208M16.875 10H3.125" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Instant Clone</button>' +
                  '<button class="btn-instructions" data-action="instructions" data-idx="' + realIdx + '"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5H15M5 10H15M5 15H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>Add Instructions</button>' +
                '</div>' +
              '</div>' +
              '<div class="result-instructions-overlay" data-instr-idx="' + realIdx + '">' +
                '<div class="result-instructions-box">' +
                  '<div class="result-instructions-input">' +
                    '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5H15M5 10H15M5 15H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
                    '<textarea placeholder="Describe your customizations..." data-instr-textarea="' + realIdx + '"></textarea>' +
                  '</div>' +
                  '<div class="result-instructions-actions">' +
                    '<button class="btn-instr-back" data-action="back" data-idx="' + realIdx + '"><svg viewBox="0 0 20 20" fill="none"><path d="M12 5L7 10L12 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
                    '<button class="btn-apply-clone" data-action="apply" data-idx="' + realIdx + '"><span>Apply &amp; Clone</span><svg viewBox="0 0 20 20" fill="none"><path d="M11.667 4.792L16.875 10M16.875 10L11.667 15.208M16.875 10H3.125" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        carouselInner.innerHTML = '<div class="carousel-track">' + cards + '</div>';
        attachCarouselEvents();
        return;
      }

      // No results
      carouselInner.innerHTML = '<div class="carousel-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<p>No results found</p>' +
        '<p class="sub">Try a different search term</p></div>';
    }

    // ===== CAROUSEL EVENTS (event delegation) =====
    // Named handlers so we can remove before re-adding (prevents listener accumulation)
    var carouselClickHandler: ((e: Event) => void) | null = null;
    var carouselInputHandler: ((e: Event) => void) | null = null;

    function attachCarouselEvents() {
      if (!carouselInner) return;

      // Remove previous listeners to prevent accumulation across multiple renderCarousel() calls
      if (carouselClickHandler) carouselInner.removeEventListener('click', carouselClickHandler);
      if (carouselInputHandler) carouselInner.removeEventListener('input', carouselInputHandler);

      carouselClickHandler = function(e) {
        var btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
        if (!btn) return;

        var action = btn.dataset.action;
        var idx = parseInt(btn.dataset.idx || '0');
        e.stopPropagation();

        if (action === 'clone') {
          var result = state.searchResults[idx];
          handleSubmit(result);
        }

        if (action === 'instructions') {
          state.showInstructionsForIndex = idx;
          carouselInner!.querySelectorAll('.result-overlay-default').forEach(function(el) { (el as HTMLElement).style.display = ''; });
          carouselInner!.querySelectorAll('.result-instructions-overlay').forEach(function(el) { el.classList.remove('visible'); });
          carouselInner!.querySelectorAll('[data-instr-idx="' + idx + '"]').forEach(function(el) {
            el.classList.add('visible');
            var defaultOverlay = el.closest('.result-overlay')?.querySelector('.result-overlay-default') as HTMLElement | null;
            if (defaultOverlay) defaultOverlay.style.display = 'none';
          });
          var ta = carouselInner!.querySelector('[data-instr-textarea="' + idx + '"]') as HTMLTextAreaElement | null;
          if (ta) ta.focus();
        }

        if (action === 'back') {
          state.showInstructionsForIndex = null;
          state.additionalInstructions = '';
          carouselInner!.querySelectorAll('.result-overlay-default').forEach(function(el) { (el as HTMLElement).style.display = ''; });
          carouselInner!.querySelectorAll('.result-instructions-overlay').forEach(function(el) { el.classList.remove('visible'); });
        }

        if (action === 'apply') {
          var card = btn.closest('.result-card');
          var textarea = card ? card.querySelector('[data-instr-textarea="' + idx + '"]') as HTMLTextAreaElement | null : carouselInner!.querySelector('[data-instr-textarea="' + idx + '"]') as HTMLTextAreaElement | null;
          if (textarea && textarea.value.trim()) {
            state.additionalInstructions = textarea.value.trim();
            sessionStorage.setItem('additionalInstructions', state.additionalInstructions);
            handleSubmit(state.searchResults[idx]);
          }
        }
      };
      carouselInner.addEventListener('click', carouselClickHandler);

      // Update apply button state on textarea input
      carouselInputHandler = function(e) {
        var target = e.target as HTMLElement;
        if (target.matches('[data-instr-textarea]')) {
          var idxAttr = (target as HTMLTextAreaElement).dataset.instrTextarea;
          var hasText = (target as HTMLTextAreaElement).value.trim().length > 0;
          carouselInner!.querySelectorAll('.btn-apply-clone[data-idx="' + idxAttr + '"]').forEach(function(btn) {
            btn.classList.toggle('active', hasText);
          });
        }
      };
      carouselInner.addEventListener('input', carouselInputHandler);

      // Reset instructions on mouseleave (on child cards — destroyed on innerHTML replacement, no accumulation)
      carouselInner.querySelectorAll('.result-card').forEach(function(card) {
        card.addEventListener('mouseleave', function() {
          if (state.showInstructionsForIndex !== null) {
            state.showInstructionsForIndex = null;
            state.additionalInstructions = '';
            carouselInner!.querySelectorAll('.result-overlay-default').forEach(function(el) { (el as HTMLElement).style.display = ''; });
            carouselInner!.querySelectorAll('.result-instructions-overlay').forEach(function(el) { el.classList.remove('visible'); });
          }
        });
      });
    }

    // ===== SUBMIT HANDLER =====
    function handleSubmit(selectedResult?: { url: string; title: string; markdown?: string }) {
      var inputValue = state.url.trim();

      if (!inputValue && !selectedResult) {
        showToast('Please enter a URL or search term', 'error');
        return;
      }

      // Brand extension validation
      if (state.extendBrandStyles && isURL(inputValue) && !(document.getElementById('brandTextarea') as HTMLTextAreaElement)?.value?.trim()) {
        showToast("Please describe what you want to build with this brand's styles", 'error');
        return;
      }

      // Search result selected — fade out, create project, navigate
      if (selectedResult) {
        state.isFadingOut = true;
        carouselSection!.classList.add('fading');
        safeTimeout(function() {
          if (cancelled) return;
          sessionStorage.setItem('targetUrl', selectedResult.url);
          sessionStorage.setItem('selectedStyle', state.selectedStyle);
          sessionStorage.setItem('selectedModel', state.selectedModel);
          sessionStorage.setItem('autoStart', 'true');
          if (selectedResult.markdown) sessionStorage.setItem('siteMarkdown', selectedResult.markdown);
          showToast('Cloning ' + selectedResult.title + '...', '');
          createProject({
            name: selectedResult.title || 'Untitled',
            source_url: selectedResult.url,
            default_model: state.selectedModel,
            default_style: state.selectedStyle,
            team_id: getActiveTeamId(),
          }).then(function(project) {
            if (cancelled) return;
            return createBuild(project.id, {
              source_url: selectedResult.url,
              prompt: 'Clone ' + (selectedResult.title || selectedResult.url),
            }).then(function(build) {
              window.location.href = '/workspace/' + project.id + '/build/' + build.id;
            });
          }).catch(function() {
            if (cancelled) return;
            showToast('Failed to create project', 'error');
            state.isFadingOut = false;
            carouselSection!.classList.remove('fading');
          });
        }, 500);
        return;
      }

      // URL submitted
      if (isURL(inputValue)) {
        var projectData: any = {
          name: inputValue.replace(/^https?:\/\//, '').split('/')[0],
          source_url: inputValue.indexOf('://') === -1 ? 'https://' + inputValue : inputValue,
          default_model: state.selectedModel,
          default_style: state.selectedStyle,
          team_id: getActiveTeamId(),
        };

        if (state.extendBrandStyles) {
          sessionStorage.setItem('targetUrl', inputValue);
          sessionStorage.setItem('selectedModel', state.selectedModel);
          sessionStorage.setItem('autoStart', 'true');
          sessionStorage.setItem('brandExtensionMode', 'true');
          sessionStorage.setItem('brandExtensionPrompt', (document.getElementById('brandTextarea') as HTMLTextAreaElement)?.value || '');
          showToast('Extracting brand styles from ' + inputValue + '...', '');
        } else {
          sessionStorage.setItem('targetUrl', inputValue);
          sessionStorage.setItem('selectedStyle', state.selectedStyle);
          sessionStorage.setItem('selectedModel', state.selectedModel);
          sessionStorage.setItem('autoStart', 'true');
          if (instrInput!.value.trim()) sessionStorage.setItem('additionalInstructions', instrInput!.value.trim());
          showToast('Scraping ' + inputValue + '...', '');
        }

        createProject(projectData).then(function(project) {
          if (cancelled) return;
          var sourceUrl = projectData.source_url || inputValue;
          return createBuild(project.id, {
            source_url: sourceUrl,
            prompt: state.extendBrandStyles
              ? 'Extend brand styles from ' + sourceUrl
              : 'Clone ' + sourceUrl,
          }).then(function(build) {
            window.location.href = '/workspace/' + project.id + '/build/' + build.id;
          });
        }).catch(function() {
          if (cancelled) return;
          showToast('Failed to create project', 'error');
        });
        return;
      }

      // Search term
      if (state.hasSearched && state.searchResults.length > 0) {
        state.isFadingOut = true;
        carouselSection!.classList.add('fading');
        safeTimeout(async function() {
          if (cancelled) return;
          state.searchResults = [];
          state.isFadingOut = false;
          carouselSection!.classList.remove('fading');
          await performSearch(inputValue);
        }, 500);
      } else {
        performSearch(inputValue);
      }
    }

    return () => {
      cancelled = true;
      chatInput!.removeEventListener('input', handleInput);
      chatInput!.removeEventListener('keydown', handleKeydown as EventListener);
      submitBtn!.removeEventListener('click', handleSubmitClick);
      modelSelect!.removeEventListener('change', handleModelChange);
      if (toggleRow) toggleRow.removeEventListener('click', handleToggleClick);
      if (searchAgainBtn) searchAgainBtn.removeEventListener('click', handleSearchAgain);
      if (carouselInner && carouselClickHandler) carouselInner.removeEventListener('click', carouselClickHandler);
      if (carouselInner && carouselInputHandler) carouselInner.removeEventListener('input', carouselInputHandler);
      pendingTimeouts.forEach(function(id) { clearTimeout(id); });
    };
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-box" id="chatBox">
        {/* Input row (default state) */}
        <div className="chat-input-row" id="inputRow">
          <div className="input-icon" id="inputIcon">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M12.5 12.5L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <input className="chat-input" id="chatInput" type="text" placeholder="Enter URL or search term..." autoComplete="off" />
          <button className="btn-submit" id="submitBtn" title="Submit">
            <span className="btn-submit-text" id="submitText">Search</span>
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.667 4.792L16.875 10M16.875 10L11.667 15.208M16.875 10H3.125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {/* Select mode row (after search results) */}
        <div className="chat-select-row" id="selectRow">
          <div className="input-icon">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="4" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="2" y="11" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="11" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>
          </div>
          <span className="select-text">Select which site to clone from the results below</span>
          <button className="btn-search-again" id="searchAgainBtn">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 14L10 10M11 6.5C11 9 9 11 6.5 11C4 11 2 9 2 6.5C2 4 4 2 6.5 2C9 2 11 4 11 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <span>Search Again</span>
          </button>
        </div>

        {/* Options panel (slides down for URLs) */}
        <div className="options-panel" id="optionsPanel">
          <div className="options-inner">
            {/* Toggle */}
            <div className="toggle-row" id="toggleRow">
              <span className="toggle-label">Extend brand styles</span>
              <div className="toggle-switch" id="toggleSwitch">
                <div className="toggle-thumb"></div>
              </div>
            </div>

            {/* Brand textarea (hidden by default) */}
            <div className="brand-textarea-wrap" id="brandWrap">
              <textarea className="brand-textarea" id="brandTextarea" placeholder="Describe what you want to build with this brand's styles..."></textarea>
            </div>

            {/* Style grid (visible by default) */}
            <div className="style-grid-wrap" id="styleGridWrap">
              <div className="style-grid" id="styleGrid"></div>
            </div>

            {/* Model + instructions */}
            <div className="options-bottom">
              <select className="model-select" id="modelSelect"></select>
              <input className="instructions-input" id="instrInput" type="text" placeholder="Additional instructions (optional)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
