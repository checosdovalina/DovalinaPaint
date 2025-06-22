import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Home, 
  Users, 
  FileText, 
  Clipboard, 
  Network,
  UserCog,
  File, 
  BarChart, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  PaintbrushVertical,
  Briefcase,
  Calendar,
  DollarSign,
  TrendingUp,
  PackageOpen,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import logoImg from "@/assets/dovalina_logo.jpeg";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const closeMobileSidebar = () => {
    setShowMobileSidebar(false);
  };
  
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
  
  const navigateTo = (path: string) => {
    setLocation(path);
    closeMobileSidebar();
  };
  
  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "Clients & Prospects", path: "/dashboard/clients", icon: <Users className="w-5 h-5" /> },
    { name: "Quotes", path: "/dashboard/quotes", icon: <FileText className="w-5 h-5" /> },
    { name: "Simple Quotes", path: "/dashboard/simple-quotes", icon: <FileText className="w-5 h-5" /> },
    { name: "Service Orders", path: "/dashboard/service-orders", icon: <Clipboard className="w-5 h-5" /> },
    { name: "Project Management", path: "/dashboard/projects", icon: <Network className="w-5 h-5" /> },
    { name: "Calendar", path: "/dashboard/calendar", icon: <Calendar className="w-5 h-5" /> },
    { name: "Staff Management", path: "/dashboard/personnel", icon: <UserCog className="w-5 h-5" /> },
    { name: "Subcontractors", path: "/dashboard/subcontractors", icon: <Briefcase className="w-5 h-5" /> },
    { name: "Suppliers", path: "/dashboard/suppliers", icon: <PackageOpen className="w-5 h-5" /> },
    { name: "Purchase Orders", path: "/dashboard/purchase-orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { name: "Invoices", path: "/dashboard/invoices", icon: <File className="w-5 h-5" /> },
    { name: "Payments", path: "/dashboard/payments", icon: <DollarSign className="w-5 h-5" /> },
    { name: "Financial Reports", path: "/dashboard/financial-reports", icon: <TrendingUp className="w-5 h-5" /> },
    { name: "Reports & Analytics", path: "/dashboard/reports", icon: <BarChart className="w-5 h-5" /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings className="w-5 h-5" /> },
  ];
  
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "US";
  
  return (
    <>
      {/* Mobile navbar toggle - optimized for iPhone 14 Pro Max */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white z-30 border-b flex items-center px-4 safe-top safe-left safe-right">
        <Button variant="ghost" size="icon" onClick={toggleMobileSidebar} className="focus:outline-none">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center">
            <img src={logoImg} alt="Dovalina Painting LLC" className="h-8 mr-2" />
            <h1 className="text-lg font-bold text-gray-900 truncate max-w-[180px]">
              Dovalina Painting
            </h1>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Sidebar - optimized for iPhone 14 Pro Max */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85%] flex-col border-r bg-white transition-transform lg:translate-x-0 lg:flex lg:w-64 safe-left safe-top safe-bottom",
          showMobileSidebar ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex",
          className
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4 bg-white">
          <div className="flex items-center">
            <img src={logoImg} alt="Dovalina Painting LLC" className="h-10 mr-2" />
            <h1 className="text-lg font-bold text-gray-900">
              Dovalina Painting
            </h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-gray-600" 
            onClick={closeMobileSidebar}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage alt={user?.name} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation - optimized for iPhone 14 Pro Max */}
          <nav className="p-2 space-y-1">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant={location === link.path ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm h-12 px-3",
                  location === link.path 
                    ? "bg-primary text-white" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => navigateTo(link.path)}
              >
                {link.icon}
                <span className="ml-3 text-base">{link.name}</span>
              </Button>
            ))}
            
            <hr className="my-3" />
            
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 text-sm h-12 px-3"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3 text-base">Logout</span>
            </Button>
          </nav>
        </div>
      </aside>
    </>
  );
}
