(function () {
  const KEY = 'bl_theme';
  const saved = localStorage.getItem(KEY);
  const initial = saved === 'dark' ? 'dark' : 'light';
  function apply(theme) {
    localStorage.setItem(KEY, theme);
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    const button = document.getElementById('siteThemeToggle');
    const ar = localStorage.getItem('bl_lang') === 'ar';
    if (!button) return;
    const dark = theme === 'dark';
    button.querySelector('.theme-toggle-icon').textContent = dark ? '☀' : '☾';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? (ar ? 'تفعيل الوضع الفاتح' : 'Activer le mode clair') : (ar ? 'تفعيل الوضع الداكن' : 'Activer le mode sombre'));
    button.title = dark ? (ar ? 'الوضع الفاتح' : 'Mode clair') : (ar ? 'الوضع الداكن' : 'Mode sombre');
  }
  function setup() {
    apply(initial);
    document.getElementById('siteThemeToggle')?.addEventListener('click', () => {
      apply(document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark');
    });
    window.addEventListener('bl:languagechange', () => apply(document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
