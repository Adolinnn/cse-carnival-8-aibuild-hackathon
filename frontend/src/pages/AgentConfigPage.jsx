import React from 'react';
import { AgentConfigView } from '../components/agent/AgentConfigView';

export function AgentConfigPage({ session }) {
  return (
    <div className="w-full page-enter" id="page-agent-config">
      <AgentConfigView session={session} />
    </div>
  );
}

export default AgentConfigPage;
