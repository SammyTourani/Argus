// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { createProject, createBuild, fetchCurrentUser, escapeHtml } from './workspace-api';
import { getActiveTeamId } from './workspace-active';
import { CONFIG, showToast } from './workspace-state';

const DEFAULT_MODEL = 'gemini-2.5-flash';

export default function TemplatePreviewModal() {
  useEffect(() => {
    var backdrop = document.getElementById('tplPreviewBackdrop');
    var modal = document.getElementById('tplPreviewModal');
    if (!backdrop || !modal) return;

    var tplState = {
      isOpen: false,
      template: null,
      selectedModel: DEFAULT_MODEL,
      selectedStyle: '4', // Minimalist
      instructions: '',
      isCloning: false,
    };

    // Load user's preferred model
    fetchCurrentUser().then(function(user) {
      if (user && user.preferred_model) tplState.selectedModel = user.preferred_model;
    }).catch(function() {});

    function openModal(template) {
      tplState.isOpen = true;
      tplState.template = template;
      tplState.instructions = '';
      tplState.isCloning = false;
      renderModal();
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (tplState.isCloning) return; // Don't close while cloning
      tplState.isOpen = false;
      tplState.template = null;
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    function renderModal() {
      var t = tplState.template;
      if (!t) { modal.innerHTML = ''; return; }

      var html = '';

      // Close button
      html += '<button class="tpl-modal-close" aria-label="Close">';
      html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
      html += '</button>';

      // Screenshot / gradient preview
      html += '<div class="tpl-modal-screenshot">';
      if (t.thumbnail) {
        html += '<img src="' + t.thumbnail + '" alt="' + escapeHtml(t.name) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'" />';
        html += '<div class="tpl-modal-gradient" style="background:' + (t.gradient || 'linear-gradient(135deg,#667eea,#764ba2)') + ';display:none"></div>';
      } else {
        html += '<div class="tpl-modal-gradient" style="background:' + (t.gradient || 'linear-gradient(135deg,#667eea,#764ba2)') + '"></div>';
      }
      html += '</div>';

      // Body
      html += '<div class="tpl-modal-body">';

      // Title + description
      html += '<div class="tpl-modal-title-row">';
      html += '<img src="' + (t.icon || '') + '" class="tpl-modal-icon" loading="lazy" onerror="this.style.display=\'none\'" />';
      html += '<h2 class="tpl-modal-title">' + escapeHtml(t.name) + '</h2>';
      html += '</div>';
      html += '<p class="tpl-modal-desc">' + escapeHtml(t.desc) + '</p>';

      // Badges
      html += '<div class="tpl-modal-badges">';
      html += '<span class="diff-badge diff-' + t.diff + '">' + t.diff + '</span>';
      var catLabel = t.category.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      html += '<span class="tpl-modal-cat-badge">' + escapeHtml(catLabel) + '</span>';
      html += '</div>';

      // Tags
      if (t.tags && t.tags.length > 0) {
        html += '<div class="tech-pills" style="margin-bottom:16px">';
        t.tags.forEach(function(tag) {
          html += '<span class="tech-pill">' + escapeHtml(tag) + '</span>';
        });
        html += '</div>';
      }

      // Model selector
      html += '<div class="tpl-modal-field">';
      html += '<label class="tpl-modal-label">AI Model</label>';
      html += '<select class="tpl-modal-select" data-field="model">';
      CONFIG.models.forEach(function(m) {
        var sel = m.id === tplState.selectedModel ? ' selected' : '';
        html += '<option value="' + m.id + '"' + sel + '>' + escapeHtml(m.name) + '</option>';
      });
      html += '</select>';
      html += '</div>';

      // Style selector
      html += '<div class="tpl-modal-field">';
      html += '<label class="tpl-modal-label">Design Style</label>';
      html += '<div class="tpl-modal-styles">';
      CONFIG.styles.forEach(function(s) {
        var active = s.id === tplState.selectedStyle ? ' active' : '';
        html += '<button class="tpl-style-btn' + active + '" data-style="' + s.id + '">' + escapeHtml(s.name) + '</button>';
      });
      html += '</div>';
      html += '</div>';

      // Instructions
      html += '<div class="tpl-modal-field">';
      html += '<label class="tpl-modal-label">Additional Instructions <span style="color:var(--fg-muted);font-weight:400">(optional)</span></label>';
      html += '<textarea class="tpl-modal-textarea" data-field="instructions" placeholder="e.g., Change colors to blue, add a contact form, make it a restaurant site...">' + escapeHtml(tplState.instructions) + '</textarea>';
      html += '</div>';

      // Actions
      html += '<div class="tpl-modal-actions">';
      html += '<a class="tpl-modal-visit" href="' + t.url + '" target="_blank" rel="noopener noreferrer">Visit Original ↗</a>';
      html += '<button class="tpl-modal-clone"' + (tplState.isCloning ? ' disabled' : '') + '>' + (tplState.isCloning ? 'Creating project...' : 'Clone This Site') + '</button>';
      html += '</div>';

      html += '</div>'; // close body

      modal.innerHTML = html;
    }

    function handleClone() {
      var t = tplState.template;
      if (!t || tplState.isCloning) return;

      tplState.isCloning = true;
      renderModal(); // Show loading state

      // Find style name from CONFIG
      var styleName = '';
      CONFIG.styles.forEach(function(s) {
        if (s.id === tplState.selectedStyle) styleName = s.name;
      });

      // Set sessionStorage — same keys as ChatBox.tsx
      sessionStorage.setItem('targetUrl', t.url);
      sessionStorage.setItem('selectedModel', tplState.selectedModel);
      sessionStorage.setItem('selectedStyle', styleName);
      sessionStorage.setItem('autoStart', 'true');
      if (tplState.instructions.trim()) {
        sessionStorage.setItem('additionalInstructions', tplState.instructions.trim());
      }

      var teamId = getActiveTeamId();

      createProject({
        name: t.name,
        source_url: t.url,
        default_model: tplState.selectedModel,
        default_style: styleName,
        team_id: teamId,
      }).then(function(project) {
        return createBuild(project.id, {
          title: 'Clone ' + t.name,
          model: tplState.selectedModel,
          style: styleName,
        }).then(function(build) {
          window.location.href = '/workspace/' + project.id + '/build/' + build.id;
        });
      }).catch(function(err) {
        showToast('Failed to start clone: ' + (err.message || 'Unknown error'), 'error');
        tplState.isCloning = false;
        renderModal(); // Reset button state
      });
    }

    // Event delegation on modal
    function handleModalClick(e) {
      var target = e.target;

      if (target.closest('.tpl-modal-close')) { closeModal(); return; }

      var styleBtn = target.closest('.tpl-style-btn');
      if (styleBtn) {
        tplState.selectedStyle = styleBtn.getAttribute('data-style');
        modal.querySelectorAll('.tpl-style-btn').forEach(function(b) { b.classList.remove('active'); });
        styleBtn.classList.add('active');
        return;
      }

      if (target.closest('.tpl-modal-clone')) { handleClone(); return; }
    }

    function handleModalChange(e) {
      if (e.target.matches('[data-field="model"]')) {
        tplState.selectedModel = e.target.value;
      }
    }

    function handleModalInput(e) {
      if (e.target.matches('[data-field="instructions"]')) {
        tplState.instructions = e.target.value;
      }
    }

    function handleBackdropClick(e) {
      if (e.target === backdrop) closeModal();
    }

    function handleKeydown(e) {
      if (!tplState.isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    }

    modal.addEventListener('click', handleModalClick);
    modal.addEventListener('change', handleModalChange);
    modal.addEventListener('input', handleModalInput);
    backdrop.addEventListener('click', handleBackdropClick);
    document.addEventListener('keydown', handleKeydown);

    // Expose globally for TemplatesTab and HomePage
    window.__templatePreviewModal = { open: openModal, close: closeModal };

    return function() {
      modal.removeEventListener('click', handleModalClick);
      modal.removeEventListener('change', handleModalChange);
      modal.removeEventListener('input', handleModalInput);
      backdrop.removeEventListener('click', handleBackdropClick);
      document.removeEventListener('keydown', handleKeydown);
      delete window.__templatePreviewModal;
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="tpl-preview-backdrop" id="tplPreviewBackdrop">
      <div className="tpl-preview-modal" id="tplPreviewModal"></div>
    </div>
  );
}
