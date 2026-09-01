'use client';

import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

const MIN_WIDTH = 180;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 256;
const STORAGE_KEY = "opscore-sidebar-width";

export function ResizableSidebarProvider({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = React.useState(DEFAULT_WIDTH);
  const isDragging = React.useRef(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setWidth(Number(stored));
  }, []);

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
      localStorage.setItem(STORAGE_KEY, String(newWidth));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <SidebarProvider style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}>
      {children}
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "fixed",
          top: 0,
          left: width - 3,
          width: 6,
          height: "100vh",
          cursor: "col-resize",
          zIndex: 50,
        }}
      />
    </SidebarProvider>
  );
}
