import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, FlaskConical, Beaker } from 'lucide-react';
import { useFeatureVisibilityStore } from '@/stores/feature-visibility-store';

interface UserInfoData {
  email: string | null;
  username: string | null;
  user: string | null;
  ip: string | null;
}

export default function UserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const { showBeta, showAlpha, actions } = useFeatureVisibilityStore();
  
  useEffect(() => {
    if (hasFetched.current) return;
    
    async function fetchUserInfo() {
      try {
        const response = await fetch('/api/user/info');
        if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUserInfo(data);
      } catch (err: any) {
        console.error('Failed to load user information:', err);
        setError(err.message || 'Failed to load user information');
      }
    }
    
    fetchUserInfo();
    hasFetched.current = true;
  }, []);

  const displayName = userInfo?.username || userInfo?.email || userInfo?.user || 'Loading...';
  const initials = displayName === 'Loading...' ? '?' : displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {userInfo?.email && (
              <p className="text-xs leading-none text-muted-foreground">{userInfo.email}</p>
            )}
            {!userInfo && !error && <p className="text-xs text-muted-foreground">Loading info...</p>}
            {error && (
              <p className="text-xs text-destructive">Error: {error}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Feature Previews</DropdownMenuLabel>
             <DropdownMenuCheckboxItem
                checked={showBeta}
                onCheckedChange={actions.toggleBeta}
                onSelect={(e) => e.preventDefault()}
            >
                <FlaskConical className="mr-2 h-4 w-4" />
                <span>Show Beta Features</span>
            </DropdownMenuCheckboxItem>
             <DropdownMenuCheckboxItem
                checked={showAlpha}
                onCheckedChange={actions.toggleAlpha}
                 onSelect={(e) => e.preventDefault()}
            >
                <Beaker className="mr-2 h-4 w-4" />
                <span>Show Alpha Features</span>
            </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


