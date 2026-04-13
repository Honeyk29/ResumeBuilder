import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { 
  ChevronLeft, Save, Download, Loader2, Plus, 
  Trash2, User, Briefcase, GraduationCap, Settings2, Sparkles, LayoutIcon, ExternalLink,
  Link, BookOpen, Award, FileText, Dumbbell
} from 'lucide-react';
import api from '../utils/api';
import TemplateRenderer from '../components/TemplateRenderer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if a given section block [[ #sectionName ]] is present in template sources */
const templateHasSection = (tpl: any, section: string): boolean => {
  if (!tpl) return false;
  const src = (tpl.latexTemplate || '') + (tpl.htmlTemplate || '');
  return src.includes(`[[ #${section} ]]`) || src.includes(`[[#${section}]]`);
};

/** All "standard" known field names that should NOT appear as "custom" inputs */
const STANDARD_FIELDS = new Set([
  'firstName','lastName','fullName','name','email','phone','address','website',
  'objective','summary','experience','education','projects','certifications',
  'skills','links','coursework','training','publications','company','role',
  'duration','location','points','institution','degree','details','title',
  'description','tech','link','issuer','date','startDate','endDate',
  'position','category','items','label','url','text','organization',
]);

// ─── Main Component ────────────────────────────────────────────────────────────

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [templates, setTemplates]   = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [downloadingLatex, setDownloadingLatex] = useState(false);
  const [activeTab, setActiveTab]   = useState('info');

  const [resumeData, setResumeData] = useState<any>({
    title: 'New Resume',
    personalInfo: { fullName: '', email: '', phone: '', address: '', summary: '', github: '', linkedin: '', portfolio: '' },
    experience:      [{ company: '', role: '', position: '', duration: '', startDate: '', endDate: '', location: '', description: '', points: [] }],
    education:       [{ institution: '', degree: '', details: '', startDate: '', endDate: '' }],
    projects:        [{ title: '', name: '', tech: '', link: '', duration: '', organization: '', description: '' }],
    certifications:  [{ title: '', issuer: '', date: '' }],
    skills:          [],
    links:           [{ label: '', url: '', text: '' }],
    coursework:      [{ title: '', items: [] }],
    training:        [{ title: '', location: '', description: '' }],
    publications:    [{ title: '', description: '' }],
    customData:      {}
  });

  const selectedTemplateObj =
    typeof selectedTemplate === 'string'
      ? templates.find((tpl: any) => tpl._id === selectedTemplate) || null
      : selectedTemplate;

  const selectedTemplateId =
    selectedTemplateObj?._id || (typeof selectedTemplate === 'string' ? selectedTemplate : undefined);

  // ── Data Fetching ────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const { data: tpls } = await api.get('/templates/active');
      setTemplates(tpls);
      if (id) {
        const { data: res } = await api.get(`/resumes/${id}`);
        setResumeData(res);
        setSelectedTemplate(res.templateId?._id || res.templateId || tpls[0]?._id || null);
      } else if (tpls.length > 0) {
        setSelectedTemplate(tpls[0]._id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const getSelectedTemplateId = () => {
    if (!selectedTemplate) return resumeData.templateId?._id || resumeData.templateId || '';
    if (typeof selectedTemplate === 'string') return selectedTemplate;
    return selectedTemplate._id || '';
  };

  const persistResume = async () => {
    const templateId = getSelectedTemplateId();
    if (!templateId) {
      throw new Error('Please select a template before saving.');
    }

    const payload = { ...resumeData, templateId };
    if (id) {
      const { data } = await api.put(`/resumes/${id}`, payload);
      return data._id || id;
    }

    const { data } = await api.post('/resumes', payload);
    navigate(`/builder/${data._id}`);
    return data._id;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!selectedTemplateId) {
        alert('Please select a template before saving.');
        return;
      }
      const payload = { ...resumeData, templateId: selectedTemplateId };
      if (id) {
        await api.put(`/resumes/${id}`, payload);
      } else {
        const { data } = await api.post('/resumes', payload);
        navigate(`/builder/${data._id}`);
      }
      alert('Resume saved successfully!');
    } catch (err: any) { alert(err.message || 'Failed to save resume'); }
    finally { setSaving(false); }
  };

  // ── Print / PDF ──────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const handleLatexDownload = async () => {
    setDownloadingLatex(true);
    try {
      const resumeId = id || await persistResume();
      const response = await api.get(`/resumes/${resumeId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeData.title || 'resume'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert('Error generating PDF.'); }
    finally { setDownloadingLatex(false); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updatePersonalInfo = (field: string, value: string) =>
    setResumeData((p: any) => ({ ...p, personalInfo: { ...p.personalInfo, [field]: value } }));

  const addItem = (type: string, blank: any) =>
    setResumeData((p: any) => ({ ...p, [type]: [...(p[type] || []), blank] }));

  const updateItem = (type: string, idx: number, field: string, value: any) =>
    setResumeData((p: any) => {
      const list = [...(p[type] || [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...p, [type]: list };
    });

  const removeItem = (type: string, idx: number) =>
    setResumeData((p: any) => ({ ...p, [type]: (p[type] || []).filter((_: any, i: number) => i !== idx) }));

  const updateCustomField = (key: string, val: string) =>
    setResumeData((p: any) => ({ ...p, customData: { ...(p.customData || {}), [key]: val } }));

  const getCustomField = (key: string) => resumeData.customData?.[key] || '';

  // ── Dynamic tab list ─────────────────────────────────────────────────────────
  const tabs = [
    { id: 'info',  label: 'Info',         icon: <User size={16}/>,         always: true },
    { id: 'exp',   label: 'Experience',   icon: <Briefcase size={16}/>,    section: 'experience' },
    { id: 'edu',   label: 'Education',    icon: <GraduationCap size={16}/>,section: 'education' },
    { id: 'proj',  label: 'Projects',     icon: <Settings2 size={16}/>,    section: 'projects' },
    { id: 'cert',  label: 'Certifications',icon: <Award size={16}/>,       section: 'certifications' },
    { id: 'links', label: 'Links',        icon: <Link size={16}/>,         section: 'links' },
    { id: 'cwork', label: 'Coursework',   icon: <BookOpen size={16}/>,     section: 'coursework' },
    { id: 'train', label: 'Training',     icon: <Dumbbell size={16}/>,     section: 'training' },
    { id: 'pub',   label: 'Publications', icon: <FileText size={16}/>,     section: 'publications' },
    { id: 'tpl',   label: 'Style',        icon: <LayoutIcon size={16}/>,   always: true },
  ];

  const visibleTabs = tabs.filter(t =>
    t.always || templateHasSection(selectedTemplateObj, t.section!)
  );

  // Keep activeTab in sync when template changes
  useEffect(() => {
    const ids = visibleTabs.map(t => t.id);
    if (!ids.includes(activeTab)) setActiveTab('info');
  }, [selectedTemplate]);

  // Custom fields (non-standard)
  const customFields = (selectedTemplateObj?.detectedFields || []).filter(
    (f: string) => !STANDARD_FIELDS.has(f.toLowerCase())
  );

  // ── Render context for preview (flatten everything) ──────────────────────────
  const renderData = {
    ...resumeData,
    ...resumeData.personalInfo,
    fullName: resumeData.personalInfo?.fullName || '',
    firstName: resumeData.personalInfo?.fullName?.split(' ')[0] || '',
    lastName:  resumeData.personalInfo?.fullName?.split(' ').slice(1).join(' ') || '',
    website:   resumeData.personalInfo?.portfolio || '',
    objective: resumeData.personalInfo?.summary || '',
    ...(resumeData.customData || {}),
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="font-bold text-slate-400">Loading Resume Engine...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* ── Header ── */}
      <header className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm z-50">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors shrink-0">
            <ChevronLeft />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-1 sm:mx-2 shrink-0" />
          <input
            value={resumeData.title}
            onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
            className="text-base sm:text-xl font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-2 ring-blue-100 px-2 rounded-lg min-w-0 w-full"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 disabled:opacity-50 transition-all border border-blue-100 text-sm">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm">
            <Download size={18} /> HTML
          </button>
          <button onClick={handleLatexDownload} disabled={downloadingLatex}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70 text-sm">
            {downloadingLatex ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {downloadingLatex ? 'Compiling…' : 'LaTeX PDF'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-[500px] bg-white border-r flex flex-col lg:h-full z-40 max-h-[56vh] lg:max-h-none">

          {/* Tab bar — scrollable, only shows relevant tabs */}
          <div className="flex p-2 bg-slate-50 m-4 rounded-2xl gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {visibleTabs.map(t => (
              <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} icon={t.icon} label={t.label} />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-10 sm:pb-20 space-y-8 scroll-smooth">

            {/* ── INFO ── */}
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <SectionHeader icon={<User className="text-blue-600" />} title="Personal Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Full Name"  value={resumeData.personalInfo.fullName}  onChange={v => updatePersonalInfo('fullName', v)} />
                  <FormField label="Email"       value={resumeData.personalInfo.email}     onChange={v => updatePersonalInfo('email', v)} />
                  <FormField label="Phone"       value={resumeData.personalInfo.phone}     onChange={v => updatePersonalInfo('phone', v)} />
                  <FormField label="Address"     value={resumeData.personalInfo.address}   onChange={v => updatePersonalInfo('address', v)} />
                  <FormField label="Portfolio / Website" value={resumeData.personalInfo.portfolio} onChange={v => updatePersonalInfo('portfolio', v)} placeholder="https://..." className="col-span-2" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-tighter ml-1">Objective / Summary</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-[100px] outline-none focus:ring-2 ring-blue-100 font-medium"
                    value={resumeData.personalInfo.summary}
                    onChange={e => updatePersonalInfo('summary', e.target.value)}
                    placeholder="Career highlights, objective…"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <SectionHeader title="Social & Web" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="GitHub"   value={resumeData.personalInfo.github}   onChange={v => updatePersonalInfo('github', v)} />
                    <FormField label="LinkedIn" value={resumeData.personalInfo.linkedin} onChange={v => updatePersonalInfo('linkedin', v)} />
                  </div>
                </div>

                {/* Custom / template-specific fields */}
                {customFields.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <SectionHeader icon={<Sparkles size={16} className="text-blue-600" />} title={`${selectedTemplateObj?.name || 'Template'} — Extra Fields`} />
                    <p className="text-[10px] text-slate-400 -mt-2">These fields are unique to this template.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customFields.map((f: string) => (
                        <FormField key={f} label={f} value={getCustomField(f)} onChange={v => updateCustomField(f, v)} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── EXPERIENCE ── */}
            {activeTab === 'exp' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<Briefcase className="text-blue-600" />} title="Experience" />
                {resumeData.experience.map((exp: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('experience', idx)}>
                    <FormField label="Company"   value={exp.company}   onChange={v => updateItem('experience', idx, 'company', v)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Role / Position" value={exp.role || exp.position} onChange={v => { updateItem('experience', idx, 'role', v); updateItem('experience', idx, 'position', v); }} />
                      <FormField label="Location"  value={exp.location}  onChange={v => updateItem('experience', idx, 'location', v)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Start Date" value={exp.startDate} placeholder="Jan 2022" onChange={v => { updateItem('experience', idx, 'startDate', v); updateItem('experience', idx, 'duration', `${v} – ${exp.endDate || 'Present'}`); }} />
                      <FormField label="End Date"   value={exp.endDate}   placeholder="Present"  onChange={v => { updateItem('experience', idx, 'endDate', v); updateItem('experience', idx, 'duration', `${exp.startDate || ''} – ${v}`); }} />
                    </div>
                    <TextArea label="Description / Points" value={exp.description} onChange={v => updateItem('experience', idx, 'description', v)} />
                  </ItemCard>
                ))}
                <AddButton label="Add Position" onClick={() => addItem('experience', { company: '', role: '', position: '', duration: '', startDate: '', endDate: '', location: '', description: '', points: [] })} />
              </motion.div>
            )}

            {/* ── EDUCATION ── */}
            {activeTab === 'edu' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<GraduationCap className="text-blue-600" />} title="Education" />
                {resumeData.education.map((edu: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('education', idx)}>
                    <FormField label="Institution" value={edu.institution} onChange={v => updateItem('education', idx, 'institution', v)} />
                    <FormField label="Degree"      value={edu.degree}      onChange={v => updateItem('education', idx, 'degree', v)} />
                    <FormField label="Details / GPA / Location" value={edu.details} onChange={v => updateItem('education', idx, 'details', v)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Start Date" value={edu.startDate} onChange={v => updateItem('education', idx, 'startDate', v)} />
                      <FormField label="End Date"   value={edu.endDate}   onChange={v => updateItem('education', idx, 'endDate', v)} />
                    </div>
                  </ItemCard>
                ))}
                <AddButton label="Add Education" onClick={() => addItem('education', { institution: '', degree: '', details: '', startDate: '', endDate: '' })} />
              </motion.div>
            )}

            {/* ── PROJECTS ── */}
            {activeTab === 'proj' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<Settings2 className="text-blue-600" />} title="Projects" />
                {resumeData.projects.map((proj: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('projects', idx)}>
                    <FormField label="Title / Name"   value={proj.title || proj.name} onChange={v => { updateItem('projects', idx, 'title', v); updateItem('projects', idx, 'name', v); }} />
                    <FormField label="Technologies"   value={proj.tech}               onChange={v => updateItem('projects', idx, 'tech', v)} placeholder="React, Node.js…" />
                    <FormField label="Duration"       value={proj.duration}           onChange={v => updateItem('projects', idx, 'duration', v)} />
                    <FormField label="Organization"   value={proj.organization}       onChange={v => updateItem('projects', idx, 'organization', v)} />
                    <FormField label="Link"           value={proj.link}               onChange={v => updateItem('projects', idx, 'link', v)} placeholder="https://…" />
                    <TextArea  label="Description"    value={proj.description}        onChange={v => updateItem('projects', idx, 'description', v)} />
                  </ItemCard>
                ))}
                <AddButton label="Add Project" onClick={() => addItem('projects', { title: '', name: '', tech: '', link: '', duration: '', organization: '', description: '' })} />
              </motion.div>
            )}

            {/* ── CERTIFICATIONS ── */}
            {activeTab === 'cert' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<Award className="text-blue-600" />} title="Certifications" />
                {resumeData.certifications.map((cert: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('certifications', idx)}>
                    <FormField label="Title"            value={cert.title}  onChange={v => updateItem('certifications', idx, 'title', v)} />
                    <FormField label="Issuing Authority" value={cert.issuer} onChange={v => updateItem('certifications', idx, 'issuer', v)} />
                    <FormField label="Date"             value={cert.date}   onChange={v => updateItem('certifications', idx, 'date', v)} placeholder="Jan 2024" />
                  </ItemCard>
                ))}
                <AddButton label="Add Certification" onClick={() => addItem('certifications', { title: '', issuer: '', date: '' })} />
              </motion.div>
            )}

            {/* ── LINKS ── */}
            {activeTab === 'links' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<Link className="text-blue-600" />} title="Links" />
                {resumeData.links.map((lnk: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('links', idx)}>
                    <FormField label="Label (e.g. github)"  value={lnk.label}  onChange={v => updateItem('links', idx, 'label', v)} />
                    <FormField label="URL"                   value={lnk.url}    onChange={v => updateItem('links', idx, 'url', v)} placeholder="https://github.com/…" />
                    <FormField label="Display Text"          value={lnk.text}   onChange={v => updateItem('links', idx, 'text', v)} placeholder="username" />
                  </ItemCard>
                ))}
                <AddButton label="Add Link" onClick={() => addItem('links', { label: '', url: '', text: '' })} />
              </motion.div>
            )}

            {/* ── COURSEWORK ── */}
            {activeTab === 'cwork' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<BookOpen className="text-blue-600" />} title="Coursework" />
                {resumeData.coursework.map((cw: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('coursework', idx)}>
                    <FormField label="Category Title" value={cw.title} onChange={v => updateItem('coursework', idx, 'title', v)} />
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Courses (one per line)</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none min-h-[80px]"
                        value={(cw.items || []).join('\n')}
                        onChange={e => updateItem('coursework', idx, 'items', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Data Structures&#10;Algorithms&#10;Machine Learning"
                      />
                    </div>
                  </ItemCard>
                ))}
                <AddButton label="Add Coursework Group" onClick={() => addItem('coursework', { title: '', items: [] })} />
              </motion.div>
            )}

            {/* ── TRAINING ── */}
            {activeTab === 'train' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<Dumbbell className="text-blue-600" />} title="Training" />
                {resumeData.training.map((tr: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('training', idx)}>
                    <FormField label="Title"    value={tr.title}    onChange={v => updateItem('training', idx, 'title', v)} />
                    <FormField label="Location" value={tr.location} onChange={v => updateItem('training', idx, 'location', v)} />
                    <TextArea  label="Description" value={tr.description} onChange={v => updateItem('training', idx, 'description', v)} />
                  </ItemCard>
                ))}
                <AddButton label="Add Training" onClick={() => addItem('training', { title: '', location: '', description: '' })} />
              </motion.div>
            )}

            {/* ── PUBLICATIONS ── */}
            {activeTab === 'pub' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader icon={<FileText className="text-blue-600" />} title="Publications" />
                {resumeData.publications.map((pub: any, idx: number) => (
                  <ItemCard key={idx} onRemove={() => removeItem('publications', idx)}>
                    <FormField label="Title" value={pub.title} onChange={v => updateItem('publications', idx, 'title', v)} />
                    <TextArea label="Description / Abstract" value={pub.description} onChange={v => updateItem('publications', idx, 'description', v)} />
                  </ItemCard>
                ))}
                <AddButton label="Add Publication" onClick={() => addItem('publications', { title: '', description: '' })} />
              </motion.div>
            )}

            {/* ── STYLE / TEMPLATE PICKER ── */}
            {activeTab === 'tpl' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Choose Template</h3>
                  {selectedTemplateObj?.samplePdfUrl && (
                    <a href={selectedTemplateObj.samplePdfUrl} target="_blank" rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <ExternalLink size={12} /> View Sample PDF
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {templates.map((tpl: any) => (
                    <div key={tpl._id}
                      onClick={() => setSelectedTemplate(tpl._id)}
                      className={`group relative rounded-[2rem] border-2 transition-all overflow-hidden cursor-pointer ${selectedTemplateId === tpl._id ? 'border-blue-600 shadow-xl shadow-blue-100 ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>

                      {/* Thumbnail or placeholder */}
                      <div className="aspect-video bg-slate-50 relative overflow-hidden">
                        {tpl.thumbnailUrl ? (
                          <img src={tpl.thumbnailUrl} alt={tpl.name} className="w-full h-full object-cover object-top transition-transform group-hover:scale-105" />
                        ) : tpl.samplePdfUrl ? (
                          /* Embed first page of PDF as preview */
                          <iframe src={`${tpl.samplePdfUrl}#view=FitH&toolbar=0`} className="w-full h-full pointer-events-none" title="Sample Resume" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-200"><LayoutIcon size={48} /></div>
                        )}
                        <div className={`absolute inset-0 bg-blue-600/10 transition-opacity ${selectedTemplateId === tpl._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                      </div>

                      <div className="p-5 flex items-center justify-between bg-white border-t">
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{tpl.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{tpl.description}</p>
                          {tpl.detectedFields?.length > 0 && (
                            <p className="text-[10px] text-blue-400 mt-1">{tpl.detectedFields.length} detected fields</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {tpl.samplePdfUrl && (
                            <a href={tpl.samplePdfUrl} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-xs text-slate-500 hover:text-blue-600 font-bold px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 transition-colors flex items-center gap-1">
                              <FileText size={12} /> Sample
                            </a>
                          )}
                          {selectedTemplateId === tpl._id && (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                              <Sparkles size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </aside>

        {/* ── Preview ── */}
        <main className="flex-1 bg-slate-200 overflow-y-auto p-3 sm:p-6 lg:p-12 xl:p-20 flex justify-center custom-scrollbar">
          <div className="w-full max-w-[850px] bg-white shadow-2xl origin-top h-fit">
            <div ref={printRef}>
              <TemplateRenderer
                data={renderData}
                config={selectedTemplateObj?.structureConfig}
                htmlTemplate={selectedTemplateObj?.htmlTemplate}
                detectedFields={selectedTemplateObj?.detectedFields || []}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// ─── Shared Sub-Components ─────────────────────────────────────────────────────

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
};

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type ItemCardProps = {
  children: ReactNode;
  onRemove: () => void;
};

type AddButtonProps = {
  label: string;
  onClick: () => void;
};

const TabButton = ({ active, onClick, icon, label }: TabButtonProps) => (
  <button onClick={onClick}
    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${active ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
    {icon} {label}
  </button>
);

const SectionHeader = ({ icon, title }: { icon?: ReactNode; title: string }) => (
  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter flex items-center gap-2">
    {icon} {title}
  </h3>
);

const FormField = ({ label, value, onChange, placeholder, className }: FormFieldProps) => (
  <div className={`space-y-1 ${className || ''}`}>
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">{label}</label>
    <input
      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-100 text-slate-800 font-medium placeholder:text-slate-300"
      value={value || ''}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }: TextAreaProps) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">{label}</label>
    <textarea
      className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm outline-none min-h-[80px]"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const ItemCard = ({ children, onRemove }: ItemCardProps) => (
  <div className="p-6 border border-slate-100 rounded-3xl space-y-4 bg-slate-50/50 relative group">
    <button onClick={onRemove}
      className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all">
      <Trash2 size={16} />
    </button>
    {children}
  </div>
);

const AddButton = ({ label, onClick }: AddButtonProps) => (
  <button onClick={onClick}
    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
    <Plus size={20} /> {label}
  </button>
);

export default Builder;
