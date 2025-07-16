function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem("theme", theme);
  const icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "★" : "★";
}
(function(){
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  setTheme(theme);
})();
document.addEventListener("DOMContentLoaded", function(){
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", function(){
      const isLight = document.body.classList.contains("light");
      setTheme(isLight ? "dark" : "light");
    });
  }
});
