import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge, Modal } from '../../components/ui/index';
import { Plus, Users, CalendarDays, Eye, Edit2 } from 'lucide-react';

const DEPARTMENTS = [
  { id: 1, name: 'Youth Ministries',       leader: 'Jean Pierre N.', events: 4, members: 320, status: 'ACTIVE', icon: '🏕️', color: '#4f46e5', description: 'Youth Ministries, Pathfinder, and Adventurer clubs.' },
  { id: 2, name: "Women's Ministries (MIFEM)", leader: 'Grace Mukamana',  events: 2, members: 180, status: 'ACTIVE', icon: '👩', color: '#ec4899', description: 'Ministères Féminins — Empowering Adventist women in leadership.' },
  { id: 3, name: "Children's Ministries",  leader: 'Alice Nyiraneza', events: 3, members: 210, status: 'ACTIVE', icon: '🧒', color: '#f59e0b', description: 'Nurturing children through Bible clubs and camps.' },
  { id: 4, name: 'Family Ministries',      leader: 'Pastor Eric H.',  events: 2, members: 145, status: 'ACTIVE', icon: '👨‍👩‍👧', color: '#10b981', description: 'Strengthening Adventist families through seminars.' },
  { id: 5, name: 'Ministerial Association',leader: 'Elder David K.',   events: 1, members: 62,  status: 'ACTIVE', icon: '✝️', color: '#8b5cf6', description: 'Supporting pastors and church elders across fields.' },
  { id: 6, name: 'Personal Ministries & Sabbath School', leader: 'Ruth Ingabire', events: 3, members: 240, status: 'ACTIVE', icon: '🤝', color: '#14b8a6', description: 'Evangelism, outreach, Bible study, and discipleship programs.' },
  { id: 7, name: 'Adventist Chaplaincy Ministries (ACM)', leader: 'Pastor Joseph M.', events: 1, members: 75, status: 'ACTIVE', icon: '⛪', color: '#6366f1', description: 'Chaplaincy services in schools, hospitals, and institutions.' },
  { id: 8, name: 'Adventist Possibility Ministries (APM)', leader: 'Claire U.', events: 1, members: 50, status: 'ACTIVE', icon: '♿', color: '#0ea5e9', description: 'Inclusion and support for individuals with special needs.' },
  { id: 9, name: 'Health Ministries',      leader: 'Dr. Samuel K.',   events: 1, members: 88,  status: 'ACTIVE', icon: '🏥', color: '#06b6d4', description: 'Promoting physical, mental, and spiritual health principles.' },
  { id: 10, name: 'Publishing Ministries',  leader: 'Mary Uwimana',    events: 1, members: 45,  status: 'ACTIVE', icon: '📚', color: '#f97316', description: 'Literature evangelism and Christian book ministry.' },
  { id: 11, name: 'Stewardship Ministries', leader: 'Elder Isaac R.',  events: 2, members: 130, status: 'ACTIVE', icon: '💎', color: '#eab308', description: 'Biblical stewardship, tithing, and resource management.' },
  { id: 12, name: 'Public Affairs & Religious Liberty (PARL)', leader: 'Adv. Emmanuel B.', events: 1, members: 40, status: 'ACTIVE', icon: '⚖️', color: '#64748b', description: 'Promoting religious freedom, freedom of conscience, and PR.' },
  { id: 13, name: 'Education Department',  leader: 'Prof. Peter N.',   events: 1, members: 75,  status: 'ACTIVE', icon: '🎓', color: '#a855f7', description: 'Overseeing Adventist schools, universities, and educators.' },
  { id: 14, name: 'Communication Department', leader: 'Jean Paul M.',  events: 2, members: 95,  status: 'ACTIVE', icon: '📡', color: '#3b82f6', description: 'Media relations, digital evangelism, and broadcasting.' },
];

export default function DepartmentList() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ministries & Departments"
        subtitle="All 14 official organizational functional ministries of Rwanda Union Mission"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ministries' }]}
        actions={<button className="btn btn-primary"><Plus size={16} /> Add Ministry</button>}
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
