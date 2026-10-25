import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Eye, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  ShieldCheck, 
  RefreshCw,
  Award,
  Sparkles,
  BookOpen,
  Church,
  Compass,
  Heart,
  Music,
  Radio,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { departmentApi } from '../../api';

// Refined Icon mapping for the 17 official SDA Ministries
const DEPT_ICON_MAP = {
  YOUTH: Compass,
  WOMEN_MIFEM: Heart,
  CHILDREN: Sparkles,
  FAMILY: Users,
  MINISTERIAL: Church,
  SABBATH_SCHOOL_PM: BookOpen,
  CHAPLAINCY: Church,
  POSSIBILITY: Heart,
  HEALTH: Heart,
  PUBLISHING: BookOpen,
  STEWARDSHIP: Award,
  PARL: ShieldCheck,
  EDUCATION: GraduationCap,
  COMMUNICATION: Radio,
  EVANGELISM: Compass,
  REVIVAL_REFORMATION: Sparkles,
  MUSIC: Music,
};

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await departmentApi.getAll();
      const data = res.data?.data || res.data || [];
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
      setError('Failed to load ministries from server.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = departments.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.leaderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeptIcon = (type, name) => {
    if (type && DEPT_ICON_MAP[type]) return DEPT_ICON_MAP[type];
    const n = (name || '').toLowerCase();
    if (n.includes('youth') || n.includes('adventurer') || n.includes('pathfinder')) return Compass;
    if (n.includes('women') || n.includes('mifem') || n.includes('family') || n.includes('health')) return Heart;
    if (n.includes('child') || n.includes('revival')) return Sparkles;
    if (n.includes('ministerial') || n.includes('pastor') || n.includes('chaplain')) return Church;
    if (n.includes('sabbath') || n.includes('publish') || n.includes('book')) return BookOpen;
    if (n.includes('education') || n.includes('school')) return GraduationCap;
    if (n.includes('comm') || n.includes('media')) return Radio;
    if (n.includes('music') || n.includes('choir')) return Music;
    return BookOpen;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Ministries & Departments Directory</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Official organizational and functional ministries of Rwanda Union Mission (RUM) across 8 Field Conferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchDepartments}
            disabled={loading}
          >
            Refresh
          </Button>
          <Link to="/app/organization">
            <Button variant="primary" icon={<Building className="w-4 h-4" />}>
              View Org Hierarchy
            </Button>
          </Link>
        </div>
      </div>

      {/* Ministries Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4 border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/40">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
            {departments.length || 16}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Total Active Ministries</div>
            <div className="text-sm text-slate-800 dark:text-slate-200 font-semibold mt-0.5">Official Rwanda Union Mission Ministries</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/40">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Appointed Directors</div>
            <div className="text-sm text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
              {departments.filter(d => d.leaderName).length} Active RUM Directors
            </div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/40">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Administrative Scope</div>
            <div className="text-sm text-slate-800 dark:text-slate-200 font-semibold mt-0.5">Rwanda Union Mission & 8 Field Conferences</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardBody className="py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search ministry by name, code, director, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
            />
          </div>
        </CardBody>
      </Card>

      {/* Grid of Ministries */}
      {loading ? (
        <div className="card p-12 text-center text-slate-500 dark:text-slate-400">
          <div className="w-7 h-7 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium">Loading Rwanda Union Mission (RUM) Ministries...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-rose-600 dark:text-rose-400">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchDepartments}>Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title={`No ministries matched "${searchTerm}"`}
          description="Try adjusting your search criteria"
        />
      ) : (
        <div className="events-grid">
          {filtered.map(dept => {
            const IconComponent = getDeptIcon(dept.departmentType, dept.name);
            return (
              <div 
                key={dept.id} 
                className="card p-5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                onClick={() => setSelected(dept)}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/70 border border-primary-100 dark:border-primary-800/60 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base truncate leading-snug">
                          {dept.name}
                        </h4>
                        {dept.code && (
                          <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mt-1 border border-slate-200 dark:border-slate-700">
                            {dept.code}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={dept.active !== false ? 'success' : 'danger'} size="sm">
                      {dept.active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {dept.description || 'Official ministry department serving Rwanda Union Mission & North Rwanda Field.'}
                  </p>
                </div>

                <div>
                  {/* Director / Leader Card Info */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 mb-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Department Director:</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {dept.leaderName || 'Appointed Director'}
                      </span>
                    </div>
                    {dept.leaderPhone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{dept.leaderPhone}</span>
                      </div>
                    )}
                    {dept.leaderEmail && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{dept.leaderEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Official Ministry</span>
                    </div>
                    <span className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 font-medium transition-colors">
                      Details <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal 
          isOpen={!!selected} 
          onClose={() => setSelected(null)} 
          title={selected.name}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              <Link to="/app/users" onClick={() => setSelected(null)}>
                <Button variant="primary" icon={<Users className="w-4 h-4" />}>
                  View in Leadership Directory
                </Button>
              </Link>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/70 border border-primary-100 dark:border-primary-800/60 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold shrink-0">
                {(() => {
                  const Icon = getDeptIcon(selected.departmentType, selected.name);
                  return <Icon className="w-7 h-7" />;
                })()}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{selected.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Code: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selected.code}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Director & Leadership Contact</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Director Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selected.leaderName || 'Appointed Director'}</span>
                </div>
                {selected.leaderPosition && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Position:</span>
                    <span className="font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/80 px-2 py-0.5 rounded-md text-xs border border-primary-200 dark:border-primary-800/60">
                      {selected.leaderPosition.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {selected.leaderEmail && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Email:</span>
                    <a href={`mailto:${selected.leaderEmail}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                      {selected.leaderEmail}
                    </a>
                  </div>
                )}
                {selected.leaderPhone && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                    <a href={`tel:${selected.leaderPhone}`} className="text-slate-800 dark:text-slate-200 font-medium">
                      {selected.leaderPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Description</span>
                <span className="text-xs text-slate-800 dark:text-slate-200 text-right max-w-[70%] leading-relaxed">
                  {selected.description}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Department Type</span>
                <span className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                  {selected.departmentType}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</span>
                <Badge variant={selected.active !== false ? 'success' : 'danger'} size="sm">
                  {selected.active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
