/* 
themes in loadCSS()
add a theme from https://prismjs.com or https://github.com/PrismJS/prism-themes
add themes to lib/prism-<name>
add theme file path to manifest.json
*/
const theme = 'dracula';
const lineNumbers = true;

function isFullHtmlPage() {
  // Usually a full HTML page will have a <html> element as root
  return (
    document.documentElement.nodeName.toLowerCase() === 'html' &&
    document.body &&
    document.body.children.length > 0
  );
}

// Load CSS file dynamically (todo: add customization in popup)
function loadCSS() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL(`lib/prism-${theme.replace(' ', '-')}.css`); // Any theme can be here - add in manifest.json and lib/
  /* themes -
  coldark dark
  dracula
  synthwave84
  tomorrow night
  okaidia (broken)
  */
  document.head.appendChild(link); // Add to head
}

// Load PrismJS JavaScript dynamically
function loadPrismJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lib/prism.js'); // Updated script name

    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function fixDOM(lang) {
  /*  original:
  <body>
    <pre>
      console.log("hi!")
    </pre>
  </body>
      fixed:
  <body>
    <pre>
      <code class="lang-js">
        console.log("hi!")
      </code>
    </pre>
  </body>
  */
  let code = document.createElement('code');
  let pre = document.querySelector('pre');
  code.textContent = pre.textContent;
  code.className = 'language-' + lang;
  pre.innerHTML = '';
  pre.appendChild(code);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('/lib/highlight.css');
  document.head.appendChild(link);
}

const getLastPart = (str) => {
  let r = str.split('.').slice(-1)[0];
  if (location.search) {
    return r.split('?')[0];
  } else {
    return r;
  }
};

if (location.host === 'raw.githubusercontent.com') {
  loadCSS();

  loadPrismJS()
    .then(() => {
      const replaces = { xml: 'markup' };
      const lang = getLastPart(location.href);
      fixDOM(replaces[lang] || lang);

      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('/lib/highlight-all.js');
      script.onload = function () {
        this.remove();
      };
      document.head.appendChild(script);

      if (lineNumbers) {
        // load line numbers scripts and styles
      }
    })
    .catch(console.error);
} else {
  chrome.runtime.sendMessage({ type: 'GET_MIME_TYPE' }, (response) => {
    if (!response?.mime) return;

    const pureMime = response.mime.split(';')[0].trim();
    // console.log(pureMime);

    // Decide language and detection based on MIME and content
    if (pureMime === 'text/html') {
      if (isFullHtmlPage()) {
        // Treat as full HTML page — highlight the whole page or do nothing
        // console.log('Full HTML page detected');
        return 0;
      } else {
        // Looks like plain text with HTML tags (code snippet)
        // console.log('HTML code snippet detected');
        loadCSS();

        loadPrismJS()
          .then(() => {
            fixDOM('html'); // wrap <pre> content in <code class="language-html">
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('/lib/highlight-all.js');
            script.onload = function () {
              this.remove();
            };
            document.head.appendChild(script);

            if (lineNumbers) {
              // load line numbers scripts and styles
            }
          })
          .catch(console.error);
      }
    } else {
      // For other MIME types
      loadCSS();

      loadPrismJS()
        .then(() => {
          const replaces = { xml: 'markup' };
          const lang = pureMime.split('/')[1];
          fixDOM(replaces[lang] || lang);

          const script = document.createElement('script');
          script.src = chrome.runtime.getURL('/lib/highlight-all.js');
          script.onload = function () {
            this.remove();
          };
          document.head.appendChild(script);

          if (lineNumbers) {
            // load line numbers scripts and styles
          }
        })
        .catch(console.error);
    }
  });
}
