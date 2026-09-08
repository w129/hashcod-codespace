/* Resolve local media before any platform component starts rendering. */
(function () {
    window.l8Asset = function (path) {
        var p = String(path == null ? '' : path);
        if (!p) return p;
        if (/^(https?:|data:|blob:)/i.test(p)) return p;
        var base = window.L8_BASE_PATH || '/';
        if (p.charAt(0) === '/') p = p.slice(1);
        if (!base || base === '/') return '/' + p;
        return base.replace(/\/+$/, '/') + p;
    };
})();

