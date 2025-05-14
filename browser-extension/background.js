// Generate or retrieve a unique client ID and update dynamic rules with it.
async function ensureClientId() {
    const key = 'clientId';
    let clientId = await chrome.storage.local.get(key).then(result => result[key]);
    if (!clientId) {
        // Generate a new random UUID
        clientId = crypto.randomUUID();
        await chrome.storage.local.set({ [key]: clientId });
    }
    return clientId;
}

async function updateRedirectRule() {
    const clientId = await ensureClientId();
    // Remove any previously installed dynamic rules.
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] });
    // Add a dynamic rule that matches image requests and appends the clientId.
    // Here we use a regex with one capturing group for the original URL.
    const rule = {
        id: 1,
        priority: 1,
        action: {
            type: "redirect",
            redirect: {
                regexSubstitution: `https://sustainable-image-conversion-cdn-server.onrender.com/convert?img=\\1&clientId=${clientId}`
            }
        },
        condition: {
            // Match any http or https URL (capturing entire URL into group 1)
            regexFilter: "^(https?://.*)",
            resourceTypes: ["image"],
            excludedRequestDomains: ["sustainable-image-conversion-cdn-server.onrender.com"]
        }
    };
    await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule] });
    console.log("Dynamic redirect rule updated with clientId", clientId);
}

chrome.runtime.onInstalled.addListener(() => {
    updateRedirectRule();
    console.log("Image CDN Redirector installed and dynamic rule set.");
});

chrome.runtime.onStartup.addListener(() => {
    updateRedirectRule();
    console.log("Image CDN Redirector started and dynamic rule updated.");
});
