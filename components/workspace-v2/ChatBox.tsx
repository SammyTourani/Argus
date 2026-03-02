'use client';

// JS IIFEs that correspond to this component:
// - Chat input handling (URL detection, search term detection)
// - Submit button expand/collapse animation
// - Options panel show/hide (slide down for URLs)
// - Toggle switch (extend brand styles)
// - Brand textarea show/hide
// - Style grid population and selection
// - Model select population
// - Instructions input
// - Search again button
// - Select row visibility after search results

export default function ChatBox() {
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
