// @ts-nocheck
'use client';

import { useEffect } from 'react';

const MODELS = [
  { id:'auto', name:'Auto', provider:'Argus', desc:'Automatically selects the best model for each task', tags:[], cost:'', color:'#ff4801', badge:null, badgeColor:'', enabled:true, alwaysOn:true },
  { id:'claude-sonnet-4-6', name:'Claude Sonnet 4.6', provider:'Anthropic', desc:'Best overall — sharp reasoning, clean code output', tags:['Frontend','Full-stack','Logic'], cost:'$0.003/1k', color:'#CC785C', badge:'Most Popular', badgeColor:'#f97316', enabled:true },
  { id:'claude-opus-4-6', name:'Claude Opus 4.6', provider:'Anthropic', desc:'Maximum intelligence for complex architectures', tags:['Architecture','Complex','Reasoning'], cost:'$0.015/1k', color:'#CC785C', badge:'Pro', badgeColor:'#8b5cf6', enabled:true },
  { id:'claude-haiku-4-5', name:'Claude Haiku 4.5', provider:'Anthropic', desc:'Lightning fast for simple tasks and quick iterations', tags:['Speed','Simple','Drafts'], cost:'$0.001/1k', color:'#CC785C', badge:'Fast', badgeColor:'#06b6d4', enabled:true },
  { id:'gemini-3-1-pro', name:'Gemini 3.1 Pro', provider:'Google', desc:'Advanced reasoning with massive context window', tags:['Reasoning','Long context','Multimodal'], cost:'$0.005/1k', color:'#4285F4', badge:null, badgeColor:'', enabled:true },
  { id:'gemini-3-flash', name:'Gemini 3 Flash', provider:'Google', desc:'Ultra-fast iteration for rapid prototyping', tags:['Speed','Prototypes','Iteration'], cost:'$0.001/1k', color:'#4285F4', badge:'Fastest', badgeColor:'#3b82f6', enabled:true },
  { id:'gpt-5-3-codex', name:'GPT-5.3 Codex', provider:'OpenAI', desc:'Specialized code generation with superior accuracy', tags:['Code gen','APIs','Testing'], cost:'$0.008/1k', color:'#10A37F', badge:'New', badgeColor:'#10b981', enabled:false },
  { id:'gpt-5-2-codex', name:'GPT-5.2 Codex', provider:'OpenAI', desc:'Reliable code generation for production apps', tags:['Code gen','Stable','Production'], cost:'$0.006/1k', color:'#10A37F', badge:null, badgeColor:'', enabled:true },
  { id:'gpt-5-2', name:'GPT-5.2', provider:'OpenAI', desc:'General purpose with strong UI generation', tags:['UI','General','Integration'], cost:'$0.005/1k', color:'#10A37F', badge:null, badgeColor:'', enabled:false },
  { id:'grok-4-1-fast', name:'Grok 4.1 Fast', provider:'xAI', desc:'High-speed inference with real-time data access', tags:['Speed','Real-time','Reasoning'], cost:'$0.003/1k', color:'#1DA1F2', badge:null, badgeColor:'', enabled:true },
  { id:'glm-5', name:'GLM 5', provider:'Zhipu AI', desc:'Strong multilingual capabilities with efficient tokens', tags:['Multilingual','Efficient','Open source'], cost:'Free', color:'#FF6B35', badge:'Free', badgeColor:'#10b981', enabled:true },
  { id:'kimi-k2-5', name:'Kimi K2.5', provider:'Moonshot', desc:'Advanced reasoning with exceptional context handling', tags:['Reasoning','Long context','Code'], cost:'$0.002/1k', color:'#6366F1', badge:null, badgeColor:'', enabled:true },
];

