document.addEventListener("DOMContentLoaded", () => {
  const homeTabBtn = document.getElementById("homeTabBtn");
  const configTabBtn = document.getElementById("configTabBtn");
  const homeTab = document.getElementById("homeTab");
  const configTab = document.getElementById("configTab");
  const toggleDarkModeButton = document.getElementById("toggleDarkMode");
  const statusElement = document.getElementById("status");
  const siteListTextarea = document.getElementById("siteList");
  const saveSitesButton = document.getElementById("saveSites");

  // Initialize popup UI based on current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    chrome.storage.local.get(["darkModeEnabled", "enabledSites"], (result) => {
      const enabled = result.darkModeEnabled || false;
      const enabledSites = result.enabledSites || [];
      updateUI(enabled);
      updateConfiguredSitesList(enabledSites);
      applyDarkModeToConfiguredSites(enabledSites); // Apply dark mode on load if enabled
    });
  });

  // Switch between Home and Config tabs
  homeTabBtn.addEventListener("click", () => {
    homeTabBtn.classList.add("active");
    configTabBtn.classList.remove("active");
    homeTab.classList.add("active");
    configTab.classList.remove("active");
  });

  configTabBtn.addEventListener("click", () => {
    homeTabBtn.classList.remove("active");
    configTabBtn.classList.add("active");
    homeTab.classList.remove("active");
    configTab.classList.add("active");
    loadConfiguredSites();
  });

  // Toggle Dark Mode Button Click
  toggleDarkModeButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.storage.local.get(
        ["enabledSites", "darkModeEnabled"],
        (result) => {
          let enabledSites = result.enabledSites || [];
          const index = enabledSites.findIndex(
            (site) => site.url === tabs[0].url
          );
          const newEnabledState = !result.darkModeEnabled;

          chrome.storage.local.set({ darkModeEnabled: newEnabledState }, () => {
            chrome.scripting.executeScript({
              target: { tabId },
              func: updateDarkMode,
              args: [newEnabledState],
            });
            updateStatus(newEnabledState);
            updateUI(newEnabledState);
          });
        }
      );
    });
  });

  // Save Sites Button Click
  saveSitesButton.addEventListener("click", () => {
    const siteList = siteListTextarea.value.split("\n").filter(Boolean);
    const enabledSites = siteList.map((url) => ({ url }));
    chrome.storage.local.set({ enabledSites }, () => {
      updateConfiguredSitesList(enabledSites);
      applyDarkModeToConfiguredSites(enabledSites);
      disableToggleForConfiguredSites(enabledSites);
    });
  });

  // Update UI based on dark mode state
  function updateUI(enabled) {
    toggleDarkModeButton.textContent = enabled
      ? "Disable Dark Mode"
      : "Enable Dark Mode";
    statusElement.textContent = enabled
      ? "Dark Mode Enabled"
      : "Dark Mode Disabled";
    statusElement.style.color = enabled ? "#4CAF50" : "#f44336";
  }

  // Load configured sites in the Config tab
  function loadConfiguredSites() {
    chrome.storage.local.get(["enabledSites"], (result) => {
      const enabledSites = result.enabledSites || [];
      updateConfiguredSitesList(enabledSites);
    });
  }

  // Update configured sites list in the Config tab
  function updateConfiguredSitesList(sites) {
    siteListTextarea.value = sites.map((site) => site.url).join("\n");
  }

  // Function to update dark mode in the current tab
  function updateDarkMode(enabled) {
    chrome.scripting.executeScript({
      target: {
        allFrames: true,
        matchingFrames: "urlMatches",
        url: ["*://*/*"],
      },
      func: toggleDarkMode,
      args: [enabled],
    });
  }

  // Function to toggle dark mode
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

  // Function to update status message
  function updateStatus(enabled) {
    statusElement.textContent = enabled
      ? "Dark Mode Enabled"
      : "Dark Mode Disabled";
    statusElement.style.color = enabled ? "#4CAF50" : "#f44336";
  }

  // Function to apply dark mode to configured sites
  function applyDarkModeToConfiguredSites(sites) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        const url = new URL(tab.url);
        const matchedSite = sites.find((site) => url.href.startsWith(site.url));
        if (matchedSite) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: toggleDarkMode,
            args: [true],
          });
        }
      });
    });
  }

  // Function to disable toggle dark mode for configured sites
  function disableToggleForConfiguredSites(sites) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        const url = new URL(tab.url);
        const matchedSite = sites.find((site) => url.href.startsWith(site.url));
        if (matchedSite) {
          const toggleDarkModeButton =
            document.getElementById("toggleDarkMode");
          toggleDarkModeButton.disabled = true;
          toggleDarkModeButton.textContent = "Dark Mode Forced";
        }
      });
    });
  }
});
