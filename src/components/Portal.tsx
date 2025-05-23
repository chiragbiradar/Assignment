'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Create a portal container if it doesn't exist
  useEffect(() => {
    if (typeof document !== 'undefined') {
      let portalRoot = document.getElementById('portal-root');
      if (!portalRoot) {
        portalRoot = document.createElement('div');
        portalRoot.id = 'portal-root';
        portalRoot.style.position = 'fixed';
        portalRoot.style.zIndex = '9999';
        portalRoot.style.top = '0';
        portalRoot.style.left = '0';
        portalRoot.style.width = '100%';
        portalRoot.style.height = '100%';
        portalRoot.style.pointerEvents = 'none';
        document.body.appendChild(portalRoot);
      }
    }
  }, []);

  // Only render on client-side
  if (!mounted || typeof document === 'undefined') return null;

  // Get the portal container
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  // Create a portal
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      {children}
    </div>,
    portalRoot
  );
}
