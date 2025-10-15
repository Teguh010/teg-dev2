const loadHereMaps = (callback) => {
  const coreScript = document.createElement('script');
  coreScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-core.js';
  coreScript.onload = () => {
    const serviceScript = document.createElement('script');
    serviceScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-service.js';
    serviceScript.onload = () => {
      const eventsScript = document.createElement('script');
      eventsScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js';
      eventsScript.onload = () => {
        const uiScript = document.createElement('script');
        uiScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-ui.js';
        uiScript.onload = () => {
          const harpScript = document.createElement('script');
          harpScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-harp.js'; // Tambahkan skrip HARP
          harpScript.onload = () => {
            const uiStylesheet = document.createElement('link');
            uiStylesheet.rel = 'stylesheet';
            uiStylesheet.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
            document.head.appendChild(uiStylesheet);
            callback();
          };
          document.body.appendChild(harpScript);
        };
        document.body.appendChild(uiScript);
      };
      document.body.appendChild(eventsScript);
    };
    document.body.appendChild(serviceScript);
  };
  document.body.appendChild(coreScript);
};

export default loadHereMaps;
