import { AppShell } from './components/layout/AppShell';
import { Toolbar } from './components/layout/Toolbar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { RaidCanvas } from './components/canvas/RaidCanvas';
import { PlayerEditDialog } from './components/dialogs/PlayerEditDialog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';

export function App() {
  useKeyboardShortcuts();
  useAutoSave();

  return (
    <>
      <AppShell
        toolbar={<Toolbar />}
        sidebar={<Sidebar />}
        canvas={<RaidCanvas />}
        statusBar={<StatusBar />}
      />
      <PlayerEditDialog />
    </>
  );
}
