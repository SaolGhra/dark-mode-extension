chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "toggleDarkMode",
    title: "Force Dark Mode",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleDarkMode") {
    chrome.storage.local.get(["darkModeEnabled"], (result) => {
      const enabled = result.darkModeEnabled || false;
      const newEnabledState = !enabled;

      chrome.storage.local.set({ darkModeEnabled: newEnabledState }, () => {
        // Execute script to toggle dark mode in the active tab
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: toggleDarkMode,
          args: [newEnabledState],
        });
      });

      // Update context menu title
      updateContextMenuTitle(newEnabledState);
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  // Update context menu title when tab is activated
  chrome.storage.local.get(["darkModeEnabled"], (result) => {
    updateContextMenuTitle(result.darkModeEnabled);
  });
});

function updateContextMenuTitle(enabled) {
  chrome.contextMenus.update("toggleDarkMode", {
    title: enabled ? "Disable Dark Mode" : "Force Dark Mode",
  });
}

function toggleDarkMode(enabled) {
  if (enabled) {
    applyDarkMode();
  } else {
    removeDarkMode();
  }
}

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
