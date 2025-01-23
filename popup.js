document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url;
    if (!url) {
      document.getElementById("status").textContent = "No active tab detected.";
      return;
    }

    document.getElementById("status").textContent = `Analyzing: ${url}`;

    chrome.runtime.sendMessage({ type: "CHECK_WEBSITE", url }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        document.getElementById("status").textContent =
          "Error: Unable to analyze the website.";
        return;
      }

      if (response && response.status) {
        updatePopup(response.status, response.score, response.feedback);
      } else {
        document.getElementById("status").textContent =
          "Error: No response from background script.";
      }
    });
  });
});

function updatePopup(status, score, feedback) {
  const statusElement = document.getElementById("status");
  const scoreElement = document.getElementById("score");
  const feedbackElement = document.getElementById("feedback");

  statusElement.textContent = `Status: ${status}`;
  statusElement.style.color =
    status === "GENUINE" ? "green" : status === "SUSPICIOUS" ? "red" : "orange";

  scoreElement.textContent = `Safety Score: ${score}`;
  feedbackElement.innerHTML = feedback.map((item) => `<li>${item}</li>`).join("");
}
