function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timestampToMilliseconds(timestamp) {
  // Split the timestamp into hours, minutes, seconds, and seconds
  const [hours, minutes, secondsWithMillis] = timestamp.split(':');
  
  // Split secondsWithMillis into seconds and seconds
  const [seconds, milliseconds] = secondsWithMillis.split('.');

  // Calculate the total milliseconds
  const totalMilliseconds =
    (parseInt(hours, 10) * 60 * 60 * 1000) +  // hours to milliseconds
    (parseInt(minutes, 10) * 60 * 1000) +      // minutes to milliseconds
    (parseInt(seconds, 10) * 1000) +            // seconds to milliseconds
    parseInt(milliseconds, 10);                // milliseconds

  return totalMilliseconds/1000;
}

chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {

  //console.log(msg)
  if (msg.captions) {
    //modified_captions = addNewlineBeforeTimestamps(msg.captions)
    //console.log(msg.captions)
    //console.log(msg.captions)
    if(msg.source.includes("utexas"))
    {
      let caption_divs = [];
      let captions = msg.captions;
      let caption_chunks = captions.split("\n\n");
      caption_chunks.shift();
      for (chunk of caption_chunks)
      {
        let s = chunk.split("\n");
        let timestamp = s[0].split(" ")[0];
        let cap = s[1];
        let milliseconds = timestampToMilliseconds(timestamp);
        caption_divs.push({timestamp: timestamp, caption: cap, milliseconds: milliseconds});
      }
      let existingDiv = document.getElementsByClassName('videorow')[0];
      const flexContainer = document.createElement('div');
      flexContainer.classList.add('flex-container');
  
      flexContainer.appendChild(existingDiv);
  
      const injectElement = document.createElement('div');
      injectElement.className = "caption-box";
      for (obj of caption_divs)
      {
        const preElement = document.createElement('pre');
        //preElement.className = "hover";
        preElement.innerHTML = obj.timestamp + "\n"+obj.caption;
        preElement.dataset.time = obj.milliseconds;
        preElement.addEventListener('click', function(e)
        {
          let video = document.getElementsByTagName("video")[0];;
          video.currentTime = e.srcElement.dataset.time;
        })
        injectElement.appendChild(preElement);

      }
      flexContainer.appendChild(injectElement);
      document.body.appendChild(flexContainer);
    }
  //  else{
  //     let iframe = document.getElementById("/html/body/ic-Layout-contentMain[3]/div[2]/div[2]/div[3]/div[1]/div/div[1]/iframe", document,
  //     null,
  //     XPathResult.FIRST_ORDERED_NODE_TYPE,
  //     null).singleNodeValue;
  //     let doc = ifrm.contentWindow.document;
  //     console.log(doc);
  //   // const flexContainer = document.createElement('div');
  //   // flexContainer.classList.add('flex-container');
  //   // flexContainer.appendChild(iframe);
  //   // const injectElement = document.createElement('div');
  //   // const preElement = document.createElement('pre')
  //   // preElement.innerHTML = msg.captions;
  //   // injectElement.className = "caption-box";
  //   // injectElement.appendChild(preElement);
  //   // flexContainer.appendChild(injectElement);
  //   // document.body.appendChild(flexContainer);
    
  //  }
   
  }
});

let vid = document.getElementsByTagName("video")[0];
vid.ontimeupdate = function() {
  let existingDiv = document.getElementsByClassName('caption-box')[0];
  let children = existingDiv.childNodes;
  console.log(children)
  let mindif = 10000;
  let cur = {};
  seekedTime = vid.currentTime;
  for (cap of children)
  {
    let dif = seekedTime - cap.dataset.time;
    if (dif >=0 && dif <= mindif)
    {
      mindif = dif;
      cur = cap;
    }
  }
  cur.scrollIntoView({ block: 'center',  behavior: 'smooth' });

};

vid.onseeked = function() {
  let existingDiv = document.getElementsByClassName('caption-box')[0];
  let children = existingDiv.childNodes;
  console.log(children)
  let mindif = 10000;
  let cur = {};
  seekedTime = vid.currentTime;
  for (cap of children)
  {
    let dif = seekedTime - cap.dataset.time;
    if (dif >=0 && dif <= mindif)
    {
      mindif = dif;
      cur = cap;
    }
  }
  cur.scrollIntoView({ block: 'center' });

};