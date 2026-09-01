import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { ResizableSidebarProvider } from "@/components/resizable-sidebar-provider"

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResizableSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </ResizableSidebarProvider>
  );
}
