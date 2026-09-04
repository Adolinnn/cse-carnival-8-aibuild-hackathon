import React from 'react';
import { AssignmentsView } from '../components/assignments/AssignmentsView';

export function AssignmentsPage({ assignments, session, simulatedDate, onNavigate }) {
  return (
    <div className="w-full page-enter" id="page-assignments">
      <AssignmentsView
        assignments={assignments}
        session={session}
        simulatedDate={simulatedDate}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default AssignmentsPage;
