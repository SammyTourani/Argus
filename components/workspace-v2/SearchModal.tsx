'use client';

// JS IIFEs that correspond to this component:
// - Search modal open/close logic (searchBackdrop, searchModal)
// - Search input handling, filtering, keyboard navigation
// - CMD+K shortcut handler

export default function SearchModal() {
  return (
    <div className="search-modal-backdrop" id="searchBackdrop">
      <div className="search-modal" id="searchModal"></div>
    </div>
  );
}
