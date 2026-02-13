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
      for (obj of caption_divs) {
        const preElement = document.createElement('pre');
        //preElement.className = "hover";
        preElement.innerHTML = obj.timestamp + "\n" + obj.caption;
        preElement.dataset.time = obj.milliseconds;
        preElement.addEventListener('click', function (e) {
          let video = document.getElementsByTagName("video")[0];;
          video.currentTime = e.srcElement.dataset.time;
        })
        injectElement.appendChild(preElement);

      }
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

      function handleSearch() {
        const searchInput = searchBar.value.toLowerCase();
        const captions = document.querySelectorAll('.caption-box pre');

        if (searchInput !== "") {
          captions.forEach(caption => {
            const text = caption.textContent.toLowerCase();
            if (text.includes(searchInput)) {
              caption.style.display = 'block';
              const highlightedText = caption.textContent.replace(new RegExp(searchInput, 'gi'), match => `<span class="highlight">${match}</span>`);
              caption.innerHTML = highlightedText;
            } else {
              caption.style.display = 'none';
            }
          });
          return;
        }

        captions.forEach(caption => {
          caption.style.display = 'block';
          caption.innerHTML = caption.textContent;
        });
      }

      const searchBar = document.createElement('input');
      searchBar.setAttribute('type', 'text');
      searchBar.setAttribute('id', 'searchInput');
      searchBar.setAttribute('placeholder', 'Search captions...');
      searchBar.addEventListener('input', handleSearch);

      const tabsDiv = document.createElement('div');
      tabsDiv.classList.add('caption-tabs');
      const transcriptTab = document.createElement('button');
      transcriptTab.classList.add('tab-btn', 'tab-active');
      transcriptTab.textContent = 'Transcript';
      const summaryTab = document.createElement('button');
      summaryTab.classList.add('tab-btn');
      summaryTab.textContent = 'Summary';
      tabsDiv.appendChild(transcriptTab);
      tabsDiv.appendChild(summaryTab);

      const transcriptPanel = document.createElement('div');
      transcriptPanel.classList.add('tab-panel');
      transcriptPanel.appendChild(searchBar);
      transcriptPanel.appendChild(injectElement);
      transcriptPanel.appendChild(buttonDiv);

      const summaryPanel = document.createElement('div');
      summaryPanel.classList.add('tab-panel', 'summary-panel');
      summaryPanel.style.display = 'none';

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

      function refreshPromptModeState() {
        const isCustomMode = customPromptRadio.checked;
        customPromptInput.style.display = isCustomMode ? 'block' : 'none';
        summarizeButton.textContent = isCustomMode ? 'Run Prompt' : 'Summarize Transcript';
      }

      function setTab(tabName) {
        const showTranscript = tabName === 'transcript';
        transcriptPanel.style.display = showTranscript ? 'flex' : 'none';
        summaryPanel.style.display = showTranscript ? 'none' : 'flex';
        transcriptTab.classList.toggle('tab-active', showTranscript);
        summaryTab.classList.toggle('tab-active', !showTranscript);
        if (!showTranscript) {
          refreshSummaryState();
        }
      }

      transcriptTab.addEventListener('click', function () {
        setTab('transcript');
      });

      summaryTab.addEventListener('click', function () {
        setTab('summary');
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
      });

      summaryPanel.appendChild(summaryStatus);
      summaryPanel.appendChild(keyContainer);
      summaryPanel.appendChild(promptModeContainer);
      summaryPanel.appendChild(summarizeButton);
      summaryPanel.appendChild(removeKeyButton);
      summaryPanel.appendChild(summaryOutput);

      injectElementOutside.appendChild(tabsDiv);
      injectElementOutside.appendChild(transcriptPanel);
      injectElementOutside.appendChild(summaryPanel);

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


