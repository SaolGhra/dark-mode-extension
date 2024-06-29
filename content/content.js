chrome.storage.local.get(["darkModeEnabled"], (result) => {
  if (result.darkModeEnabled) {
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
    let styleSheet = document.createElement("style");
    styleSheet.id = "dark-mode-styles";
    styleSheet.type = "text/css";
    styleSheet.innerText = darkModeStyles;
    document.head.appendChild(styleSheet);
  }
});