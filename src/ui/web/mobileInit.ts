/**
 * 移动端初始化：全屏、横屏锁定、竖屏提示、防滑动
 */

function isMobile(): boolean {
  return (
    'ontouchstart' in window ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

function isPortrait(): boolean {
  const mediaMatches = window.matchMedia('(orientation: portrait)').matches;
  const sizeMatches = window.innerHeight > window.innerWidth;
  return mediaMatches || sizeMatches;
}

function updatePortraitOverlay(): void {
  const overlay = document.getElementById('portrait-overlay');
  if (!overlay) return;

  if (isPortrait() && isMobile()) {
    overlay.classList.add('visible');
  } else {
    overlay.classList.remove('visible');
  }
}

function initMobileTapOverlay(): void {
  const tapOverlay = document.getElementById('mobile-tap-overlay');
  const gameContainer = document.getElementById('game-container');
  if (!tapOverlay || !gameContainer) return;

  if (!isMobile()) {
    return;
  }

  tapOverlay.classList.add('visible');

  const startGame = async (): Promise<void> => {
    try {
      const docEl = document.documentElement as HTMLElement & {
        requestFullscreen?: (opts?: { navigationUI?: string }) => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
      };
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen({ navigationUI: 'hide' });
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
    } catch {
      try {
        const el = gameContainer as HTMLElement & { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void> };
        const requestFs = el.requestFullscreen ?? el.webkitRequestFullscreen;
        if (requestFs) {
          await requestFs.call(el);
        }
      } catch {
        // Fullscreen may fail (e.g. iOS), continue
      }
    }

    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape-primary');
      }
    } catch {
      // Orientation lock may fail (e.g. iOS Safari), continue
    }

    tapOverlay.removeEventListener('click', startGame);
    tapOverlay.removeEventListener('touchend', startGame);
    tapOverlay.remove();
  };

  tapOverlay.addEventListener('click', (e) => {
    e.preventDefault();
    startGame();
  });
  tapOverlay.addEventListener('touchend', (e) => {
    e.preventDefault();
    startGame();
  });
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

initMobileTapOverlay();
initPortraitOverlay();
