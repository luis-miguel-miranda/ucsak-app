import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';

interface UserInfo {
  email: string | null;
  username: string | null;
  user: string | null;
  ip: string | null;
}

export default function UserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  
  useEffect(() => {
    if (hasFetched.current) return;
    
    async function fetchUserInfo() {
      try {
        const response = await fetch('/api/user/info');
        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        setError('Failed to load user information');
      }
    }
    
    fetchUserInfo();
    hasFetched.current = true;
  }, []);

  const displayName = userInfo?.username || userInfo?.email || userInfo?.user || 'n/a';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt="@user" />
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
            {userInfo?.ip && (
              <p className="text-xs leading-none text-muted-foreground">IP: {userInfo.ip}</p>
            )}
            {error && (
              <p className="text-xs text-destructive">Error: {error}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


