import { useTheme } from "@/components/theme/theme-provider";
import { getAssetPath } from "@/utils/asset-path";

export function UnityCatalogLogo() {
  const { theme } = useTheme();
  
  return (
    <img
      className="h-10 w-10 mr-2"
      src={theme === 'dark' ? getAssetPath('/uc-logo-mark-reverse.svg') : getAssetPath('/uc-logo-mark.svg')}
      alt="Unity Catalog Logo"
    />
  );
} 