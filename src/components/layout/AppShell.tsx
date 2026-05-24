import { type ReactNode } from 'react';

interface AppShellProps {
  toolbar: ReactNode;
  sidebar: ReactNode;
  canvas: ReactNode;
  statusBar: ReactNode;
}

export function AppShell({ toolbar, sidebar, canvas, statusBar }: AppShellProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: '48px 1fr 28px',
        gridTemplateColumns: '1fr auto',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ gridRow: 1, gridColumn: '1 / -1', zIndex: 100 }}>
        {toolbar}
      </div>
      <div style={{ gridRow: 2, gridColumn: 1, overflow: 'hidden', position: 'relative' }}>
        {canvas}
      </div>
      <div
        style={{
          gridRow: 2,
          gridColumn: 2,
          width: 280,
          overflow: 'hidden',
          borderLeft: '1px solid var(--color-wow-border)',
          background: 'var(--color-wow-panel)',
        }}
      >
        {sidebar}
      </div>
      <div style={{ gridRow: 3, gridColumn: '1 / -1', zIndex: 100 }}>
        {statusBar}
      </div>
    </div>
  );
}
