chrome.storage.local.get(["enabledSites", "darkModeEnabled"], (result) => {
  const enabledSites = result.enabledSites || [];
  const currentUrl = window.location.href;
  const isEnabled = enabledSites.some((site) => site.url === currentUrl);
  const isDarkModeEnabled = result.darkModeEnabled || false;

  if (isEnabled && isDarkModeEnabled) {
    applyDarkMode();
  } else {
    removeDarkMode();
  }
});

function applyDarkMode() {
  const darkModeStyles = `
    body {
      background-color: #121212 !important;
      color: #e0e0e0 !important;
    }
    
    img, video, iframe {
      filter: brightness(0.8) !important;
    }

    a {
      color: #bb86fc !important;
    }

    * {
      background-color: inherit !important;
      color: inherit !important;
      border-color: #333 !important;
    }

    *::placeholder {
      color: #666 !important;
    }
  `;

  let styleSheet = document.getElementById("dark-mode-styles");
  if (!styleSheet) {
    styleSheet = document.createElement("style");
    styleSheet.id = "dark-mode-styles";
    styleSheet.type = "text/css";
    styleSheet.innerText = darkModeStyles;
    document.head.appendChild(styleSheet);
  }
}

function removeDarkMode() {
  const styleSheet = document.getElementById("dark-mode-styles");
  if (styleSheet) {
    styleSheet.remove();
  }
}

// Listen for changes in dark mode setting
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.darkModeEnabled) {
    const isEnabled = changes.darkModeEnabled.newValue;
    if (isEnabled) {
      applyDarkMode();
    } else {
      removeDarkMode();
    }
  }
});
