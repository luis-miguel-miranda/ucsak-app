import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import React from 'react';
import useBreadcrumbStore from '@/stores/breadcrumb-store';

// Temporary mapping - ideally sourced from a shared config
const pathMap: { [key: string]: string } = {
  'data-products': 'Data Products',
  'data-contracts': 'Data Contracts',
  'business-glossary': 'Business Glossary',
  'master-data': 'Master Data Management',
  'compliance': 'Compliance',
  'estate-manager': 'Estate Manager',
  'security': 'Security Features',
  'entitlements': 'Entitlements',
  'entitlements-sync': 'Entitlements Sync',
  'catalog-commander': 'Catalog Commander',
  'settings': 'Settings',
  'about': 'About',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const dynamicTitle = useBreadcrumbStore((state) => state.dynamicTitle);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          {pathnames.length === 0 ? (
            <span className="flex items-center">
              <Home className="mr-1 h-4 w-4 flex-shrink-0" />
              <BreadcrumbPage>Home</BreadcrumbPage>
            </span>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center">
                <Home className="h-4 w-4 flex-shrink-0" />
                <span className="sr-only">Home</span>
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {pathnames.length > 0 && <BreadcrumbSeparator />}
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          let name = pathMap[value] || value;

          if (last && pathnames[index - 1] === 'data-products' && dynamicTitle) {
            name = dynamicTitle;
          }

          return (
            <React.Fragment key={to}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to}>{name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
} 