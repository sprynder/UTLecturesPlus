function list(e) {
    console.log(e)
    let searchTerm = "utexas";
    if (e.initiator.includes(searchTerm)) {
        recieved = true;
        let caption_url = e.url
        console.log("captions found")
        console.log(caption_url)

        fetch(caption_url).then(r => r.text()).then(result => {
            console.log(result);
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {captions: result, source: e.initiator});  
            });
        })
    }
}

chrome.webRequest.onCompleted.addListener(function (e) {
    { list(e) };
}, { urls: ["*://*/*.vtt"], types: ["xmlhttprequest"] }, ["responseHeaders"]);

//"*://*/*caption_proxy*"