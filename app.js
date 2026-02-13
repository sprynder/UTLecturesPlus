var IFRAME = document.createElement("IFRAME");

function timestampToMilliseconds(timestamp) {
  // Split the timestamp into hours, minutes, seconds, and seconds
  const splitted_time = timestamp.split(':');
  let hours = "0";
  let minutes = "0";
  let secondsWithMillis = "00.000"
  if (splitted_time.length === 3){
    hours = splitted_time[0]
    minutes = splitted_time[1]
    secondsWithMillis = splitted_time[2]
  }
  else if (splitted_time.length === 2)
  {
    minutes = splitted_time[0]
    secondsWithMillis = splitted_time[1]
  }

  //console.log(secondsWithMillis)
  // Split secondsWithMillis into seconds and seconds
  const [seconds, milliseconds] = secondsWithMillis.split('.');

  // Calculate the total milliseconds
  const totalMilliseconds =
    (parseInt(hours, 10) * 60 * 60 * 1000) +  // hours to milliseconds
    (parseInt(minutes, 10) * 60 * 1000) +      // minutes to milliseconds
    (parseInt(seconds, 10) * 1000) +            // seconds to milliseconds
    parseInt(milliseconds, 10);                // milliseconds

  return totalMilliseconds / 1000;
}

function isNumeric(input) {
  var isValid = /^\d+$/.test(input);
  return isValid;
}

const OPENAI_KEY_STORAGE_KEY = 'ut_lectures_plus_openai_api_key';

