'use client';

import * as React from "react"
import { Users, Ship, ShoppingBag, Home, Hospital, Wrench, UtensilsCrossed, BarChart2, Scale, Package, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const modules = [
  { title: "Recruitment Pipeline", icon: Users, href: "/recruitment", active: true },
  { title: "Freight & Logistics", icon: Ship, href: "#", active: false },
  { title: "Ecommerce Operations", icon: ShoppingBag, href: "#", active: false },
  { title: "Property Management", icon: Home, href: "#", active: false },
  { title: "Clinic Operations", icon: Hospital, href: "#", active: false },
  { title: "Field Services", icon: Wrench, href: "#", active: false },
  { title: "Restaurant Supply Chain", icon: UtensilsCrossed, href: "#", active: false },
  { title: "Campaign Operations", icon: BarChart2, href: "/campaigns", active: true },
  { title: "Legal Matter Tracking", icon: Scale, href: "#", active: false },
  { title: "Purchase Order Monitor", icon: Package, href: "#", active: false },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader style={{ padding: '28px 24px 20px' }}>
        <p className="group-data-[collapsible=icon]:hidden" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 6 }}>OpsCore</p>
        <p className="group-data-[collapsible=icon]:hidden" style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}>Operations Command Center</p>
      </SidebarHeader>

      <SidebarContent style={{ padding: '8px 0' }}>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden" style={{ padding: '0 24px', marginBottom: 4, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', opacity: 0.5 }}>
            Modules
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((mod) => (
                <SidebarMenuItem key={mod.title} style={{ margin: '1px 12px' }}>
                  <SidebarMenuButton
                    isActive={mod.active}
                    tooltip={mod.title}
                    render={<a href={mod.active ? mod.href : undefined} />}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: mod.active ? 'pointer' : 'not-allowed',
                      opacity: mod.active ? 1 : 0.4,
                      fontWeight: mod.active ? 500 : 400,
                      fontSize: 13,
                      width: '100%',
                    }}
                  >
                    <mod.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                    <span className="group-data-[collapsible=icon]:hidden" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
                    {!mod.active && (
                      <span className="group-data-[collapsible=icon]:hidden" style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        background: 'var(--muted)',
                        padding: '2px 7px',
                        borderRadius: 4,
                        flexShrink: 0,
                      }}>
                        Soon
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter style={{ padding: '16px 12px 24px' }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/api/auth/logout" />}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--muted-foreground)',
                width: '100%',
              }}
            >
              <LogOut style={{ width: 15, height: 15 }} />
              <span className="group-data-[collapsible=icon]:hidden">Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
