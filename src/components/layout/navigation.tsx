import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getNavigationGroups, FeatureConfig, FeatureMaturity } from '@/config/features';
import React from 'react';
// Import the Zustand store hook
import { useFeatureVisibilityStore } from '@/stores/feature-visibility-store';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  isCollapsed: boolean;
}

export function Navigation({ isCollapsed }: NavigationProps) {
  const location = useLocation();
  // Select only the allowedMaturities from the store
  const allowedMaturities = useFeatureVisibilityStore((state) => state.allowedMaturities);

  const navigationGroups = getNavigationGroups(allowedMaturities);

  return (
    <ScrollArea className="h-full py-2">
      <TooltipProvider delayDuration={0}>
        <nav className={cn("grid px-2 gap-1 justify-items-center")}>
          {navigationGroups.map((group) => (
            <div key={group.name} className={cn("w-full", isCollapsed ? "" : "mb-2 last:mb-0")}>
              {!isCollapsed && group.items.length > 0 && (
                <h2 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.name}
                </h2>
              )}
              {group.items.map((item: FeatureConfig) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                return isCollapsed ? (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'flex items-center justify-center rounded-lg p-2 transition-colors',
                          isActive
                            ? 'bg-muted text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        aria-label={item.name}
                        asChild
                      >
                        <NavLink to={item.path}>
                          <item.icon className="h-5 w-5" />
                          <span className="sr-only">{item.name}</span>
                        </NavLink>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4">
                      {item.name}
                      {item.maturity !== 'ga' && (
                          <span className={cn(
                              "ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full",
                              item.maturity === 'beta' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" : "",
                              item.maturity === 'alpha' ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" : ""
                          )}>
                              {item.maturity.toUpperCase()}
                          </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive: navIsActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        navIsActive
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                    {item.maturity !== 'ga' && (
                        <span className={cn(
                            "ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full",
                            item.maturity === 'beta' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" : "",
                            item.maturity === 'alpha' ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" : ""
                        )}>
                            {item.maturity.toUpperCase()}
                        </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </TooltipProvider>
    </ScrollArea>
  );
}