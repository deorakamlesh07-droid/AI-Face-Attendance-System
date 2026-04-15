export const ThemeToggle = () => {
  const toggleTheme = () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
  };

  return (
    <button className="ghost-button" onClick={toggleTheme}>
      Toggle theme
    </button>
  );
};
