import { useTheme } from '@/components/theme/theme-provider';

export function UnityCatalogLogo() {
  const { theme } = useTheme();
  
  return (
    <img
      src={theme === 'dark' ? '/static/uc-logo-mark-reverse.svg' : '/static/uc-logo-mark.svg'}
      alt="Unity Catalog Logo"
      className="h-10 w-10 mr-2"
    />
  );
} 