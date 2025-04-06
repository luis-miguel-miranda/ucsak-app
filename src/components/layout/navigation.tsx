import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Wrench } from 'lucide-react';
import NotificationBell from '@/components/ui/notification-bell';
import UserInfo from '@/components/ui/user-info';

const navigationGroups = [
  {
    name: 'Data Management',
    items: [
      { name: 'Data Products', path: '/data-products' },
      { name: 'Data Contracts', path: '/data-contracts' },
      { name: 'Business Glossary', path: '/business-glossary' },
      { name: 'Master Data Management', path: '/master-data' },
      { name: 'Compliance', path: '/compliance' },
      { name: 'Estate Manager', path: '/estate-manager' },
    ],
  },
  {
    name: 'Security',
    items: [
      { name: 'Security Features', path: '/security' },
      { name: 'Entitlements', path: '/entitlements' },
      { name: 'Entitlements Sync', path: '/entitlements-sync' },
    ],
  },
  {
    name: 'Tools',
    items: [
      { name: 'Catalog Commander', path: '/catalog-commander' },
    ],
  },
];

const standaloneItems = [
  { name: 'Settings', path: '/settings' },
  { name: 'About', path: '/about' },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <Wrench className="h-5 w-5" />
          <span className="font-bold">UC Swiss Army Knife</span>
        </Link>
        <div className="flex items-center space-x-6">
          {navigationGroups.map((group) => (
            <DropdownMenu key={group.name}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1">
                  {group.name}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={`${
                        location.pathname === item.path
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          {standaloneItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <ThemeToggle />
        <UserInfo />
      </div>
    </div>
  );
} 