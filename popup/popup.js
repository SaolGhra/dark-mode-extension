document.addEventListener("DOMContentLoaded", () => {
  const homeTabBtn = document.getElementById("homeTabBtn");
  const configTabBtn = document.getElementById("configTabBtn");
  const homeTab = document.getElementById("homeTab");
  const configTab = document.getElementById("configTab");
  const toggleDarkModeButton = document.getElementById("toggleDarkMode");
  const statusElement = document.getElementById("status");
  const siteListTextarea = document.getElementById("siteList");
  const saveSitesButton = document.getElementById("saveSites");

  let currentUrl = "";
  let enabledSites = []; // Declare enabledSites in the outer scope

  // Initialize popup UI based on current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentUrl = tabs[0].url;
    chrome.storage.local.get(["darkModeEnabled", "enabledSites"], (result) => {
      const enabled = result.darkModeEnabled || false;
      enabledSites = result.enabledSites || []; // Assign enabledSites in the callback
      updateUI(enabled);
      updateConfiguredSitesList(enabledSites);
      const isEnabled = enabledSites.some((site) =>
        currentUrl.startsWith(site.url)
      );
      if (isEnabled && enabled) {
        applyDarkMode(); // Apply dark mode if enabled and current URL is configured
      } else {
        removeDarkMode(); // Remove dark mode if not enabled or current URL is not configured
      }
      disableToggleForConfiguredSites(enabledSites, currentUrl); // Disable toggle if current URL is configured
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
    chrome.storage.local.get("darkModeEnabled", (result) => {
      const newEnabledState = !result.darkModeEnabled;
      toggleDarkMode(newEnabledState);
    });
  });

  // Save Sites Button Click
  saveSitesButton.addEventListener("click", () => {
    const siteList = siteListTextarea.value.split("\n").filter(Boolean);
    enabledSites = siteList.map((url) => ({ url })); // Update enabledSites
    chrome.storage.local.set({ enabledSites }, () => {
      updateConfiguredSitesList(enabledSites);
      applyDarkModeToConfiguredSites(enabledSites);
      disableToggleForConfiguredSites(enabledSites); // Disable toggle for all configured sites
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
    toggleDarkModeButton.disabled = false; // Enable the button
    toggleDarkModeButton.classList.remove("disabled");
  }

  // Load configured sites in the Config tab
  function loadConfiguredSites() {
    chrome.storage.local.get(["enabledSites"], (result) => {
      enabledSites = result.enabledSites || []; // Update enabledSites
      updateConfiguredSitesList(enabledSites);
    });
  }

  // Update configured sites list in the Config tab
  function updateConfiguredSitesList(sites) {
    siteListTextarea.value = sites.map((site) => site.url).join("\n");
  }

  // Function to toggle dark mode in the current tab or configured sites
  function toggleDarkMode(enabled) {
    chrome.storage.local.set({ darkModeEnabled: enabled }, () => {
      currentTabId().then((tabId) => {
        if (enabled) {
          applyDarkMode();
        } else {
          removeDarkMode();
        }
        updateStatus(enabled);
        updateUI(enabled);
        applyDarkModeToConfiguredSites(enabledSites); // Apply to configured sites
        disableToggleForConfiguredSites(enabledSites, currentUrl); // Disable toggle if current URL is configured
      });
    });
  }

  // Function to get current active tab id
  function currentTabId() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0].id);
      });
    });
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
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            const matchedSite = sites.find((site) =>
              url.href.startsWith(site.url)
            );
            if (matchedSite) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: toggleDarkModeOnPage,
                args: [true],
              });
            }
          } catch (error) {
            console.error("Error parsing URL:", error);
          }
        }
      });
    });
  }

  // Function to disable toggle dark mode for configured sites
  function disableToggleForConfiguredSites(sites, currentUrl) {
    const isEnabled = sites.some((site) => currentUrl.startsWith(site.url));
    toggleDarkModeButton.disabled = isEnabled;
    toggleDarkModeButton.textContent = isEnabled
      ? "Dark Mode Forced"
      : "Toggle Dark Mode";
  }

  // Function to toggle dark mode on a specific page
  function toggleDarkModeOnPage(enabled) {
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

  // Function to apply dark mode on page load if configured
  function applyDarkMode() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            chrome.storage.local.get("enabledSites", (result) => {
              enabledSites = result.enabledSites || []; // Update enabledSites
              const matchedSite = enabledSites.find((site) =>
                url.href.startsWith(site.url)
              );
              if (matchedSite) {
                chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: toggleDarkModeOnPage,
                  args: [true],
                });
              }
            });
          } catch (error) {
            console.error("Error parsing URL:", error);
          }
        }
      });
    });
  }

  // Function to remove dark mode styles from all tabs
  function removeDarkMode() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: toggleDarkModeOnPage,
          args: [false],
        });
      });
    });
  }
});
