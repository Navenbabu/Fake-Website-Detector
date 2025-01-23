chrome.runtime.sendMessage({ type: "CHECK_WEBSITE", url: window.location.href }, (response) => {
  if (response) {
    // Display the warning banner every time the website is loaded or refreshed
    displayWarning(response.status, response.score, response.feedback);
  }
});

// Function to display a styled warning banner with an Ignore/Close button and animation
function displayWarning(status, score, feedback) {
  const banner = document.createElement("div");
  banner.style.position = "fixed";
  banner.style.top = "-100px"; // Start off-screen
  banner.style.left = "0";
  banner.style.width = "100%";
  banner.style.zIndex = "9999";
  banner.style.padding = "5px";
  banner.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  banner.style.fontFamily = "Arial, sans-serif";
  banner.style.display = "flex";
  banner.style.justifyContent = "space-between";
  banner.style.alignItems = "center";
  banner.style.boxSizing = "border-box";
  banner.style.transition = "top 0.5s ease-in-out"; // Smooth slide-in animation

  // Set background color based on status
  if (status === "GENUINE") {
    banner.style.backgroundColor = "#28a745"; // Green
    banner.style.color = "white";
  } else if (status === "SUSPICIOUS") {
    banner.style.backgroundColor = "#dc3545"; // Red
    banner.style.color = "white";
  } else {
    banner.style.backgroundColor = "#ffc107"; // Yellow
    banner.style.color = "black";
  }

  // Text content for the banner
  const bannerText = document.createElement("div");
  bannerText.style.flexGrow = "1";
  bannerText.style.textAlign = "center"; // Center the text
  bannerText.style.fontSize = "16px";
  bannerText.style.lineHeight = "1.5";
  bannerText.style.wordWrap = "break-word";
  bannerText.innerText = `Status: ${status} | Score: ${score} | Details: ${feedback.join(", ")}`;

  // Ignore/Close button
  const closeButton = document.createElement("button");
  closeButton.innerText = "Ignore";
  closeButton.style.backgroundColor = "white";
  closeButton.style.color = "black";
  closeButton.style.border = "1px solid black";
  closeButton.style.borderRadius = "5px";
  closeButton.style.padding = "6px 10px";
  closeButton.style.cursor = "pointer";
  closeButton.style.marginLeft = "8px";
  closeButton.style.fontSize = "11px";
  closeButton.style.transition = "background-color 0.3s"; // Smooth hover effect
  closeButton.addEventListener("mouseover", () => {
    closeButton.style.backgroundColor = "#f0f0f0"; // Slightly darker on hover
  });
  closeButton.addEventListener("mouseout", () => {
    closeButton.style.backgroundColor = "white";
  });
  closeButton.addEventListener("click", () => {
    // Add exit animation
    banner.style.top = "-100px"; // Slide out
    setTimeout(() => {
      banner.remove(); // Remove after animation
    }, 500); // Match animation duration
  });

  // Append the text and button to the banner
  banner.appendChild(bannerText);
  banner.appendChild(closeButton);

  // Add the banner to the page
  document.body.prepend(banner);

  // Trigger the slide-in animation
  setTimeout(() => {
    banner.style.top = "0"; // Slide in
  }, 50); // Small delay to ensure DOM rendering
}
