document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const inputWrapper = document.getElementById('inputWrapper');
  const qrContainer = document.getElementById('qrContainer');
  const qrCard = document.getElementById('qrCard');
  const downloadGuideBtn = document.getElementById('downloadGuideBtn');
  const badgeUrlText = document.getElementById('badgeUrlText');
  const resetBtn = document.getElementById('resetBtn');
  const logoBtn = document.getElementById('logoBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  let qrInstance = null;
  let currentTargetUrl = '';
  let toastTimer = null;

  // ==========================================================================
  // Dynamic Cursor-Reactive Gradient Logic
  // ==========================================================================
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let targetX = mouseX;
  let targetY = mouseY;
  let isTicking = false;

  function updateDynamicGradient() {
    // Smooth interpolation (lerp)
    mouseX += (targetX - mouseX) * 0.12;
    mouseY += (targetY - mouseY) * 0.12;

    const xRatio = Math.max(0, Math.min(1, mouseX / window.innerWidth));
    const yRatio = Math.max(0, Math.min(1, mouseY / window.innerHeight));

    // Dynamic Hues: Golden Yellow base (logo match) shifting with cursor
    // Hue 1: 34 (Warm Coral Peach) ~ 56 (Sunlit Gold)
    const hue1 = Math.round(34 + xRatio * 22);
    // Hue 2: 18 (Soft Amber Coral) ~ 36 (Warm Tangerine)
    const hue2 = Math.round(18 + yRatio * 18);
    // Hue 3: 48 (Golden Lemon) ~ 62 (Warm Cream Yellow)
    const hue3 = Math.round(48 + ((xRatio + yRatio) / 2) * 14);

    const docStyle = document.documentElement.style;
    docStyle.setProperty('--mouse-x', `${(xRatio * 100).toFixed(1)}%`);
    docStyle.setProperty('--mouse-y', `${(yRatio * 100).toFixed(1)}%`);
    docStyle.setProperty('--cursor-raw-x', `${mouseX.toFixed(1)}px`);
    docStyle.setProperty('--cursor-raw-y', `${mouseY.toFixed(1)}px`);
    docStyle.setProperty('--hue-1', hue1);
    docStyle.setProperty('--hue-2', hue2);
    docStyle.setProperty('--hue-3', hue3);

    // Keep animating if difference is noticeable
    if (Math.abs(targetX - mouseX) > 0.5 || Math.abs(targetY - mouseY) > 0.5) {
      requestAnimationFrame(updateDynamicGradient);
    } else {
      isTicking = false;
    }
  }

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(updateDynamicGradient);
    }
  });

  // Initial call
  updateDynamicGradient();

  // ==========================================================================
  // URL Input & Clear / Paste Logic
  // ==========================================================================
  urlInput.focus();

  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().length > 0) {
      clearBtn.style.display = 'inline-flex';
    } else {
      clearBtn.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.style.display = 'none';
    urlInput.focus();
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text.trim();
          clearBtn.style.display = 'inline-flex';
          generateQRCode(urlInput.value);
        }
      } else {
        urlInput.focus();
        showToast('클립보드 권한이 필요합니다. Ctrl+V로 붙여넣어주세요.');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      urlInput.focus();
    }
  });

  // ==========================================================================
  // Form Submit & QR Generation Logic
  // ==========================================================================
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawVal = urlInput.value.trim();
    if (!rawVal) {
      triggerShake();
      return;
    }
    generateQRCode(rawVal);
  });

  function generateQRCode(inputVal) {
    let formattedUrl = inputVal.trim();

    // Auto-prefix http/https if missing and looks like a domain
    if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith('mailto:') && !formattedUrl.startsWith('tel:')) {
      if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }
    }

    currentTargetUrl = formattedUrl;

    // Switch state from initial to generated
    if (body.classList.contains('initial-state')) {
      body.classList.remove('initial-state');
      body.classList.add('generated-state');
      resetBtn.style.display = 'inline-flex';
    }

    // Update URL preview badge
    badgeUrlText.textContent = formattedUrl;

    // Render QR Code
    renderQRCode(formattedUrl);

    // Micro pop feedback on card
    qrCard.style.animation = 'none';
    qrCard.offsetHeight; // trigger reflow
    qrCard.style.animation = 'qrPop 0.45s var(--ease-spring)';
  }

  function renderQRCode(text) {
    qrContainer.innerHTML = '';

    if (typeof QRCode === 'undefined') {
      showToast('QR 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    qrInstance = new QRCode(qrContainer, {
      text: text,
      width: 240,
      height: 240,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  function triggerShake() {
    inputWrapper.classList.remove('shake');
    inputWrapper.offsetHeight; // reflow
    inputWrapper.classList.add('shake');
    urlInput.focus();
    showToast('변환할 URL을 먼저 입력해주세요!');
    setTimeout(() => {
      inputWrapper.classList.remove('shake');
    }, 450);
  }

  function resetToInitial() {
    body.classList.remove('generated-state');
    body.classList.add('initial-state');
    resetBtn.style.display = 'none';
    urlInput.value = '';
    clearBtn.style.display = 'none';
    qrContainer.innerHTML = '';
    currentTargetUrl = '';
    urlInput.focus();
  }

  resetBtn.addEventListener('click', resetToInitial);
  if (logoBtn) {
    logoBtn.addEventListener('click', (e) => {
      if (body.classList.contains('generated-state')) {
        e.preventDefault();
        resetToInitial();
      }
    });
  }

  // ==========================================================================
  // High-Resolution Solid White JPG Export
  // ==========================================================================
  function downloadQRAsJPG() {
    if (!currentTargetUrl) {
      showToast('생성된 QR 코드가 없습니다.');
      return;
    }

    const canvas = qrContainer.querySelector('canvas');
    const img = qrContainer.querySelector('img');

    if (!canvas && (!img || !img.src)) {
      showToast('QR 코드를 준비 중입니다. 잠시 후 다시 클릭해주세요.');
      return;
    }

    const exportSize = 800;
    const padding = 70;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');

    // Solid clean white background for JPG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportSize, exportSize);

    const triggerDownload = () => {
      try {
        const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
        
        let domain = 'qrcode';
        try {
          const parsed = new URL(currentTargetUrl);
          domain = 'qr_' + parsed.hostname.replace(/[^a-zA-Z0-9_-]/g, '_');
        } catch {
          domain = 'qrcode_' + Date.now();
        }

        const link = document.createElement('a');
        link.href = jpgDataUrl;
        link.download = `${domain}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('🎉 QR 코드가 JPG 파일로 다운로드되었습니다!');
      } catch (err) {
        console.error('Download error:', err);
        showToast('다운로드 중 오류가 발생했습니다.');
      }
    };

    if (canvas) {
      ctx.drawImage(canvas, padding, padding, exportSize - padding * 2, exportSize - padding * 2);
      triggerDownload();
    } else if (img && img.complete) {
      ctx.drawImage(img, padding, padding, exportSize - padding * 2, exportSize - padding * 2);
      triggerDownload();
    } else if (img) {
      img.onload = () => {
        ctx.drawImage(img, padding, padding, exportSize - padding * 2, exportSize - padding * 2);
        triggerDownload();
      };
    }
  }

  qrCard.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadQRAsJPG();
  });

  downloadGuideBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadQRAsJPG();
  });

  function showToast(message) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastMessage.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // URL query parameter check
  const params = new URLSearchParams(window.location.search);
  const initialUrl = params.get('url');
  if (initialUrl) {
    urlInput.value = initialUrl;
    clearBtn.style.display = 'inline-flex';
    generateQRCode(initialUrl);
  }
});
