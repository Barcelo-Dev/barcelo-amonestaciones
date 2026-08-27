'use client';

import { AppProvider, useApp } from '@/lib/context';
import Login from '@/components/Login';
import Shell from '@/components/Shell';

function Root() {
  const { loaded, session } = useApp();
  if (!loaded) {
    return (
      <div className="login-wrap">
        <div style={{ color: '#e8e2d0', fontSize: 14 }}>Cargando…</div>
      </div>
    );
  }
  if (!session) return <Login />;
  return <Shell />;
}

export default function Page() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
