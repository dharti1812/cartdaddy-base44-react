
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Navigation,
  BarChart3,
  Settings,
  Menu,
  Shield,
  UserCheck,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const adminNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Super Admin",
    url: createPageUrl("SuperAdminDashboard"),
    icon: Shield,
  },
  {
    title: "Verifications",
    url: createPageUrl("Verifications"),
    icon: UserCheck,
  },
  {
    title: "Customer CRM",
    url: createPageUrl("CustomerCRM"),
    icon: Users,
  },
  {
    title: "Live Tracking",
    url: createPageUrl("LiveTracking"),
    icon: Navigation,
  },
  {
    title: "Orders",
    url: createPageUrl("Orders"),
    icon: Package,
  },
  {
    title: "Sellers",
    url: createPageUrl("Retailers"),
    icon: Users,
  },
  {
    title: "Dispatch",
    url: createPageUrl("Dispatch"),
    icon: Navigation,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  // Check if current page is seller portal or delivery boy portal - if so, don't show admin layout
  const isRetailerPage = currentPageName === "RetailerPortal" ||
                         currentPageName === "RetailerOnboarding" ||
                         currentPageName === "DeliveryPartnerPortal" ||
                         currentPageName === "DeliveryPartnerOnboarding" ||
                         currentPageName === "DeliveryPartnerLogin" ||
                         currentPageName === "DeliveryBoyPortal" ||
                         currentPageName === "RetailerLogin" ||
                         currentPageName === "DeliveryBoyLogin" ||
                         currentPageName === "AdminLogin" ||
                         currentPageName === "SuperAdminLogin" ||
                         currentPageName === "PortalSelector" ||
                         location.pathname.includes("Retailer") ||
                         location.pathname.includes("DeliveryPartner") ||
                         location.pathname.includes("DeliveryBoy");

  // Seller pages have their own layout built-in
  if (isRetailerPage) {
    return <>{children}</>;
  }

  // Admin Dashboard Layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-[#075E66] to-[#064d54] font-sans">
        <Sidebar className="border-r border-white border-opacity-20 bg-white">
          <SidebarHeader className="border-b border-white border-opacity-20 p-4 bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
            <div className="flex flex-col items-center justify-center w-full">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
                alt="Cart Daddy Logo"
                className="h-12 w-auto mx-auto"
              />
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3 bg-white">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold text-[#FFEB3B] uppercase tracking-wider px-3 py-2 mb-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`transition-all duration-200 rounded-lg mb-1 text-base ${
                            isActive
                              ? 'bg-[#FFEB3B] text-gray-900 hover:bg-[#FFEB3B] hover:opacity-90 font-semibold'
                              : 'hover:bg-gray-100 text-gray-900 font-medium'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Quick Access Links */}
            <div className="mt-6 p-4 mx-3 space-y-3">
              <div className="bg-[#FFEB3B] bg-opacity-10 border-2 border-[#FFEB3B] rounded-lg p-3">
                <p className="text-xs font-bold text-[#FFEB3B] mb-2 uppercase tracking-wide">Seller Portal</p>
                <a
                  href={createPageUrl("RetailerLogin")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#075E66] hover:text-[#FFEB3B] hover:underline flex items-center gap-1 font-semibold transition-colors"
                >
                  Open Seller Portal →
                </a>
              </div>

              <div className="bg-[#FFEB3B] bg-opacity-10 border-2 border-[#FFEB3B] rounded-lg p-3">
                <p className="text-xs font-bold text-[#FFEB3B] mb-2 uppercase tracking-wide">Delivery Boy Portal</p>
                <a
                  href={createPageUrl("DeliveryBoyLogin")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#075E66] hover:text-[#FFEB3B] hover:underline flex items-center gap-1 font-semibold transition-colors"
                >
                  Open Delivery Portal →
                </a>
              </div>

              <div className="bg-[#FFEB3B] bg-opacity-10 border-2 border-[#FFEB3B] rounded-lg p-3">
                <p className="text-xs font-bold text-[#FFEB3B] mb-2 uppercase tracking-wide">Admin Login</p>
                <a
                  href={createPageUrl("AdminLogin")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#075E66] hover:text-[#FFEB3B] hover:underline flex items-center gap-1 font-semibold transition-colors"
                >
                  Admin Login →
                </a>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full border-2 border-[#075E66] text-[#075E66] hover:bg-[#075E66] hover:text-white text-base"
              onClick={() => window.location.href = createPageUrl("PortalSelector")}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Portal Selector
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-gradient-to-br from-[#075E66] to-[#064d54] border-b border-white border-opacity-20 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-white hover:bg-opacity-10 p-2 rounded-lg transition-colors text-white">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
                alt="Cart Daddy Logo"
                className="h-8 w-auto"
              />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
