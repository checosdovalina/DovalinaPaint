import { cn } from "@/lib/utils";
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

interface TopBarProps {
  title: string;
  className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
  const { user } = useAuth();
  
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "US";
  
  return (
    <div
      className={cn(
        "bg-white shadow-sm z-10 h-16 fixed top-0 right-0 left-0 lg:left-64 safe-top safe-right",
        className
      )}
    >
      <div className="px-3 sm:px-4 h-full flex items-center justify-between">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-xs md:max-w-md mt-1 pt-[16px] lg:pt-0">
          {title}
        </h2>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500 h-10 w-10 ml-1">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500 h-10 w-10 ml-1">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>
          <div className="ml-2 sm:ml-3 relative">
            <Avatar className="h-9 w-9 border-2 border-gray-100">
              <AvatarImage alt={user?.name} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
}