const PROVIDER_LOGOS = {
  'Argus': '<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="url(#argusG)"/><text x="12" y="16" text-anchor="middle" fill="white" font-family="monospace" font-size="12" font-weight="700">A</text><defs><linearGradient id="argusG" x1="0" y1="0" x2="24" y2="24"><stop stop-color="#ff4801"/><stop offset="1" stop-color="#ff7038"/></linearGradient></defs></svg>',
  'Anthropic': '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" fill="#181818"/></svg>',
  'Google': '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#geminiGrad)"/><defs><linearGradient id="geminiGrad" x1="0" y1="24" x2="24" y2="0"><stop stop-color="#1C7CEF"/><stop offset=".33" stop-color="#1BA1E3"/><stop offset=".66" stop-color="#5EBFEF"/><stop offset="1" stop-color="#E1A4F4"/></linearGradient></defs></svg>',
  'OpenAI': '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#10A37F"/></svg>',
  'xAI': '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6.469 8.776L16.512 23h-4.464L2.005 8.776H6.47zm-.004 7.9l2.233 3.164L6.467 23H2l4.465-6.324zM22 2.582V23h-3.659V7.764L22 2.582zM22 1l-9.952 14.095-2.233-3.163L17.533 1H22z"/></svg>',
  'Zhipu AI': '<svg viewBox="0 0 24 24" fill="#3B5998" xmlns="http://www.w3.org/2000/svg"><path d="M11.991 23.503a.24.24 0 00-.244.248.24.24 0 00.244.249.24.24 0 00.245-.249.24.24 0 00-.22-.247l-.025-.001zM9.671 5.365a1.697 1.697 0 011.099 2.132l-.071.172-.016.04-.018.054c-.07.16-.104.32-.104.498-.035.71.47 1.279 1.186 1.314h.366c1.309.053 2.338 1.173 2.286 2.523-.052 1.332-1.152 2.38-2.478 2.327h-.174c-.715.018-1.274.64-1.239 1.368 0 .124.018.23.053.337.209.373.54.658.96.8.75.23 1.517-.125 1.9-.782l.018-.035c.402-.64 1.17-.96 1.92-.711.854.284 1.378 1.226 1.099 2.167a1.661 1.661 0 01-2.077 1.102 1.711 1.711 0 01-.907-.711l-.017-.035c-.2-.323-.463-.58-.851-.711l-.056-.018a1.646 1.646 0 00-1.954.746 1.66 1.66 0 01-1.065.764 1.677 1.677 0 01-1.989-1.279c-.209-.906.332-1.83 1.257-2.043a1.51 1.51 0 01.296-.035h.018c.68-.071 1.151-.622 1.116-1.333a1.307 1.307 0 00-.227-.693 2.515 2.515 0 01-.366-1.403 2.39 2.39 0 01.366-1.208c.14-.195.21-.444.227-.693.018-.71-.506-1.261-1.186-1.332l-.07-.018a1.43 1.43 0 01-.299-.07l-.05-.019a1.7 1.7 0 01-1.047-2.114 1.68 1.68 0 012.094-1.101zm-5.575 10.11c.26-.264.639-.367.994-.27.355.096.633.379.728.74.095.362-.007.748-.267 1.013-.402.41-1.053.41-1.455 0a1.062 1.062 0 010-1.482zm14.845-.294c.359-.09.738.024.992.297.254.274.344.665.237 1.025-.107.36-.396.634-.756.718-.551.128-1.1-.22-1.23-.781a1.05 1.05 0 01.757-1.26zm-.064-4.39c.314.32.49.753.49 1.206 0 .452-.176.886-.49 1.206-.315.32-.74.5-1.185.5-.444 0-.87-.18-1.184-.5a1.727 1.727 0 010-2.412 1.654 1.654 0 012.369 0zm-11.243.163c.364.484.447 1.128.218 1.691a1.665 1.665 0 01-2.188.923c-.855-.36-1.26-1.358-.907-2.228a1.68 1.68 0 011.33-1.038c.593-.08 1.183.169 1.547.652zm11.545-4.221c.368 0 .708.2.892.524.184.324.184.724 0 1.048a1.026 1.026 0 01-.892.524c-.568 0-1.03-.47-1.03-1.048 0-.579.462-1.048 1.03-1.048zm-14.358 0c.368 0 .707.2.891.524.184.324.184.724 0 1.048a1.026 1.026 0 01-.891.524c-.569 0-1.03-.47-1.03-1.048 0-.579.461-1.048 1.03-1.048zm10.031-1.475c.925 0 1.675.764 1.675 1.706s-.75 1.705-1.675 1.705-1.674-.763-1.674-1.705c0-.942.75-1.706 1.674-1.706zm-2.626-.684c.362-.082.653-.356.761-.718a1.062 1.062 0 00-.238-1.028 1.017 1.017 0 00-.996-.294c-.547.14-.881.7-.752 1.257.13.558.675.907 1.225.783zm0 16.876c.359-.087.644-.36.75-.72a1.062 1.062 0 00-.237-1.019 1.018 1.018 0 00-.985-.301 1.037 1.037 0 00-.762.717c-.108.361-.017.754.239 1.028.245.263.606.377.953.305l.043-.01zM17.19 3.5a.631.631 0 00.628-.64c0-.355-.279-.64-.628-.64a.631.631 0 00-.628.64c0 .355.28.64.628.64zm-10.38 0a.631.631 0 00.628-.64c0-.355-.28-.64-.628-.64a.631.631 0 00-.628.64c0 .355.279.64.628.64zm-5.182 7.852a.631.631 0 00-.628.64c0 .354.28.639.628.639a.63.63 0 00.627-.606l.001-.034a.62.62 0 00-.628-.64zm5.182 9.13a.631.631 0 00-.628.64c0 .355.279.64.628.64a.631.631 0 00.628-.64c0-.355-.28-.64-.628-.64zm10.38.018a.631.631 0 00-.628.64c0 .355.28.64.628.64a.631.631 0 00.628-.64c0-.355-.279-.64-.628-.64zm5.182-9.148a.631.631 0 00-.628.64c0 .354.279.639.628.639a.631.631 0 00.628-.64c0-.355-.28-.64-.628-.64zm-.384-4.992a.24.24 0 00.244-.249.24.24 0 00-.244-.249.24.24 0 00-.244.249c0 .142.122.249.244.249zM11.991.497a.24.24 0 00.245-.248A.24.24 0 0011.99 0a.24.24 0 00-.244.249c0 .133.108.236.223.247l.021.001zM2.011 6.36a.24.24 0 00.245-.249.24.24 0 00-.244-.249.24.24 0 00-.244.249.24.24 0 00.244.249zm0 11.263a.24.24 0 00-.243.248.24.24 0 00.244.249.24.24 0 00.244-.249.252.252 0 00-.244-.248zm19.995-.018a.24.24 0 00-.245.248.24.24 0 00.245.25.24.24 0 00.244-.25.252.252 0 00-.244-.248z"/></svg>',
  'Moonshot': '<svg viewBox="0 0 24 24" fill="#6366F1" xmlns="http://www.w3.org/2000/svg"><path d="M1.052 16.916l9.539 2.552a21.007 21.007 0 00.06 2.033l5.956 1.593a11.997 11.997 0 01-5.586.865l-.18-.016-.044-.004-.084-.009-.094-.01a11.605 11.605 0 01-.157-.02l-.107-.014-.11-.016a11.962 11.962 0 01-.32-.051l-.042-.008-.075-.013-.107-.02-.07-.015-.093-.019-.075-.016-.095-.02-.097-.023-.094-.022-.068-.017-.088-.022-.09-.024-.095-.025-.082-.023-.109-.03-.062-.02-.084-.025-.093-.028-.105-.034-.058-.019-.08-.026-.09-.031-.066-.024a6.293 6.293 0 01-.044-.015l-.068-.025-.101-.037-.057-.022-.08-.03-.087-.035-.088-.035-.079-.032-.095-.04-.063-.028-.063-.027a5.655 5.655 0 01-.041-.018l-.066-.03-.103-.047-.052-.024-.096-.046-.062-.03-.084-.04-.086-.044-.093-.047-.052-.027-.103-.055-.057-.03-.058-.032a6.49 6.49 0 01-.046-.026l-.094-.053-.06-.034-.051-.03-.072-.041-.082-.05-.093-.056-.052-.032-.084-.053-.061-.039-.079-.05-.07-.047-.053-.035a7.785 7.785 0 01-.054-.036l-.044-.03-.044-.03a6.066 6.066 0 01-.04-.028l-.057-.04-.076-.054-.069-.05-.074-.054-.056-.042-.076-.057-.076-.059-.086-.067-.045-.035-.064-.052-.074-.06-.089-.073-.046-.039-.046-.039a7.516 7.516 0 01-.043-.037l-.045-.04-.061-.053-.07-.062-.068-.06-.062-.058-.067-.062-.053-.05-.088-.084a13.28 13.28 0 01-.099-.097l-.029-.028-.041-.042-.069-.07-.05-.051-.05-.053a6.457 6.457 0 01-.168-.179l-.08-.088-.062-.07-.071-.08-.042-.049-.053-.062-.058-.068-.046-.056a7.175 7.175 0 01-.027-.033l-.045-.055-.066-.082-.041-.052-.05-.064-.02-.025a11.99 11.99 0 01-1.44-2.402zm-1.02-5.794l11.353 3.037a20.468 20.468 0 00-.469 2.011l10.817 2.894a12.076 12.076 0 01-1.845 2.005L.657 15.923l-.016-.046-.035-.104a11.965 11.965 0 01-.05-.153l-.007-.023a11.896 11.896 0 01-.207-.741l-.03-.126-.018-.08-.021-.097-.018-.081-.018-.09-.017-.084-.018-.094c-.026-.141-.05-.283-.071-.426l-.017-.118-.011-.083-.013-.102a12.01 12.01 0 01-.019-.161l-.005-.047a12.12 12.12 0 01-.034-2.145zm1.593-5.15l11.948 3.196c-.368.605-.705 1.231-1.01 1.875l11.295 3.022c-.142.82-.368 1.612-.668 2.365l-11.55-3.09L.124 10.26l.015-.1.008-.049.01-.067.015-.087.018-.098c.026-.148.056-.295.088-.442l.028-.124.02-.085.024-.097c.022-.09.045-.18.07-.268l.028-.102.023-.083.03-.1.025-.082.03-.096.026-.082.031-.095a11.896 11.896 0 011.01-2.232zm4.442-4.4L17.352 4.59a20.77 20.77 0 00-1.688 1.721l7.823 2.093c.267.852.442 1.744.513 2.665L2.106 5.213l.045-.065.027-.04.04-.055.046-.065.055-.076.054-.072.064-.086.05-.065.057-.073.055-.07.06-.074.055-.069.065-.077.054-.066.066-.077.053-.06.072-.082.053-.06.067-.074.054-.058.073-.078.058-.06.063-.067.168-.17.1-.098.059-.056.076-.071a12.084 12.084 0 012.272-1.677zM12.017 0h.097l.082.001.069.001.054.002.068.002.046.001.076.003.047.002.06.003.054.002.087.005.105.007.144.011.088.007.044.004.077.008.082.008.047.005.102.012.05.006.108.014.081.01.042.006.065.01.207.032.07.012.065.011.14.026.092.018.11.022.046.01.075.016.041.01L14.7.3l.042.01.065.015.049.012.071.017.096.024.112.03.113.03.113.032.05.015.07.02.078.024.073.023.05.016.05.016.076.025.099.033.102.036.048.017.064.023.093.034.11.041.116.045.1.04.047.02.06.024.041.018.063.026.04.018.057.025.11.048.1.046.074.035.075.036.06.028.092.046.091.045.102.052.053.028.049.026.046.024.06.033.041.022.052.029.088.05.106.06.087.051.057.034.053.032.096.059.088.055.098.062.036.024.064.041.084.056.04.027.062.042.062.043.023.017c.054.037.108.075.161.114l.083.06.065.048.056.043.086.065.082.064.04.03.05.041.086.069.079.065.085.071c.712.6 1.353 1.283 1.909 2.031L7.222.994l.062-.027.065-.028.081-.034.086-.035c.113-.045.227-.09.341-.131l.096-.035.093-.033.084-.03.096-.031c.087-.03.176-.058.264-.085l.091-.027.086-.025.102-.03.085-.023.1-.026L9.04.37l.09-.023.091-.022.095-.022.09-.02.098-.021.091-.02.095-.018.092-.018.1-.018.091-.016.098-.017.092-.014.097-.015.092-.013.102-.013.091-.012.105-.012.09-.01.105-.01c.093-.01.186-.018.28-.024l.106-.008.09-.005.11-.006.093-.004.1-.004.097-.002.099-.002.197-.002z"/></svg>'
};

