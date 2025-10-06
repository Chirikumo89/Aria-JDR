import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Vérifier la préférence système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
    
    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDark(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Ici on pourrait sauvegarder la préférence dans localStorage
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-tertiary hover:bg-hover transition-colors duration-200 border border-primary"
      title={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
