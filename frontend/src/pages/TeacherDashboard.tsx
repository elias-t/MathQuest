import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Breadcrumb from '../components/layout/Breadcrumb';
import Tabs from '../components/ui/Tabs';
import StudentsList from '../components/dashboard/StudentsList';
import ProblemsList from '../components/dashboard/ProblemsList';

const TABS = [
  { id: 'students', label: 'Students' },
  { id: 'problems', label: 'Problems' },
];

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <h1>Dashboard</h1>
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'students' ? <StudentsList /> : <ProblemsList />}
      </div>
    </PageContainer>
  );
}
