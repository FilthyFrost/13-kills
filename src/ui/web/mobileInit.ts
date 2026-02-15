/**
 * 移动端初始化：竖屏提示、防滑动、添加到主屏幕引导
 */

const PWA_DISMISS_KEY = '13kills_pwa_dismissed_v3';

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

  if (isPortrait() && isMobile() && isStandalone()) {
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
    overlay.classList.add('visible');
    if (isIOS()) {
      instructions.innerHTML =
        '1. 点击浏览器框上的分享按钮（见上方图标）<br>' +
        '2. 下拉找到「Add to Home Screen」或「加入主页面」<br>' +
        '3. 享受全屏游戏的快乐';
    } else {
      instructions.innerHTML =
        '1. 点击浏览器框上的分享按钮（见上方图标）<br>' +
        '2. 找到「安装应用」或「添加到主屏幕」<br>' +
        '3. 享受全屏游戏的快乐';
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
    if (isMobile() && !isStandalone()) {
      showPrompt();
    } else {
      overlay.classList.remove('visible');
    }
  };

  checkAndShow();

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkAndShow, 100);
  });

  window.addEventListener('load', () => {
    setTimeout(checkAndShow, 300);
    setTimeout(checkAndShow, 800);
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

const STANDALONE_SAFE_INSET = { top: 59, right: 52, bottom: 38, left: 52 };
const CROP_THRESHOLD = 20;

function initStandaloneSafeArea(): void {
  if (!isStandalone() || !isMobile()) return;

  const container = document.getElementById('game-container');
  if (!container) return;

  const applySafeArea = (): void => {
    const rect = container.getBoundingClientRect();
    if (rect.top < CROP_THRESHOLD) {
      container.style.top = `${STANDALONE_SAFE_INSET.top}px`;
      container.style.bottom = `${STANDALONE_SAFE_INSET.bottom}px`;
      container.style.left = `${STANDALONE_SAFE_INSET.left}px`;
      container.style.right = `${STANDALONE_SAFE_INSET.right}px`;
      window.dispatchEvent(new Event('resize'));
    }
  };

  window.addEventListener('load', () => {
    setTimeout(applySafeArea, 100);
    setTimeout(applySafeArea, 500);
  });

  window.addEventListener('resize', applySafeArea);
  window.addEventListener('orientationchange', () => setTimeout(applySafeArea, 150));
}

initPortraitOverlay();
initPwaPrompt();
initStandaloneSafeArea();
