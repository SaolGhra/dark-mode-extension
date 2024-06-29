document.getElementById("toggleDarkMode").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.storage.local.get(["darkModeEnabled"], (result) => {
      const enabled = result.darkModeEnabled || false;
      chrome.storage.local.set({ darkModeEnabled: !enabled }, () => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: toggleDarkMode,
          args: [!enabled],
        });
        updateStatus(!enabled);
        window.close();
      });
    });
  });
});

function toggleDarkMode(enabled) {
  if (enabled) {
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
  } else {
    const styleSheet = document.getElementById("dark-mode-styles");
    if (styleSheet) {
      styleSheet.remove();
    }
  }
}

function updateStatus(enabled) {
  const statusElement = document.getElementById("status");
  statusElement.textContent = enabled
    ? "Dark Mode Enabled"
    : "Dark Mode Disabled";
  statusElement.style.color = enabled ? "#4CAF50" : "#f44336";
}

// Initialize status on popup open
chrome.storage.local.get(["darkModeEnabled"], (result) => {
  updateStatus(result.darkModeEnabled);
});
