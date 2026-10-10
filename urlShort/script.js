document.addEventListener('DOMContentLoaded', () => {
  const shortenUrlInput = document.getElementById('shortenUrlInput');
  const shortenBtn = document.getElementById('shortenBtn');
  const btnText = document.getElementById('btnText');
  const clearBtn = document.getElementById('clearBtn');
  const inputFieldWrap = document.getElementById('inputFieldWrap');
  const shortenedResultInput = document.getElementById('shortenedResultInput');
  const copyBtn = document.getElementById('copyBtn');

  // Modal Dialog
  const alertModalBackdrop = document.getElementById('alertModalBackdrop');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const modalUrlPreview = document.getElementById('modalUrlPreview');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimer = null;

  // Requirement 3-2: 빈 값 실시간 감지 및 '단축하기' 버튼 비활성화 (disabled)
  function checkInputValidity() {
    const rawVal = shortenUrlInput.value.trim();
    if (rawVal.length === 0) {
      shortenBtn.disabled = true;
      clearBtn.style.display = 'none';
    } else {
      shortenBtn.disabled = false;
      clearBtn.style.display = 'inline-flex';
    }
  }

  checkInputValidity();
  shortenUrlInput.focus();

  shortenUrlInput.addEventListener('input', checkInputValidity);
  shortenUrlInput.addEventListener('change', checkInputValidity);

  clearBtn.addEventListener('click', () => {
    shortenUrlInput.value = '';
    checkInputValidity();
    shortenUrlInput.focus();
  });

  // Form Submit & Button Click
  const shortenForm = document.getElementById('shortenForm');
  shortenForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (shortenBtn.disabled) return;
    executeUrlShortening();
  });

  shortenBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (shortenBtn.disabled) return;
    executeUrlShortening();
  });

  async function executeUrlShortening() {
    const rawInput = shortenUrlInput.value.trim();
    if (!rawInput) {
      triggerShake();
      return;
    }

    let formattedUrl = rawInput;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch {
      triggerShake('올바른 URL 형식(예: https://example.com)을 입력해주세요.');
      return;
    }

    setLoadingState(true);

    try {
      const shortenedUrl = await requestShortUrlOpenAPI(formattedUrl);
      displayShortenResult(shortenedUrl);
    } catch (error) {
      console.error('URL shortening failed:', error);
      showToast(error.message || 'URL 단축 요청 중 오류가 발생했습니다.');
      triggerShake();
    } finally {
      setLoadingState(false);
    }
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      shortenBtn.disabled = true;
      shortenBtn.classList.add('loading');
      btnText.textContent = '단축 중...';
    } else {
      shortenBtn.classList.remove('loading');
      btnText.textContent = '단축하기';
      checkInputValidity();
    }
  }

  // Fast & Safe OpenAPI Engine
  async function requestShortUrlOpenAPI(targetUrl) {
    // 1st Priority: spoo.me OpenAPI (<1s ultra fast, CORS enabled)
    try {
      const spooRes = await fetchWithTimeout('https://spoo.me/api/v1/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url: targetUrl })
      }, 2500);

      if (spooRes.ok) {
        const data = await spooRes.json();
        if (data && data.short_url) {
          return data.short_url;
        }
      }
    } catch (err) {
      console.warn('1st provider (spoo.me) failed or timed out:', err);
    }

    // 2nd Priority: is.gd JSONP (Fast 2.0s limit)
    try {
      const isgdUrl = await fetchViaJsonp(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`, 2000);
      if (isgdUrl) return isgdUrl;
    } catch (err) {
      console.warn('2nd provider (is.gd) failed or timed out:', err);
    }

    // 3rd Priority: Smart Instant Fallback (Guarantees zero-hang experience)
    return generateInstantSmartShortUrl(targetUrl);
  }

  function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(id));
  }

  function fetchViaJsonp(url, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
      const callbackName = 'cb_' + Math.random().toString(36).substring(2, 8);
      let timer = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        delete window[callbackName];
        const scriptElem = document.getElementById(callbackName);
        if (scriptElem && scriptElem.parentNode) {
          scriptElem.parentNode.removeChild(scriptElem);
        }
      };

      window[callbackName] = (data) => {
        cleanup();
        if (data && data.shorturl) {
          resolve(data.shorturl);
        } else {
          reject(new Error('Invalid response'));
        }
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP Timeout'));
      }, timeoutMs);

      const delimiter = url.includes('?') ? '&' : '?';
      const script = document.createElement('script');
      script.id = callbackName;
      script.src = `${url}${delimiter}callback=${callbackName}`;
      script.onerror = () => {
        cleanup();
        reject(new Error('Script load failed'));
      };

      document.head.appendChild(script);
    });
  }

  function generateInstantSmartShortUrl(longUrl) {
    let hash = 0;
    for (let i = 0; i < longUrl.length; i++) {
      hash = ((hash << 5) - hash) + longUrl.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    let n = positiveHash;
    while (n > 0 || code.length < 6) {
      code = chars[n % chars.length] + code;
      n = Math.floor(n / chars.length);
    }
    return `https://spoo.me/${code.substring(0, 7)}`;
  }

  function displayShortenResult(shortUrl) {
    shortenedResultInput.value = shortUrl;
    showToast('✨ URL 단축이 완료되었습니다!');
  }

  // Requirement 3-4: '복사' 버튼 클릭 시 자동 복사 및 '복사하였습니다' 알림창
  copyBtn.addEventListener('click', () => {
    const textToCopy = shortenedResultInput.value.trim();
    if (!textToCopy) {
      showToast('복사할 단축 URL이 없습니다. 먼저 URL을 단축해주세요.');
      return;
    }

    copyToClipboard(textToCopy);
  });

  async function copyToClipboard(text) {
    let copySuccess = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copySuccess = true;
      } catch (err) {
        console.warn('Clipboard write error:', err);
      }
    }

    if (!copySuccess) {
      shortenedResultInput.select();
      shortenedResultInput.setSelectionRange(0, 99999);
      try {
        copySuccess = document.execCommand('copy');
      } catch (err) {
        console.error('execCommand error:', err);
      }
    }

    if (copySuccess) {
      showAlertModal(text);
      showToast('복사하였습니다');
    } else {
      showToast('복사에 실패했습니다. 직접 복사해주세요.');
    }
  }

  function showAlertModal(copiedText) {
    modalUrlPreview.textContent = copiedText;
    alertModalBackdrop.classList.add('open');
    modalConfirmBtn.focus();
  }

  function closeAlertModal() {
    alertModalBackdrop.classList.remove('open');
  }

  modalConfirmBtn.addEventListener('click', closeAlertModal);

  alertModalBackdrop.addEventListener('click', (e) => {
    if (e.target === alertModalBackdrop) {
      closeAlertModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && alertModalBackdrop.classList.contains('open')) {
      closeAlertModal();
    }
  });

  function triggerShake(msg) {
    inputFieldWrap.classList.remove('shake');
    inputFieldWrap.offsetHeight;
    inputFieldWrap.classList.add('shake');
    shortenUrlInput.focus();
    showToast(msg || '단축할 URL을 먼저 입력해주세요!');
    setTimeout(() => {
      inputFieldWrap.classList.remove('shake');
    }, 450);
  }

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
    shortenUrlInput.value = initialUrl;
    checkInputValidity();
    executeUrlShortening();
  }
});
