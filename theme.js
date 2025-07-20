const themes = {
  dark: {
    '--color-bg': '#0D1117',
    '--color-card-bg': '#161B22',
    '--color-text-main': '#C9D1D9',
    '--color-white': '#F0F6FC'
  },

  light: {
    '--color-bg': '#FFFFFF',
    '--color-card-bg': '#F1F5F9',
    '--color-text-main': '#1E293B',
    '--color-white': '#000000'
  },

  gray: {
    '--color-bg': '#1C1C1E',
    '--color-card-bg': '#2C2C2E',
    '--color-text-main': '#E5E5EA',
    '--color-white': '#FFFFFF'
  },

  blue: {
    '--color-bg': '#0A192F',
    '--color-card-bg': '#112240',
    '--color-text-main': '#BBDEFB',
    '--color-white': '#64FFDA'
  },

  green: {
    '--color-bg': '#0C1E16',
    '--color-card-bg': '#1A3A2F',
    '--color-text-main': '#D1FADF',
    '--color-white': '#86EFAC'
  },

  purple: {
    '--color-bg': '#1B112C',
    '--color-card-bg': '#321B4F',
    '--color-text-main': '#E9D5FF',
    '--color-white': '#D8B4FE'
  },

  sunset: {
    '--color-bg': '#2F0E1F',
    '--color-card-bg': '#511627',
    '--color-text-main': '#FFDDC1',
    '--color-white': '#FFD1A9'
  },

  orange: {
    '--color-bg': '#3A1A00',
    '--color-card-bg': '#7C2D12',
    '--color-text-main': '#FFD6AD',
    '--color-white': '#FFEEDD'
  },

  pink: {
    '--color-bg': '#3D102B',
    '--color-card-bg': '#8B2C4A',
    '--color-text-main': '#FFDCE5',
    '--color-white': '#FFF0F5'
  },

  teal: {
    '--color-bg': '#012D2A',
    '--color-card-bg': '#134E4A',
    '--color-text-main': '#A7FFEB',
    '--color-white': '#CCFBF1'
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
  window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    preloader.style.opacity = "0";
    preloader.style.visibility = "hidden";
    setTimeout(() => preloader.remove(), 500); // წაშლის DOM-იდან საბოლოოდ
  });