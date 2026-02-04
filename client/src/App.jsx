import React, { useState } from 'react';
import RoleSelection from './components/RoleSelection';
import ChatInterface from './components/ChatInterface';

function App() {
  const [role, setRole] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {!role ? (
        <RoleSelection onSelectRole={setRole} />
      ) : (
        <ChatInterface role={role} setRole={setRole} />
      )}
    </div>
  );
}

export default App;
