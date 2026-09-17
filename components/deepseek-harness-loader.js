(function () {
    'use strict';

    if (window.__hashcodDeepSeekHarnessLoaderLoaded) return;
    window.__hashcodDeepSeekHarnessLoaderLoaded = true;

    const current = document.currentScript;
    const currentSrc = current && current.src ? current.src : '';
    const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
        ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
        : '/components/';

    if (!document.getElementById('hashcodDeepSeekHarnessStylesheet')) {
        const link = document.createElement('link');
        link.id = 'hashcodDeepSeekHarnessStylesheet';
        link.rel = 'stylesheet';
        link.href = componentBase + 'deepseek-harness-cube.css?v=20260916-1';
        document.head.appendChild(link);
    }

    if (!document.querySelector('script[data-hashcod-deepseek-harness-cube]')) {
        const script = document.createElement('script');
        script.src = componentBase + 'deepseek-harness-cube.js?v=20260916-1';
        script.defer = true;
        script.dataset.hashcodDeepseekHarnessCube = 'true';
        document.head.appendChild(script);
    }
})();