function getSavedOpenAiKey() {
  try {
    return localStorage.getItem(OPENAI_KEY_STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

function saveOpenAiKey(key) {
  try {
    localStorage.setItem(OPENAI_KEY_STORAGE_KEY, key);
    return true;
  } catch (e) {
    return false;
  }
}

function removeOpenAiKey() {
  try {
    localStorage.removeItem(OPENAI_KEY_STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

let scroll = true;
let video_url = null;
var vid = null;
function auto_scroll() {
  let existingDiv = document.getElementsByClassName('caption-box')[0];
  if (existingDiv) {
    let children = existingDiv.childNodes;
    // console.log(children)
    let mindif = 10000;
    let cur = {};
    seekedTime = vid.currentTime;
    for (cap of children) {
      let dif = seekedTime - cap.dataset.time;
      if (dif >= 0 && dif <= mindif) {
        mindif = dif;
        cur = cap;
      }
      cap.style.backgroundColor = "white"
    }
    if (cur) {
     // console.log(cur)
      cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
      cur.style.backgroundColor = "LightGray";
    }
  }
};

var delayInMilliseconds = 1000; //1 second

setTimeout(function() {
  vid = document.getElementsByTagName("video")[0];
if (vid) {
  vid.ontimeupdate = auto_scroll;
    vid.onseeked = function () {
      let existingDiv = document.getElementsByClassName('caption-box')[0];
      if (existingDiv) {
        let children = existingDiv.childNodes;
        //console.log(children)
        let mindif = 10000;
        let cur = {};
        seekedTime = vid.currentTime;
        for (cap of children) {
          let dif = seekedTime - cap.dataset.time;
          if (dif >= 0 && dif <= mindif) {
            mindif = dif;
            cur = cap;
          }
        }
        if (cur)
          //console.log(cur)
        cur.scrollIntoView({ block: 'center' });
      }
    };
  
}

}, delayInMilliseconds);



chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {

  //console.log(msg)
  let loadCheck = document.getElementsByClassName('flex-container')[0]
  if (msg.captions && !loadCheck) {
    //modified_captions = addNewlineBeforeTimestamps(msg.captions)
    cur_url = window.document.location.href
    //console.log(cur_url)


    if (msg.source.includes("utexas")) {
      let caption_divs = [];
      let captions = msg.captions;
      let pattern = /^\d+\s*\n/gm;

      // Use replace() to remove those lines (replace them with an empty string)
      let cleanedText = captions.replace(pattern, "");

      pattern = /^ +/gm;

// Use replace() to remove the leading whitespace
      cleanedText = cleanedText.replace(pattern, "");
      let caption_chunks = cleanedText.split("\n\n");
      caption_chunks.shift();
      
      //caption_chunks = caption_chunks[1];
      if (caption_chunks.length ==1)
        caption_chunks = caption_chunks[0].split("\n\r\n");
      //console.log(caption_chunks)
      for (chunk of caption_chunks) {
        let s = chunk.split("\n");
        if (s.length > 1) {
          var isValid = /^\d+$/.test("" + s[0]);
          if (isNumeric(s[0].trim())) {
            s.shift();
          }
          let timestamp = s[0].split(" ")[0];
          let cap = s.slice(1).join(" ");
          let milliseconds = ""
          if (timestamp){
           milliseconds = timestampToMilliseconds(timestamp);
          }
          else{
            milliseconds = ""
          }
          caption_divs.push({ timestamp: timestamp, caption: cap, milliseconds: milliseconds });
        }
      }

      let existingDiv = null;
      if (msg.source.includes("lecturecapture")) {
        existingDiv = document.getElementsByClassName('videorow')[0];
      }
      else if (msg.source.includes("tower")) {
        existingDiv = document.getElementById('video_app');//getElementsByClassName('videorow')[0];
        // document.getElementById('video_app').classList.add("video_style_addon");
        document.getElementsByClassName('container')[0].classList.add("container_addon");
        document.querySelector("#video_app > div > div").classList.add("container_addon");
        document.querySelector("#video_app > div > div").style.marginTop = "30px";
        document.querySelector("#video_app > div > div > div:nth-child(2)").classList.add("container_addon");
        document.querySelector("#video_app > div > div > div.container_addon > div:nth-child(2)").classList.add("container_addon");
        document.querySelector("#video_app > div > div > div.container_addon > div:nth-child(2)").classList.add("cascade_addon");
        document.querySelector("#fullscreen_element").classList.add("big_video_addon");
      }
      existingDiv.classList.add("video_style");
      //document.getElementById('video_app');//getElementsByClassName('videorow')[0];
      const flexContainer = document.createElement('div');
      flexContainer.classList.add('flex-container');

      flexContainer.appendChild(existingDiv);

      const injectElementOutside = document.createElement('div');
      injectElementOutside.classList.add("captionBlob");
      const injectElement = document.createElement('div');
      injectElement.className = "caption-box";

      function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      function buildCaptionElement(obj, highlightTerm) {
        const preElement = document.createElement('pre');
        const rawText = obj.timestamp + "\n" + obj.caption;
        preElement.dataset.time = obj.milliseconds;
        preElement.dataset.rawText = rawText;
        preElement.dataset.captionText = obj.caption;

        if (highlightTerm) {
          const safeRegex = new RegExp(escapeRegExp(highlightTerm), 'gi');
          preElement.innerHTML = rawText.replace(safeRegex, function (match) {
            return `<span class="highlight">${match}</span>`;
          });
        }
        else {
          preElement.textContent = rawText;
        }

        preElement.addEventListener('click', function (e) {
          let video = document.getElementsByTagName("video")[0];
          if (video) {
            video.currentTime = e.currentTarget.dataset.time;
          }
        });

        return preElement;
      }

      function renderCaptionList(items, highlightTerm) {
        injectElement.innerHTML = '';
        for (const item of items) {
          injectElement.appendChild(buildCaptionElement(item, highlightTerm));
        }
      }

      function createSemanticChunks(items) {
        const chunkSize = 3;
        const chunks = [];

        for (let i = 0; i < items.length; i += chunkSize) {
          const group = items.slice(i, i + chunkSize);
          const combinedCaption = group.map(function (entry) { return entry.caption; }).join(' ');
          const first = group[0];

          if (!first || !combinedCaption.trim()) {
            continue;
          }

          chunks.push({
            id: `${i}`,
            timestamp: first.timestamp,
            milliseconds: first.milliseconds,
            caption: combinedCaption
          });
        }

        return chunks;
      }

      function dotProduct(a, b) {
        let total = 0;
        for (let i = 0; i < a.length; i++) {
          total += a[i] * b[i];
        }
        return total;
      }

      function vectorNorm(a) {
        return Math.sqrt(dotProduct(a, a));
      }

      function cosineSimilarity(a, b) {
        const denom = vectorNorm(a) * vectorNorm(b);
        if (!denom) {
          return 0;
        }
        return dotProduct(a, b) / denom;
      }

      function requestEmbeddings(inputs, apiKey) {
        return new Promise(function (resolve, reject) {
          chrome.runtime.sendMessage(
            {
              type: 'createEmbeddings',
              inputs: inputs,
              apiKey: apiKey
            },
            function (response) {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }

              if (!response || !response.ok || !Array.isArray(response.embeddings)) {
                reject(new Error(response && response.error ? response.error : 'Unable to create embeddings.'));
                return;
              }

              resolve(response.embeddings);
            }
          );
        });
      }

      let transcriptSearchMode = 'keyword';
      let semanticIndex = null;
      let semanticSearchBusy = false;

      const transcriptSearchStatus = document.createElement('div');
      transcriptSearchStatus.classList.add('transcript-search-status');
      transcriptSearchStatus.textContent = '';

      const searchBar = document.createElement('input');
      searchBar.setAttribute('type', 'text');
      searchBar.setAttribute('id', 'searchInput');
      searchBar.setAttribute('placeholder', 'Search captions...');

      const searchControls = document.createElement('div');
      searchControls.classList.add('transcript-search-controls');
      const searchModeContainer = document.createElement('div');
      searchModeContainer.classList.add('search-mode-container');

      const keywordModeLabel = document.createElement('label');
      keywordModeLabel.classList.add('search-mode-option');
      const keywordModeInput = document.createElement('input');
      keywordModeInput.type = 'radio';
      keywordModeInput.name = 'transcriptSearchMode';
      keywordModeInput.value = 'keyword';
      keywordModeInput.checked = true;
      const keywordModeText = document.createElement('span');
      keywordModeText.textContent = 'Keyword';
      keywordModeLabel.appendChild(keywordModeInput);
      keywordModeLabel.appendChild(keywordModeText);

      const semanticModeLabel = document.createElement('label');
      semanticModeLabel.classList.add('search-mode-option');
      const semanticModeInput = document.createElement('input');
      semanticModeInput.type = 'radio';
      semanticModeInput.name = 'transcriptSearchMode';
      semanticModeInput.value = 'semantic';
      const semanticModeText = document.createElement('span');
      semanticModeText.textContent = 'Semantic';
      semanticModeLabel.appendChild(semanticModeInput);
      semanticModeLabel.appendChild(semanticModeText);

      const semanticSearchButton = document.createElement('button');
      semanticSearchButton.classList.add('button-4');
      semanticSearchButton.textContent = 'Run Semantic Search';
      semanticSearchButton.style.display = 'none';

      searchModeContainer.appendChild(keywordModeLabel);
      searchModeContainer.appendChild(semanticModeLabel);
      searchControls.appendChild(searchBar);
      searchControls.appendChild(searchModeContainer);
      searchControls.appendChild(semanticSearchButton);
      searchControls.appendChild(transcriptSearchStatus);

      function runKeywordSearch() {
        const query = searchBar.value.trim().toLowerCase();
        transcriptSearchStatus.textContent = '';

        if (!query) {
          renderCaptionList(caption_divs, '');
          return;
        }

        const filteredItems = caption_divs.filter(function (item) {
          return item.caption.toLowerCase().includes(query) || item.timestamp.toLowerCase().includes(query);
        });

        renderCaptionList(filteredItems, query);
      }

      async function ensureSemanticIndex() {
        if (semanticIndex) {
          return semanticIndex;
        }

        const apiKey = getSavedOpenAiKey().trim();
        if (!apiKey) {
          throw new Error('Save an OpenAI API key in Summary tab before using semantic search.');
        }

        transcriptSearchStatus.textContent = 'Creating semantic index...';
        const chunks = createSemanticChunks(caption_divs);
        if (!chunks.length) {
          throw new Error('Transcript has no content to index.');
        }

        const chunkTexts = chunks.map(function (chunk) { return chunk.caption.slice(0, 1200); });
        const embeddings = await requestEmbeddings(chunkTexts, apiKey);

        semanticIndex = chunks.map(function (chunk, index) {
          return {
            id: chunk.id,
            timestamp: chunk.timestamp,
            milliseconds: chunk.milliseconds,
            caption: chunk.caption,
            embedding: embeddings[index]
          };
        });

        return semanticIndex;
      }

      async function runSemanticSearch() {
        const query = searchBar.value.trim();
        transcriptSearchStatus.textContent = '';

        if (!query) {
          renderCaptionList(caption_divs, '');
          transcriptSearchStatus.textContent = 'Enter a query to run semantic search.';
          return;
        }

        if (semanticSearchBusy) {
          return;
        }

        semanticSearchBusy = true;
        semanticSearchButton.disabled = true;

        try {
          const ranked = await retrieveTopSemanticChunks(query, 20, transcriptSearchStatus);

          if (!ranked.length) {
            renderCaptionList(caption_divs, '');
            transcriptSearchStatus.textContent = 'No semantic matches found.';
            return;
          }

          renderCaptionList(ranked, '');
          transcriptSearchStatus.textContent = `Showing top ${ranked.length} semantic matches.`;
        }
        catch (error) {
          transcriptSearchStatus.textContent = 'Error: ' + (error && error.message ? error.message : 'Semantic search failed.');
        }
        finally {
          semanticSearchBusy = false;
          semanticSearchButton.disabled = false;
        }
      }

      async function retrieveTopSemanticChunks(query, maxResults, statusElement) {
        const index = await ensureSemanticIndex();
        const apiKey = getSavedOpenAiKey().trim();
        if (statusElement) {
          statusElement.textContent = 'Embedding query...';
        }
        const queryEmbeddings = await requestEmbeddings([query.slice(0, 1000)], apiKey);
        const queryVector = queryEmbeddings[0];

        if (statusElement) {
          statusElement.textContent = 'Searching semantically...';
        }
        return index
          .map(function (item) {
            return {
              item: item,
              score: cosineSimilarity(queryVector, item.embedding)
            };
          })
          .sort(function (a, b) {
            return b.score - a.score;
          })
          .slice(0, maxResults)
          .map(function (entry) { return entry.item; });
      }

      function handleSearchModeChange() {
        transcriptSearchMode = semanticModeInput.checked ? 'semantic' : 'keyword';
        semanticSearchButton.style.display = transcriptSearchMode === 'semantic' ? 'inline-block' : 'none';

        if (transcriptSearchMode === 'keyword') {
          runKeywordSearch();
          return;
        }

        renderCaptionList(caption_divs, '');
        transcriptSearchStatus.textContent = 'Semantic mode enabled. Enter a query and click Run Semantic Search.';
      }

      searchBar.addEventListener('input', function () {
        if (transcriptSearchMode === 'keyword') {
          runKeywordSearch();
        }
      });

      searchBar.addEventListener('keydown', function (event) {
        if (transcriptSearchMode === 'semantic' && event.key === 'Enter') {
          event.preventDefault();
          runSemanticSearch();
        }
      });

      keywordModeInput.addEventListener('change', handleSearchModeChange);
      semanticModeInput.addEventListener('change', handleSearchModeChange);
      semanticSearchButton.addEventListener('click', runSemanticSearch);

      renderCaptionList(caption_divs, '');
      const buttonDiv = document.createElement('div');
      buttonDiv.classList.add("right");
      const button = document.createElement('button');
      button.innerHTML = "Auto-Scroll: On"
      button.onclick = function () {
        if (!scroll) {
          if (vid)
            vid.ontimeupdate = auto_scroll;
          scroll = true;
          button.style.background = "white";
          button.innerHTML = "Auto-Scroll: On"
        }
        else {
          if (vid){
            vid.ontimeupdate = function () {
              let existingDiv = document.getElementsByClassName('caption-box')[0];
              let children = existingDiv.childNodes;
              // console.log(children)
              let mindif = 10000;
              let cur = {};
              seekedTime = vid.currentTime;
              for (cap of children) {
                let dif = seekedTime - cap.dataset.time;
                if (dif >= 0 && dif <= mindif) {
                  mindif = dif;
                  cur = cap;
                }
                cap.style.backgroundColor = "white"
              }
              //cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
              cur.style.backgroundColor = "LightGray";
            };
          }
          
          scroll = false;
          button.style.backgroundColor = "#DCDCDC";
          button.innerHTML = "Auto-Scroll: Off"
        }

      }
      button.classList.add("button-4");
      buttonDiv.appendChild(button)

      const tabsDiv = document.createElement('div');
      tabsDiv.classList.add('caption-tabs');
      const transcriptTab = document.createElement('button');
      transcriptTab.classList.add('tab-btn', 'tab-active');
      transcriptTab.textContent = 'Transcript';
      const summaryTab = document.createElement('button');
      summaryTab.classList.add('tab-btn');
      summaryTab.textContent = 'Summary';
      const ragTab = document.createElement('button');
      ragTab.classList.add('tab-btn');
      ragTab.textContent = 'RAG';
      tabsDiv.appendChild(transcriptTab);
      tabsDiv.appendChild(summaryTab);
      tabsDiv.appendChild(ragTab);

      const transcriptPanel = document.createElement('div');
      transcriptPanel.classList.add('tab-panel');
      transcriptPanel.appendChild(searchControls);
      transcriptPanel.appendChild(injectElement);
      transcriptPanel.appendChild(buttonDiv);

      const summaryPanel = document.createElement('div');
      summaryPanel.classList.add('tab-panel', 'summary-panel');
      summaryPanel.style.display = 'none';

      const ragPanel = document.createElement('div');
      ragPanel.classList.add('tab-panel', 'rag-panel');
      ragPanel.style.display = 'none';

      const summaryStatus = document.createElement('div');
      summaryStatus.classList.add('summary-status');

      const keyContainer = document.createElement('div');
      keyContainer.classList.add('summary-key-container');
      const keyInput = document.createElement('input');
      keyInput.type = 'password';
      keyInput.placeholder = 'Enter OpenAI API key';
      keyInput.classList.add('summary-key-input');
      const saveKeyButton = document.createElement('button');
      saveKeyButton.classList.add('button-4');
      saveKeyButton.textContent = 'Save API Key';
      keyContainer.appendChild(keyInput);
      keyContainer.appendChild(saveKeyButton);

      const summarizeButton = document.createElement('button');
      summarizeButton.classList.add('button-4', 'summary-action-btn');
      summarizeButton.textContent = 'Summarize Transcript';

      const promptModeContainer = document.createElement('div');
      promptModeContainer.classList.add('summary-prompt-mode');

      const defaultPromptRow = document.createElement('label');
      defaultPromptRow.classList.add('summary-radio-row');
      const defaultPromptRadio = document.createElement('input');
      defaultPromptRadio.type = 'radio';
      defaultPromptRadio.name = 'transcriptPromptMode';
      defaultPromptRadio.value = 'default';
      defaultPromptRadio.checked = true;
      const defaultPromptText = document.createElement('span');
      defaultPromptText.textContent = 'Use default summary prompt';
      defaultPromptRow.appendChild(defaultPromptRadio);
      defaultPromptRow.appendChild(defaultPromptText);

      const customPromptRow = document.createElement('label');
      customPromptRow.classList.add('summary-radio-row');
      const customPromptRadio = document.createElement('input');
      customPromptRadio.type = 'radio';
      customPromptRadio.name = 'transcriptPromptMode';
      customPromptRadio.value = 'custom';
      const customPromptText = document.createElement('span');
      customPromptText.textContent = 'Use my own prompt';
      customPromptRow.appendChild(customPromptRadio);
      customPromptRow.appendChild(customPromptText);

      const customPromptInput = document.createElement('textarea');
      customPromptInput.classList.add('custom-prompt-input');
      customPromptInput.placeholder = 'Enter your custom prompt...';
      customPromptInput.style.display = 'none';

      promptModeContainer.appendChild(defaultPromptRow);
      promptModeContainer.appendChild(customPromptRow);
      promptModeContainer.appendChild(customPromptInput);

      const removeKeyButton = document.createElement('button');
      removeKeyButton.classList.add('button-4', 'summary-action-btn');
      removeKeyButton.textContent = 'Remove Saved API Key';

      const summaryOutput = document.createElement('div');
      summaryOutput.classList.add('summary-output');
      summaryOutput.textContent = 'Generate a summary to view it here.';

      const ragStatus = document.createElement('div');
      ragStatus.classList.add('summary-status');

      const ragPromptInput = document.createElement('textarea');
      ragPromptInput.classList.add('custom-prompt-input');
      ragPromptInput.placeholder = 'Enter your custom RAG prompt...';

      const ragRunButton = document.createElement('button');
      ragRunButton.classList.add('button-4', 'summary-action-btn');
      ragRunButton.textContent = 'Run RAG Prompt';

      const ragOutput = document.createElement('div');
      ragOutput.classList.add('summary-output');
      ragOutput.textContent = 'RAG answer will appear here.';

      const transcriptText = caption_divs.map(item => item.caption).join('\n');

      function refreshSummaryState(message) {
        const hasKey = getSavedOpenAiKey().trim() !== '';
        keyContainer.style.display = hasKey ? 'none' : 'flex';
        summarizeButton.style.display = hasKey ? 'inline-block' : 'none';
        removeKeyButton.style.display = hasKey ? 'inline-block' : 'none';
        promptModeContainer.style.display = hasKey ? 'flex' : 'none';
        if (message) {
          summaryStatus.textContent = message;
          return;
        }
        summaryStatus.textContent = hasKey
          ? 'API key found. Choose default summary or your own prompt.'
          : 'No API key found. Enter your OpenAI API key to continue.';
      }

      function refreshRagState(message) {
        const hasKey = getSavedOpenAiKey().trim() !== '';
        ragRunButton.style.display = hasKey ? 'inline-block' : 'none';
        ragPromptInput.style.display = hasKey ? 'block' : 'none';
        if (message) {
          ragStatus.textContent = message;
          return;
        }
        ragStatus.textContent = hasKey
          ? 'Use a custom prompt. RAG will retrieve relevant chunks first, then generate an answer.'
          : 'No API key found. Save your key in Summary tab to use RAG.';
      }

      function refreshPromptModeState() {
        const isCustomMode = customPromptRadio.checked;
        customPromptInput.style.display = isCustomMode ? 'block' : 'none';
        summarizeButton.textContent = isCustomMode ? 'Run Prompt' : 'Summarize Transcript';
      }

      function setTab(tabName) {
        const showTranscript = tabName === 'transcript';
        const showSummary = tabName === 'summary';
        const showRag = tabName === 'rag';
        transcriptPanel.style.display = showTranscript ? 'flex' : 'none';
        summaryPanel.style.display = showSummary ? 'flex' : 'none';
        ragPanel.style.display = showRag ? 'flex' : 'none';
        transcriptTab.classList.toggle('tab-active', showTranscript);
        summaryTab.classList.toggle('tab-active', showSummary);
        ragTab.classList.toggle('tab-active', showRag);
        if (showSummary) {
          refreshSummaryState();
        }
        if (showRag) {
          refreshRagState();
        }
      }

      transcriptTab.addEventListener('click', function () {
        setTab('transcript');
      });

      summaryTab.addEventListener('click', function () {
        setTab('summary');
      });

      ragTab.addEventListener('click', function () {
        setTab('rag');
      });

      defaultPromptRadio.addEventListener('change', refreshPromptModeState);
      customPromptRadio.addEventListener('change', refreshPromptModeState);

      saveKeyButton.addEventListener('click', function () {
        const key = keyInput.value.trim();
        if (!key) {
          refreshSummaryState('Please enter a valid API key.');
          return;
        }

        const saved = saveOpenAiKey(key);
        if (!saved) {
          refreshSummaryState('Unable to save API key in local storage.');
          return;
        }

        keyInput.value = '';
        refreshSummaryState('API key saved. You can now summarize the transcript.');
        refreshRagState('API key saved. You can now run RAG prompts.');
      });

      summarizeButton.addEventListener('click', function () {
        const apiKey = getSavedOpenAiKey().trim();
        const useCustomPrompt = customPromptRadio.checked;
        const customPrompt = customPromptInput.value.trim();
        if (!apiKey) {
          refreshSummaryState('No API key found. Please save your key first.');
          return;
        }

        if (useCustomPrompt && !customPrompt) {
          refreshSummaryState('Please enter a custom prompt.');
          return;
        }

        summarizeButton.disabled = true;
        summarizeButton.textContent = useCustomPrompt ? 'Running Prompt...' : 'Summarizing...';
        summaryStatus.textContent = 'Generating summary...';

        chrome.runtime.sendMessage(
          {
            type: 'summarizeTranscript',
            transcript: transcriptText,
            apiKey: apiKey,
            useCustomPrompt: useCustomPrompt,
            customPrompt: customPrompt
          },
          function (response) {
            summarizeButton.disabled = false;
            refreshPromptModeState();

            if (chrome.runtime.lastError) {
              summaryStatus.textContent = 'Error: ' + chrome.runtime.lastError.message;
              return;
            }

            if (!response || !response.ok) {
              const errorText = response && response.error ? response.error : 'Unable to generate summary.';
              summaryStatus.textContent = 'Error: ' + errorText;
              return;
            }

            summaryStatus.textContent = 'Summary generated.';
            summaryOutput.textContent = response.summary;
          }
        );
      });

      removeKeyButton.addEventListener('click', function () {
        const removed = removeOpenAiKey();
        if (!removed) {
          refreshSummaryState('Unable to remove saved API key.');
          return;
        }
        summaryOutput.textContent = 'Generate a summary to view it here.';
        refreshSummaryState('Saved API key removed. Enter a new key to continue.');
        refreshRagState('Saved API key removed. Enter a key in Summary tab to use RAG.');
      });

      ragRunButton.addEventListener('click', async function () {
        const apiKey = getSavedOpenAiKey().trim();
        const ragPrompt = ragPromptInput.value.trim();

        if (!apiKey) {
          refreshRagState('No API key found. Save your key in Summary tab first.');
          return;
        }

        if (!ragPrompt) {
          refreshRagState('Please enter a custom RAG prompt.');
          return;
        }

        ragRunButton.disabled = true;
        ragRunButton.textContent = 'Running RAG...';

        try {
          const retrievedChunks = await retrieveTopSemanticChunks(ragPrompt, 8, ragStatus);

          if (!retrievedChunks.length) {
            ragStatus.textContent = 'No semantic context found for this prompt.';
            ragOutput.textContent = 'RAG answer will appear here.';
            ragRunButton.disabled = false;
            ragRunButton.textContent = 'Run RAG Prompt';
            return;
          }

          ragStatus.textContent = 'Generating grounded answer...';
          chrome.runtime.sendMessage(
            {
              type: 'ragPromptWithContext',
              apiKey: apiKey,
              prompt: ragPrompt,
              contextChunks: retrievedChunks
            },
            function (response) {
              ragRunButton.disabled = false;
              ragRunButton.textContent = 'Run RAG Prompt';

              if (chrome.runtime.lastError) {
                ragStatus.textContent = 'Error: ' + chrome.runtime.lastError.message;
                return;
              }

              if (!response || !response.ok) {
                ragStatus.textContent = 'Error: ' + (response && response.error ? response.error : 'RAG request failed.');
                return;
              }

              ragStatus.textContent = `RAG answer generated using ${retrievedChunks.length} retrieved chunks.`;
              ragOutput.textContent = response.answer;
            }
          );
        }
        catch (error) {
          ragRunButton.disabled = false;
          ragRunButton.textContent = 'Run RAG Prompt';
          ragStatus.textContent = 'Error: ' + (error && error.message ? error.message : 'RAG pipeline failed.');
        }
      });

      summaryPanel.appendChild(summaryStatus);
      summaryPanel.appendChild(keyContainer);
      summaryPanel.appendChild(promptModeContainer);
      summaryPanel.appendChild(summarizeButton);
      summaryPanel.appendChild(removeKeyButton);
      summaryPanel.appendChild(summaryOutput);

      ragPanel.appendChild(ragStatus);
      ragPanel.appendChild(ragPromptInput);
      ragPanel.appendChild(ragRunButton);
      ragPanel.appendChild(ragOutput);

      injectElementOutside.appendChild(tabsDiv);
      injectElementOutside.appendChild(transcriptPanel);
      injectElementOutside.appendChild(summaryPanel);
      injectElementOutside.appendChild(ragPanel);

      const containerDiv = document.createElement('div');
      if (msg.source.includes("lecturecapture")) {
        containerDiv.classList.add('search-container');
      }
      else if (msg.source.includes("tower")) {
        containerDiv.classList.add('search-container-tower');
        containerDiv.classList.add('top_padding');
      }
      containerDiv.style.display = 'flex';
      containerDiv.style.flexDirection = 'column';
      containerDiv.appendChild(injectElementOutside);

      flexContainer.appendChild(containerDiv);

      setTab('transcript');
      refreshPromptModeState();
      refreshSummaryState();
      refreshRagState();
      document.body.appendChild(flexContainer);
    }

  }
  else {
    if (video_url == null) {
      video_url = msg.video_url
      //console.log(video_url)
      const button = document.createElement('button');
      const frameDiv = document.getElementsByClassName('tool_content_wrapper')[0]
      // Set the button's text content
      button.textContent = 'Click here to open video in new tab with transcript!';

      // Define the callback function
      function handleClick() {
        window.open(video_url)
        // Add any functionality you want here
      }

      // Attach the callback function to the button's click event
      button.addEventListener('click', handleClick);

      // Append the button to the document body (or any other container)
      if (frameDiv) {
        frameDiv.appendChild(button);
      }
    }
  }

});


