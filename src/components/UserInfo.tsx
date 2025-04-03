import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UserInfo {
  email: string | null;
  username: string | null;
  user: string | null;
  ip: string | null;
}

export default function UserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log('Fetching user information...');
        const response = await fetch('/api/user/info');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('User information received:', data);
        setUserInfo(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching user info:', errorMessage);
        setError(errorMessage);
      }
    };

    fetchUserInfo();
  }, []);

  const displayName = userInfo?.username || userInfo?.email || userInfo?.user || 'n/a';

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>User Information</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-1 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {userInfo?.email && (
              <p className="text-xs text-muted-foreground">{userInfo.email}</p>
            )}
            {userInfo?.ip && (
              <p className="text-xs text-muted-foreground">IP: {userInfo.ip}</p>
            )}
            {error && (
              <p className="text-xs text-destructive">Error: {error}</p>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 