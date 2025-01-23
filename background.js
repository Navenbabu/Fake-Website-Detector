chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CHECK_WEBSITE") {
    const url = request.url;

    analyzeWebsite(url)
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("Error analyzing website:", error);
        sendResponse({ status: "ERROR", message: "Unable to analyze website." });
      });
    return true; // Indicates asynchronous response
  }
});

async function analyzeWebsite(url) {
  const domain = new URL(url).hostname;

  // Skip checks for trusted domains
  const trustedDomains = ["instagram.com", "google.com", "facebook.com"];
  if (trustedDomains.includes(domain)) {
    return {
      status: "GENUINE",
      score: 100,
      feedback: ["This is a trusted domain and assumed to be safe."],
    };
  }

  // Perform checks for other domains
  const fraudScore = checkFraudPatterns(url);
  const whoisScore = await checkWhois(domain);
  const safeBrowsingScore = await checkSafeBrowsing(domain);
  const virusTotalScore = await checkVirusTotal(domain);
  const contentAnalysisScore = await analyzePageContent(url);

  // Weighted final score
  const finalScore = Math.round(
    (fraudScore * 0.2 +
      whoisScore * 0.3 +
      safeBrowsingScore * 0.2 +
      virusTotalScore * 0.2 +
      contentAnalysisScore * 0.1)
  );

  const status =
    finalScore >= 85 ? "GENUINE" : finalScore >= 60 ? "MEDIUM RISK" : "SUSPICIOUS";

  return {
    status,
    score: finalScore,
    feedback: generateFeedback(fraudScore, whoisScore, safeBrowsingScore, virusTotalScore, contentAnalysisScore),
  };
}

// Fraud detection heuristics
function checkFraudPatterns(url) {
  const suspiciousKeywords = ["accommodation", "login", "verification", "free"];
  const excessiveParameters = url.split("?").length > 2;

  const matchesKeyword = suspiciousKeywords.some((keyword) =>
    url.toLowerCase().includes(keyword)
  );

  if (matchesKeyword || excessiveParameters) {
    return 40; // Fraudulent
  }

  return 100; // Safe
}

// WHOIS Lookup
async function checkWhois(domain) {
  const apiKey = "at_HLuTxoGIFPScREQqJVXYPnpyP4qsE"; // Replace with your API key
  const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Extract domain creation date
    const creationDate = new Date(data.WhoisRecord?.registryData?.createdDateNormalized);
    const ageInYears = (new Date() - creationDate) / (1000 * 60 * 60 * 24 * 365);

    if (ageInYears < 2) {
      return 50; // Penalize new domains
    }

    return 100; // Safe if domain is older than 2 years
  } catch (error) {
    console.error("WHOIS API error:", error);
    return 50; // Neutral score if WHOIS fails
  }
}

// Google Safe Browsing API
async function checkSafeBrowsing(domain) {
  const apiKey = "AIzaSyC69p4AKZip_MeQC0O_D_LCopp_y_IIQjM"; // Replace with your API key
  const url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
  const body = {
    client: { clientId: "safety-checker", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: `https://${domain}` }],
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data.matches ? 30 : 100; // Flagged if matches found
  } catch (error) {
    console.error("Safe Browsing API error:", error);
    return 50; // Neutral score if API fails
  }
}

// VirusTotal API
async function checkVirusTotal(domain) {
  const apiKey = "438ce80bb61bfc7269bc2398e9079bc9b26ba219bd2f72c62efaeece0faefaa7"; // Replace with your API key
  const url = `https://www.virustotal.com/api/v3/domains/${domain}`;

  try {
    const response = await fetch(url, {
      headers: { "x-apikey": apiKey },
    });
    const data = await response.json();

    // Extract analysis stats
    const reputation = data.data?.attributes?.reputation || 0;
    const malicious = data.data?.attributes?.last_analysis_stats?.malicious || 0;

    if (malicious > 0) {
      return 30; // Flagged if malicious detections exist
    }
    if (reputation < 0) {
      return 50; // Medium risk for low reputation
    }
    return 100; // Safe for clean domains
  } catch (error) {
    console.error("VirusTotal API error:", error);
    return 50; // Neutral score if API fails
  }
}

// Content analysis
async function analyzePageContent(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();

    const fraudulentPatterns = ["book now", "urgent", "verify"];
    const matches = fraudulentPatterns.some((pattern) =>
      text.toLowerCase().includes(pattern)
    );

    return matches ? 40 : 100; // Penalize fraudulent content
  } catch (error) {
    console.error("Content analysis error:", error);
    return 50;
  }
}

// Generate feedback
function generateFeedback(fraudScore, whoisScore, safeBrowsingScore, virusTotalScore, contentAnalysisScore) {
  const feedback = [];
  if (fraudScore < 50) feedback.push("Suspicious URL structure detected.");
  if (whoisScore < 50) feedback.push("Domain age is too new.");
  if (safeBrowsingScore < 50) feedback.push("Website flagged by Google Safe Browsing.");
  if (virusTotalScore < 50) feedback.push("Website flagged by VirusTotal.");
  if (contentAnalysisScore < 50) feedback.push("Suspicious content detected.");
  return feedback.length > 0 ? feedback : ["No issues detected."];
}
