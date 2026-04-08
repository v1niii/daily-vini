/* ================================================================
   Daily Vini – Shared utilities
   ================================================================ */

const DV = (() => {
    const csrfToken = () => {
        const el = document.querySelector('meta[name="csrf-token"]');
        return el ? el.content : "";
    };

    async function api(url, opts = {}) {
        const defaults = {
            headers: { "X-CSRFToken": csrfToken() },
        };
        if (opts.body && typeof opts.body === "object") {
            defaults.headers["Content-Type"] = "application/json";
            opts.body = JSON.stringify(opts.body);
        }
        const resp = await fetch(url, { ...defaults, ...opts });
        const data = await resp.json();
        if (!resp.ok || data.status === "error") {
            throw new Error(data.error || `API error ${resp.status}`);
        }
        return data;
    }

    function show(el)  { el.classList.remove("hidden"); }
    function hide(el)  { el.classList.add("hidden"); }

    function escHtml(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    return { api, show, hide, escHtml, el };
})();
