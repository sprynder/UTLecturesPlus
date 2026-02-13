function list(e) {
    // console.log("what is e?")
    // console.log(e)
    let searchTerm = "utexas";
    if (e.initiator.includes(searchTerm)) {
        recieved = true;
        let caption_url = e.url
        // console.log("captions found")
        //console.log(caption_url)

        fetch(caption_url).then(r => r.text()).then(result => {
            console.log(result);
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {captions: result, source: e.initiator});  
            });
        })
    }
}

function iframeworkaround(e)
{
    if(e.method = "GET"){
    // console.log("what is e?")
    // console.log(e.requestHeaders[10])
    if(e.requestHeaders[10])
    {
        if (e.requestHeaders[10].name==="Referer")
        {
            
            let video_url = e.requestHeaders[10].value
            //console.log(video_url)
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {video_url: video_url});  
            });
        }
    }

    }
}
chrome.webRequest.onCompleted.addListener(function (e) {
    { list(e) };
}, { urls: ["*://*/*.vtt"], types: ["xmlhttprequest"] }, ["responseHeaders"]);


chrome.webRequest.onBeforeSendHeaders.addListener(function (e) {
    { iframeworkaround(e) };
}, { urls: ["*://*/*.edu"], types: ["xmlhttprequest"] }, ["extraHeaders" ,"requestHeaders"]);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== "summarizeTranscript") {
        return;
    }

    const apiKey = (message.apiKey || "").trim();
    const transcript = (message.transcript || "").trim();
    const useCustomPrompt = !!message.useCustomPrompt;
    const customPrompt = (message.customPrompt || "").trim();

    if (!apiKey) {
        sendResponse({ ok: false, error: "Missing OpenAI API key." });
        return;
    }

    if (!transcript) {
        sendResponse({ ok: false, error: "Transcript is empty." });
        return;
    }

    if (useCustomPrompt && !customPrompt) {
        sendResponse({ ok: false, error: "Custom prompt is empty." });
        return;
    }

    const trimmedTranscript = transcript.slice(0, 20000);
    const userPromptText = useCustomPrompt
        ? `User prompt:\n${customPrompt}\n\nTranscript:\n${trimmedTranscript}`
        : `Summarize this lecture transcript. Include: key topics, main takeaways, and action items if any.\n\n${trimmedTranscript}`;
    const systemPromptText = useCustomPrompt
        ? "You are a helpful assistant. Follow the user's prompt using the provided transcript as the source context."
        : "You summarize lecture transcripts clearly and concisely. Output plain text with short sections and bullets.";

    fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content: systemPromptText
                },
                {
                    role: "user",
                    content: userPromptText
                }
            ]
        })
    })
        .then(async function (response) {
            const data = await response.json();
            if (!response.ok) {
                const apiError = data && data.error && data.error.message ? data.error.message : "OpenAI request failed.";
                throw new Error(apiError);
            }

            const summary = data && data.choices && data.choices[0] && data.choices[0].message
                ? (data.choices[0].message.content || "").trim()
                : "";

            if (!summary) {
                throw new Error("No summary returned by OpenAI.");
            }

            sendResponse({ ok: true, summary: summary });
        })
        .catch(function (error) {
            sendResponse({ ok: false, error: error && error.message ? error.message : "Failed to summarize transcript." });
        });

    return true;
});


//"
// "*://lecturecapture.la.utexas.edu/*"