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
    if (isInput || isContentEditable) {
        const value = isInput ? target.value : target.textContent;

        if (value.includes('/do')) {
            target.style.caretColor = "#ff17aa";
        } else {
            target.style.caretColor = 'auto';
        }
    }
}

async function fetchOpenAIResponse(prompt) {
    let data = {}
    try {

        data = await new Promise((resolve) => {
            chrome.storage.sync.get('apiKey', resolve);
        });

    } catch (e) {
        console.log("Localstorage error, probably local install.")
    }
    const apiKey = data?.apiKey;



    // Use the alternative URL if the API key is empty
    const url = apiKey
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://eo12wyl3ewqj2or.m.pipedream.net';

    try {
        const body = JSON.stringify({
            model: 'gpt-3.5-turbo',
            "messages": [{ "role": "user", "content": prompt.replace("/do ", "") }],
            max_tokens: 500,
            n: 1,
            stop: null,
            content: '',
            temperature: 0.7,
        })
        // If no API key provided, use the 'old' way of prompting while we are 
        // still using the gpt-3.5-turbo model on the server.
       console.log('xx', body)

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: body
        });

        data = await response.json();
        if (apiKey) {
            console.log(data)
            return data.choices[0].message.content.trim();
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

document.addEventListener('input', addBorder);
document.addEventListener('keydown', handleEnterOrTab);