export default function ModelsTab() {

  useEffect(() => {
    var list = document.getElementById('modelList');
    var searchInput = document.getElementById('modelSearch') as HTMLInputElement;
    var countEl = document.getElementById('modelCount');

    function updateCount() {
      var c = MODELS.filter(function(m) { return m.enabled && !m.alwaysOn; }).length;
      countEl.textContent = c + ' enabled';
    }

    function renderModels() {
      var q = searchInput.value.toLowerCase();
      var filtered = MODELS.filter(function(m) {
        return !q || m.name.toLowerCase().indexOf(q) !== -1 || m.provider.toLowerCase().indexOf(q) !== -1;
      });

      list.innerHTML = filtered.map(function(m, i) {
        var cls = 'model-row stagger-' + Math.min(i + 1, 12);
        if (!m.enabled && !m.alwaysOn) cls += ' disabled';

        var rightSide = '';
        if (m.alwaysOn) {
          rightSide = '<span class="always-on-label"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg> Always on</span>';
        } else {
          rightSide = '<div class="toggle-switch' + (m.enabled ? ' active' : '') + '" data-model="' + m.id + '"><div class="toggle-thumb"></div></div>';
        }

        var logoHtml = PROVIDER_LOGOS[m.provider] ? '<div class="provider-logo">' + PROVIDER_LOGOS[m.provider] + '</div>' : '<span class="provider-dot" style="background:' + m.color + ';"></span>';

        return '<div class="' + cls + '">' +
          logoHtml +
          '<div class="model-info"><div class="model-name-row"><span class="model-name">' + m.name + '</span>' +
          (m.badge ? '<span class="model-badge" style="background:' + m.badgeColor + ';">' + m.badge + '</span>' : '') +
          '</div><div class="model-desc">' + m.desc + '</div></div>' +
          '<div class="model-tags">' + m.tags.map(function(t) { return '<span class="model-tag">' + t + '</span>'; }).join('') + '</div>' +
          (m.cost ? '<div class="model-cost">' + (m.cost === 'Free' ? '<span class="free">Free</span>' : m.cost) + '</div>' : '<div class="model-cost"></div>') +
          '<span class="model-provider">' + m.provider + '</span>' +
          '<button class="gear-btn"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4"/></svg></button>' +
          rightSide + '</div>';
      }).join('');

      // Wire toggles
      list.querySelectorAll('.toggle-switch').forEach(function(sw) {
        sw.addEventListener('click', function() {
          var id = (sw as HTMLElement).dataset.model;
          var m = MODELS.find(function(x) { return x.id === id; });
          if (m) { m.enabled = !m.enabled; renderModels(); updateCount(); }
        });
      });
    }

    var inputHandler = function() { renderModels(); };
    searchInput.addEventListener('input', inputHandler);

    // Custom model form toggle
    var addModelBtn = document.getElementById('addModelBtn');
    var addModelHandler = function() {
      document.getElementById('customModelForm').classList.toggle('visible');
    };
    addModelBtn.addEventListener('click', addModelHandler);

    renderModels();
    updateCount();

    return () => {
      searchInput.removeEventListener('input', inputHandler);
      addModelBtn.removeEventListener('click', addModelHandler);
    };
  }, []);

  return (
    <div className="tab-content" id="tab-models">
      <div className="models-header stagger-1">
        <div className="section-title">Available Models <span className="section-count" id="modelCount">11 enabled</span></div>
        <button className="add-btn" id="addModelBtn">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg>
          Add Custom Model
        </button>
      </div>
      <div className="custom-model-form" id="customModelForm">
        <h3>Add Custom Model <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '18px' }}>&times;</button></h3>
        <div className="form-grid">
          <div className="form-group"><label>Model Name</label><input className="form-input" placeholder="e.g. My Fine-tuned Model" /></div>
          <div className="form-group"><label>Provider</label><input className="form-input" placeholder="e.g. OpenAI" /></div>
          <div className="form-group"><label>Endpoint URL</label><input className="form-input" placeholder="https://api.example.com/v1/chat" /></div>
          <div className="form-group"><label>API Key</label><input className="form-input" type="password" placeholder="sk-..." /></div>
        </div>
        <div className="form-actions"><button className="btn-primary">Add Model</button></div>
      </div>
      <div className="search-input-wrap stagger-2">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
        <input className="search-input" type="text" placeholder="Search models..." id="modelSearch" />
      </div>
      <div className="model-list" id="modelList"></div>

      <div className="section-divider"></div>

      {/* Subscriptions */}
      <div className="section-header stagger-1"><div className="section-title">Subscription</div></div>
      <p className="sub-section-subtitle">Start building for free. Upgrade when you need more.</p>
      <div className="sub-grid">
        {/* Free */}
        <div className="sub-card current-plan stagger-2">
          <span className="current-badge">Current Plan</span>
          <div className="sub-name">Free</div>
          <div className="sub-price-row">
            <span className="sub-price">$0</span>
            <span className="sub-period">forever</span>
          </div>
          <div className="sub-tagline">No strings.</div>
          <button className="sub-cta outline">Start for free</button>
          <ul className="sub-features grey-checks">
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> 3 builds / 30 days</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> All 8 style transforms</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Download as ZIP</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Community support</li>
          </ul>
        </div>
        {/* Pro */}
        <div className="sub-card popular stagger-3">
          <span className="popular-plan-badge">Most popular</span>
          <div className="sub-name">Pro</div>
          <div className="sub-price-row">
            <span className="sub-price">$19</span>
            <span className="sub-period">/month</span>
          </div>
          <div className="sub-tagline">For power builders.</div>
          <button className="sub-cta primary">Go Pro</button>
          <ul className="sub-features orange-checks">
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Unlimited builds</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> All AI models (GPT-4o, Claude, Gemini, Kimi)</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Priority generation queue</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Push to Vercel in 1 click</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Brand extraction mode</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Email support</li>
          </ul>
        </div>
        {/* Team */}
        <div className="sub-card stagger-4">
          <div className="sub-name">Team</div>
          <div className="sub-price-row">
            <span className="sub-price">$49</span>
            <span className="sub-period">/month</span>
          </div>
          <div className="sub-tagline">Coming soon.</div>
          <div className="sub-waitlist">
            <input type="email" placeholder="you@email.com" />
            <button>Join waitlist</button>
          </div>
          <ul className="sub-features grey-checks">
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Everything in Pro</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> 5 team members</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Shared project library</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Custom AI model config</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> SSO &amp; audit logs</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Dedicated support</li>
          </ul>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* API Keys */}
      <div className="section-header">
        <div className="section-title">API Keys</div>
        <button className="add-btn"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg> Add Key</button>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '12px' }}>Configure your own API keys to use AI models at cost. Keys are stored locally in your browser.</p>
      <div className="key-list">
        <div className="key-row stagger-2">
          <div className="key-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 10a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M2 10l5.5-2M10 8V3M14.5 8L17 6" /></svg></div>
          <div className="key-info"><div className="key-provider">OpenAI</div><div className="key-mask">sk-...3kF9</div></div>
          <span className="status-badge status-active"><span className="dot"></span> active</span>
          <span className="key-time">2 hours ago</span>
          <button className="key-delete"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
        </div>
        <div className="key-row stagger-3">
          <div className="key-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 10a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M2 10l5.5-2M10 8V3M14.5 8L17 6" /></svg></div>
          <div className="key-info"><div className="key-provider">Anthropic</div><div className="key-mask">sk-ant-...xY2m</div></div>
          <span className="status-badge status-active"><span className="dot"></span> active</span>
          <span className="key-time">1 day ago</span>
          <button className="key-delete"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
        </div>
        <div className="key-row stagger-4">
          <div className="key-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 10a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M2 10l5.5-2M10 8V3M14.5 8L17 6" /></svg></div>
          <div className="key-info"><div className="key-provider">Google AI</div><div className="key-mask">AIza...9pQr</div></div>
          <span className="status-badge status-expired"><span className="dot"></span> expired</span>
          <span className="key-time">5 days ago</span>
          <button className="key-delete"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
        </div>
      </div>
    </div>
  );
}
