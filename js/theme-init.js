/* Applies the saved (or system) theme before first paint — loaded in <head>, no flash. */
(function () { var t = null; try { t = localStorage.getItem('oa_theme'); } catch (e) {}
    if (t !== 'light' && t !== 'dark') t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0E0F1E' : '#6A4CFF'); })();
