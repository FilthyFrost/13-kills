/**
 * 移动端初始化：竖屏提示、防滑动、添加到主屏幕引导
 */

const PWA_DISMISS_KEY = '13kills_pwa_dismissed';

function isMobile(): boolean {
  return (
    'ontouchstart' in window ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

function isStandalone(): boolean {
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function isPortrait(): boolean {
  const mediaMatches = window.matchMedia('(orientation: portrait)').matches;
  const sizeMatches = window.innerHeight > window.innerWidth;
  return mediaMatches || sizeMatches;
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function updatePortraitOverlay(): void {
  const overlay = document.getElementById('portrait-overlay');
  if (!overlay) return;

  if (isPortrait() && isMobile()) {
    overlay.classList.add('visible');
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'auto';
  } else {
    overlay.classList.remove('visible');
    overlay.style.visibility = 'hidden';
    overlay.style.pointerEvents = 'none';
  }
}

function initPwaPrompt(): void {
  const overlay = document.getElementById('pwa-prompt-overlay');
  const instructions = document.getElementById('pwa-instructions');
  const dismissBtn = document.getElementById('pwa-dismiss');
  if (!overlay || !instructions || !dismissBtn) return;

  if (!isMobile() || isStandalone()) return;

  try {
    if (localStorage.getItem(PWA_DISMISS_KEY) === '1') return;
  } catch {
    return;
  }

  const showPrompt = (): void => {
    if (isPortrait()) return;
    overlay.classList.add('visible');
    if (isIOS()) {
      instructions.textContent = 'Safari/Chrome：点击底部分享按钮 → 添加到主屏幕';
    } else {
      instructions.textContent = '点击浏览器菜单 → 安装应用 或 添加到主屏幕';
    }
  };

  const hidePrompt = (): void => {
    overlay.classList.remove('visible');
    try {
      localStorage.setItem(PWA_DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  dismissBtn.addEventListener('click', hidePrompt);
  dismissBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    hidePrompt();
  });

  const checkAndShow = (): void => {
    if (!isPortrait() && isMobile() && !isStandalone()) {
      showPrompt();
    } else {
      overlay.classList.remove('visible');
    }
  };

  window.addEventListener('load', () => {
    setTimeout(checkAndShow, 500);
    setTimeout(() => window.scrollTo(0, 1), 100);
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(checkAndShow, 100);
  });

  window.addEventListener('resize', checkAndShow);
}

function initPortraitOverlay(): void {
  updatePortraitOverlay();

  window.addEventListener('orientationchange', () => {
    setTimeout(updatePortraitOverlay, 100);
  });

  window.addEventListener('resize', updatePortraitOverlay);

  const mediaQuery = window.matchMedia('(orientation: portrait)');
  mediaQuery.addEventListener('change', updatePortraitOverlay);
}

initPortraitOverlay();
initPwaPrompt();
