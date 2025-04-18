import { useSidebar } from "@/components/ui/sidebar"; // <-- get collapse state
import {
  LayoutDashboard,
  Target,
  NotebookTabs,
  PencilRuler,
  PaintBucket,
  Package,
  ChartColumnStacked,
} from "lucide-react";
import NavUser from "./Navuser";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Kicksneak",
    email: "info@kicksneak.in",
    avatar: "/avatars/shadcn.jpg",
  },
};
const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Brands", url: "/brands", icon: Target },
  { title: "Products", url: "/products", icon: NotebookTabs },
  { title: "Sizes", url: "/sizes", icon: PencilRuler },
  { title: "Colors", url: "/colors", icon: PaintBucket },
  { title: "Users", url: "/users", icon: NotebookTabs },
  { title: "Orders", url: "/orders", icon: Package },
  { title: "Categories", url: "/categories", icon: ChartColumnStacked },
];

export function AppSidebar() {
  const { collapsed } = useSidebar(); // 👈 use collapse state

  return (
    <Sidebar collapsible="icon" className="h-screen">
      <SidebarContent>
        <SidebarGroup className="flex items-center justify-center h-16 bg-gray-800 text-white">
          <h1 className="text-xl font-bold">CMS</h1>
        </SidebarGroup>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Application</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded"
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
