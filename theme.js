// ფერები და თემები (შენი ვერსიიდან)
const themes = {
  dark: {
    '--color-bg': '#000000',
    '--color-text-main': '#E0E0E0',
    '--color-card-bg': '#121212',
    '--color-white': 'white'
  },
  light: {
    '--color-bg': '#FFFFFF',
    '--color-text-main': '#222222',
    '--color-card-bg': '#F5F5F5',
    '--color-white': 'black'
  },
  gray: {
    '--color-bg': '#2E2E2E',
    '--color-text-main': '#DADADA',
    '--color-card-bg': '#3A3A3A',
    '--color-white': 'white'
  },
  blue: {
    '--color-bg': '#001f3f',
    '--color-text-main': '#DCEFFF',
    '--color-card-bg': '#003366',
    '--color-white': 'white'
  },
  green: {
    '--color-bg': '#003300',
    '--color-text-main': '#CCFFCC',
    '--color-card-bg': '#005500',
    '--color-white': 'white'
  },
  purple: {
    '--color-bg': '#2D004D',
    '--color-text-main': '#F0DFFF',
    '--color-card-bg': '#4B0082',
    '--color-white': 'white'
  },
  sunset: {
    '--color-bg': '#2c061f',
    '--color-card-bg': '#4b1248',
    '--color-text-main': '#ffdab9',
    '--color-white': 'white'
  },
  orange: {
    '--color-bg': '#FF6600',
    '--color-card-bg': '#FF8533',
    '--color-text-main': '#331900',
    '--color-white': 'white'
  },
  pink: {
    '--color-bg': '#FFC0CB',
    '--color-card-bg': '#FFB6C1',
    '--color-text-main': '#4B0019',
    '--color-white': 'black'
  },
  teal: {
    '--color-bg': '#008080',
    '--color-card-bg': '#339999',
    '--color-text-main': '#003333',
    '--color-white': 'white'
  }
};

// Body კლასის გადართვა light თემაზე და localStorage-ში შენახვა
function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem("theme", theme);
  const icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "★" : "★";
}

// CSS ცვლადების მიბმა თემას
function applyThemeVariables(themeName) {
  const vars = themes[themeName];
  if (vars) {
    for (const key in vars) {
      document.documentElement.style.setProperty(key, vars[key]);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeSelectBtn');
  const panel = document.getElementById('themePickerPanel');

  // თემის ჩასატვირთად ლოკალურიდან ან სისტემიდან
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = stored || (prefersDark ? "dark" : "light");

  setTheme(initialTheme);
  applyThemeVariables(initialTheme);

  // ღილაკი თემის პანელის გახსნისთვის
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
    if (panel.style.display === 'block') {
      panel.focus();
    }
  });

  // თემის არჩევა პანელში
  panel.querySelectorAll('.color-option').forEach(button => {
    button.addEventListener('click', () => {
      const theme = button.getAttribute('data-theme');

      if (theme === 'light' || theme === 'dark') {
        setTheme(theme);
      } else {
        document.body.classList.remove("light");
        localStorage.setItem("theme", theme);
      }
      applyThemeVariables(theme);

      panel.style.display = 'none';

      const select = document.getElementById('colorThemeSelect');
      if (select) select.value = theme;
    });
  });

  // პანელის დახურვა როცა კლიკს სხვა ადგილზე გავაკეთებთ
  document.addEventListener('click', () => {
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
    }
  });

  // პანელის დახურვა ESC ღილაკით
  panel.addEventListener('keydown', e => {
    if (e.key === "Escape") {
      panel.style.display = 'none';
      btn.focus();
    }
  });

  // OPTIONAL: თუ გაქვს themeToggle ღილაკი სხვა ლოგიკისთვის, დაამატე აქაც
  const themeToggleBtn = document.getElementById("themeToggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isLight = document.body.classList.contains("light");
      const newTheme = isLight ? "dark" : "light";
      setTheme(newTheme);
      applyThemeVariables(newTheme);
      if (panel.style.display === 'block') panel.style.display = 'none';
      if (btn) btn.focus();

      const select = document.getElementById('colorThemeSelect');
      if (select) select.value = newTheme;
    });
  }
});