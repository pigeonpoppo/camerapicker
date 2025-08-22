// Common JavaScript Functions

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Scroll Position Management
function saveScrollPosition() {
  sessionStorage.setItem('scrollPosition', window.scrollY);
}

function restoreScrollPosition() {
  const savedScrollPosition = sessionStorage.getItem('scrollPosition');
  if (savedScrollPosition) {
    window.scrollTo(0, parseInt(savedScrollPosition));
    sessionStorage.removeItem('scrollPosition');
    
    // さらに確実にするため、少し遅れて再度復元
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScrollPosition));
    }, 50);
  }
}

// Local Storage Management
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('LocalStorage保存エラー:', error);
  }
}

function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('LocalStorage読み込みエラー:', error);
    return defaultValue;
  }
}

// URL Parameter Management
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function buildUrlWithParams(baseUrl, params) {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      urlParams.set(key, value);
    }
  });
  return `${baseUrl}?${urlParams.toString()}`;
}

// Navigation Functions
function navigateTo(url, saveScroll = true) {
  if (saveScroll) {
    saveScrollPosition();
  }
  window.location.href = url;
}

function navigateReplace(url, saveScroll = true) {
  if (saveScroll) {
    saveScrollPosition();
  }
  window.location.replace(url);
}

// Animation Functions
function animateElement(element, animationClass, duration = 600) {
  element.classList.add(animationClass);
  setTimeout(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  }, 100);
}

function animateElementsOnLoad() {
  const animateElements = document.querySelectorAll('.animate-in, .animate-in-delay');
  animateElements.forEach((el, index) => {
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

// Loading State Management
function showLoading() {
  document.body.classList.add('loading');
}

function hideLoading() {
  document.body.classList.remove('loading');
}

// Error Handling
function showError(message, duration = 5000) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--color-red-500);
    color: white;
    padding: 1rem;
    border-radius: var(--border-radius-md);
    z-index: 10000;
    box-shadow: var(--shadow-lg);
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, duration);
}

// Success Message
function showSuccess(message, duration = 3000) {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--color-green-500);
    color: white;
    padding: 1rem;
    border-radius: var(--border-radius-md);
    z-index: 10000;
    box-shadow: var(--shadow-lg);
  `;
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, duration);
}

// Data Fetching
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('データ取得エラー:', error);
    throw error;
  }
}

// GitHub Pages Environment Detection
function isGitHubPages() {
  return window.location.hostname.includes('github.io');
}

// Base Path for GitHub Pages
function getBasePath() {
  return isGitHubPages() ? '/camerapicker/' : '/';
}

// Export functions for use in other files
window.CommonUtils = {
  registerServiceWorker,
  saveScrollPosition,
  restoreScrollPosition,
  saveToLocalStorage,
  loadFromLocalStorage,
  getUrlParameter,
  buildUrlWithParams,
  navigateTo,
  navigateReplace,
  animateElement,
  animateElementsOnLoad,
  showLoading,
  hideLoading,
  showError,
  showSuccess,
  fetchData,
  isGitHubPages,
  getBasePath
};

