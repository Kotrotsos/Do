const originalBorderStyles = new WeakMap();

function showAdLink(generatedText, target) {
    if (generatedText.startsWith('* Ad:')) {
      const adUrlRegex = /(https?:\/\/[^\s]+)/g;
      const adUrl = adUrlRegex.exec(generatedText)[0];
  
      const linkElement = document.createElement('a');
      linkElement.href = adUrl;
      linkElement.target = "_blank";
      linkElement.textContent = 'Follow link';
      linkElement.style.position = 'absolute';
      linkElement.style.zIndex = '1000';
      linkElement.style.fontSize = '10px';
      const targetRect = target.getBoundingClientRect();
      linkElement.style.bottom = `${window.innerHeight - targetRect.bottom + 10}px`;
      linkElement.style.left = `${targetRect.left + 10}px`;
      linkElement.style.padding = "3px 10px";
      linkElement.style.borderRadius = "50px";
      linkElement.style.border = "Solid gray 1px";
      document.body.appendChild(linkElement);
  
      setTimeout(() => {
        linkElement.remove();
      }, 5000);
    }
  }
  

function addBorder(event) {
    const target = event.target;
    const isInput =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    const isContentEditable = target.isContentEditable;

    if (isContentEditable) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        let currentNode = range.startContainer;
        while (currentNode && currentNode.nodeType !== Node.ELEMENT_NODE) {
            currentNode = currentNode.parentNode;
        }

        if (currentNode && currentNode.tagName !== 'MARK') {
            const walker = document.createTreeWalker(currentNode, NodeFilter.SHOW_TEXT);
            let textNode;
            let doIndex = -1;

            while (walker.nextNode()) {
                const walkerNode = walker.currentNode;
                const walkerTextContent = walkerNode.textContent;
                const walkerDoIndex = walkerTextContent.lastIndexOf('/do');
                if (walkerDoIndex >= 0) {
                    textNode = walkerNode;
                    doIndex = walkerDoIndex;
                    break;
                }
            }

            if (doIndex >= 0) {
                const mark = document.createElement('mark');
                const markedText = textNode.textContent.slice(doIndex);
                mark.textContent = markedText;

                range.setStart(textNode, doIndex);
                range.setEnd(textNode, textNode.textContent.length);

                range.deleteContents();
                range.insertNode(mark);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }



  
    if (isInput || isContentEditable) {
      const value = isInput ? target.value : target.textContent;

      if (value.includes('/do')) {
        // Store the original border style if it hasn't been stored yet
        if (!originalBorderStyles.has(target)) {
          originalBorderStyles.set(target, {
            border: target.style.border,
            shadow: target.style.boxShadow,
            zIndex: target.style.zIndex, // Store the original z-index
          });
        }

        target.style.border = '1px solid green';
        target.style.boxShadow = 'rgb(0 0 0 / 24%) 0px 1px 10px 0px';
        target.style.zIndex = '999'; 
  
        const currentURL = window.location.href;
        if (!currentURL.includes('twitter') && !currentURL.includes('mail.google')) {
          // Create and append the dim overlay
        //   let dimOverlay = document.querySelector('.dim-overlay');
        //   if (!dimOverlay) {
        //     dimOverlay = document.createElement('div');
        //     dimOverlay.className = 'dim-overlay';
        //     document.body.appendChild(dimOverlay);
        //   }
        }
      } else {
        // Reset the border style and z-index to the original values
        if (originalBorderStyles.has(target)) {
          const originalStyles = originalBorderStyles.get(target);
          target.style.border = originalStyles.border;
          target.style.zIndex = originalStyles.zIndex;
          target.style.boxShadow = originalStyles.shadow;
        }
  
        // // Remove the dim overlay
        // const dimOverlay = document.querySelector('.dim-overlay');
        // if (dimOverlay) {
        //   dimOverlay.remove();
        // }
      }
    }
  }
  
  
  
  async function fetchOpenAIResponse(prompt) {
    let data = await new Promise((resolve) => {
      chrome.storage.sync.get('apiKey', resolve);
    });
  
    const apiKey = data.apiKey;
  
    // Use the alternative URL if the API key is empty
    const url = apiKey
      ? 'https://api.openai.com/v1/completions'
      : 'https://eo12wyl3ewqj2or.m.pipedream.net';
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: 'text-davinci-003',
          prompt: `${prompt.replace("/do ","")}`,
          max_tokens: 500,
          n: 1,
          stop: null,
          temperature: 0.7,
        }),
      });
      data = await response.json();
      if (apiKey) {
        return data.choices[0].text.trim();
      } else {
        return data.text
      }

    } catch (error) {
      console.log(
        'Network error, probably caused by a faulty setting. Check your API key:',
        error
      );
      return `${error.message}`;
    }
  }
  
  
  async function handleEnterOrTab(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
      const target = event.target;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      const isContentEditable = target.isContentEditable;
  
      if (isInput || isContentEditable) {
        const value = isInput ? target.value : target.textContent;
        const doCommandRegex = /\/do(.*?)(\n|$)/gm;
        const matches = value.match(doCommandRegex);
        if (matches) {
          target.previousValue = value; // Store the previous value before the replacement
          const loadingText = value.replace(doCommandRegex, '...Please wait a moment; this may take a couple of seconds.');
  
          if (isInput) {
            target.value = loadingText;
          } else {
            target.textContent = loadingText;
          }
  
          // Replace the {text} placeholder with the target element's value or text content
          const commandWithText = matches[0].replace('{text}', value);
          console.log('all text' , commandWithText)
          let openAIResponse = await fetchOpenAIResponse(commandWithText);
  
          // Check if the response is an error message
          const isError = openAIResponse.startsWith('Error: ');
          console.log(openAIResponse)

          const updatedValue = value.replace(doCommandRegex, () => {
            return isError ? openAIResponse : openAIResponse;
          });
  
          if (isInput) {
            target.value = updatedValue;
          } else {
            target.textContent = updatedValue;
          }
  
          showAdLink(openAIResponse, target);

          // Add the handleBacktick event listener after a successful replacement
          target.addEventListener('keydown', handleBacktick);
        }
      }
    }
  }
  
  function handleBacktick(event) {
    const target = event.target;
    const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    const isContentEditable = target.isContentEditable;
    const shouldRevert = event.key === '`' && (isInput || isContentEditable) && target.previousValue;
  
    if (shouldRevert) {
      event.preventDefault(); 
  
      if (isInput) {
        target.value = target.previousValue;
      } else {
        target.textContent = target.previousValue;
      }
      target.previousValue = null;
    }
  
    // Remove the handleBacktick event listener if the key pressed is not a backtick, regardless of whether the content has been reverted
    if (event.key !== '`') {
      target.removeEventListener('keydown', handleBacktick);
    }
  }
  
  
//   var editingIFrame = document.querySelectorAll('iframe.docs-texteventtarget-iframe')[0];
//   console.log(">>>>", editingIFrame)
//       if (editingIFrame) {
//         editingIFrame.contentDocument.addEventListener("keydown", handleEnterOrTab, false);
//         editingIFrame.contentDocument.addEventListener("input", addBorder, false);

//       }



  document.addEventListener('input', addBorder);
  document.addEventListener('keydown', handleEnterOrTab);