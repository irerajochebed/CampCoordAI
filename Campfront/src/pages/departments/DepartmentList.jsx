import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge, Modal } from '../../components/ui/index';
import { Plus, Users, CalendarDays, Eye, Edit2 } from 'lucide-react';

const DEPARTMENTS = [
  { id: 1, name: 'Youth Ministries',       leader: 'Jean Pierre N.', events: 4, members: 320, status: 'ACTIVE', icon: '🏕️', color: '#4f46e5', description: 'Empowering young Adventists through camps and leadership programs.' },
  { id: 2, name: 'MIFEM',                  leader: 'Grace Mukamana',  events: 2, members: 180, status: 'ACTIVE', icon: '👩', color: '#ec4899', description: 'Ministry for Adventist Women — Conferences and retreats.' },
  { id: 3, name: "Children's Ministries",  leader: 'Alice Nyiraneza', events: 3, members: 210, status: 'ACTIVE', icon: '🧒', color: '#f59e0b', description: 'Nurturing children through Bible clubs and camps.' },
  { id: 4, name: 'Family Ministries',      leader: 'Pastor Eric H.',  events: 2, members: 145, status: 'ACTIVE', icon: '👨‍👩‍👧', color: '#10b981', description: 'Strengthening Adventist families through seminars.' },
  { id: 5, name: 'Health Ministries',      leader: 'Dr. Samuel K.',   events: 1, members: 88,  status: 'ACTIVE', icon: '🏥', color: '#06b6d4', description: 'Promoting wholistic health principles.' },
  { id: 6, name: 'Ministerial Association',leader: 'Elder David K.',   events: 1, members: 62,  status: 'ACTIVE', icon: '✝️', color: '#8b5cf6', description: 'Supporting pastors and church elders.' },
  { id: 7, name: 'Publishing Ministries',  leader: 'Mary Uwimana',    events: 1, members: 45,  status: 'ACTIVE', icon: '📚', color: '#f97316', description: 'Sharing Adventist literature across Rwanda.' },
  { id: 8, name: 'Sabbath School',         leader: 'John Bizimana',   events: 0, members: 200, status: 'ACTIVE', icon: '📖', color: '#84cc16', description: 'Bible study groups and quarterly programs.' },
  { id: 9, name: 'Personal Ministries',    leader: 'Ruth Ingabire',   events: 1, members: 110, status: 'ACTIVE', icon: '🤝', color: '#14b8a6', description: 'Evangelism and outreach programs.' },
  { id: 10,name: 'Education',              leader: 'Prof. Peter N.',   events: 1, members: 75,  status: 'ACTIVE', icon: '🎓', color: '#a855f7', description: 'Supporting Adventist schools and educators.' },
];

export default function DepartmentList() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Departments"
        subtitle="All 10 ministerial departments of Rwanda Union Mission"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Departments' }]}
        actions={<button className="btn btn-primary"><Plus size={16} /> Add Department</button>}
      />

      <div className="events-grid">
        {DEPARTMENTS.map(dept => (
          <div key={dept.id} className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${dept.color}` }} onClick={() => setSelected(dept)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${dept.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {dept.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 2 }}>{dept.name}</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>Leader: {dept.leader}</p>
              </div>
              <StatusBadge status={dept.status} />
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 16, minHeight: 40 }}>{dept.description}</p>
            <div style={{ display: 'flex', gap: 16, padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <CalendarDays size={14} color={dept.color} /><strong>{dept.events}</strong> events
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <Users size={14} color={dept.color} /><strong>{dept.members}</strong> members
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.name}
          footer={<><button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button><button className="btn btn-primary"><Edit2 size={14} /> Edit</button></>}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: `${selected.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{selected.icon}</div>
              <div>
                <h4 style={{ marginBottom: 4 }}>{selected.name}</h4>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{selected.description}</p>
              </div>
            </div>
            {[['Leader', selected.leader], ['Events Organized', selected.events], ['Total Members', selected.members], ['Status', selected.status]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
