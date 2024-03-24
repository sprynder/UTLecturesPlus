function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {

  console.log(msg)
  if (msg.captions) {
    //modified_captions = addNewlineBeforeTimestamps(msg.captions)
    //console.log(msg.captions)
    if(msg.source == "https://lecturecapture.la.utexas.edu")
    {
      let existingDiv = document.getElementsByClassName('videorow')[0];
      const flexContainer = document.createElement('div');
      flexContainer.classList.add('flex-container');
  
      flexContainer.appendChild(existingDiv);
  
      const injectElement = document.createElement('div');
      const preElement = document.createElement('pre')
      preElement.innerHTML = msg.captions;
      injectElement.className = "caption-box";
      injectElement.appendChild(preElement);
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