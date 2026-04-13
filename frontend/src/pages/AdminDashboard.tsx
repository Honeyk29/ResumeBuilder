import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Layout, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';

type TemplateFormData = {
  name: string;
  description: string;
  thumbnailUrl: string;
  structureConfig: {
    colors: { primary: string; text: string; background: string };
    fonts: { heading: string; body: string };
    layout: string;
  };
  latexTemplate: string;
  htmlTemplate: string;
  samplePdfUrl: string;
  isActive: boolean;
  detectedFields: string[];
};

const AdminDashboard = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    thumbnailUrl: '',
    structureConfig: {
      colors: { primary: '#3b82f6', text: '#111827', background: '#ffffff' },
      fonts: { heading: 'Inter', body: 'Roboto' },
      layout: 'standard'
    },
    latexTemplate: '',
    htmlTemplate: '',
    samplePdfUrl: '',
    isActive: true,
    detectedFields: []
  });

  const extractFields = (text: string): string[] => {
    if (!text) return [];
    const regex = /\[\[\s*([#/^]?)?\s*([\w.]+)\s*\]\]/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[2]);
    }
    return Array.from(matches);
  };

  useEffect(() => {
    const fieldsFromLatex = extractFields(formData.latexTemplate || '');
    const fieldsFromHtml = extractFields(formData.htmlTemplate || '');
    const detected = Array.from(new Set([...fieldsFromLatex, ...fieldsFromHtml]));
    
    // Only update if changes to avoid infinite loop
    if (JSON.stringify(detected) !== JSON.stringify(formData.detectedFields)) {
      setFormData(prev => ({ ...prev, detectedFields: detected }));
    }
  }, [formData.latexTemplate, formData.htmlTemplate]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/templates');
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate._id}`, formData);
      } else {
        await api.post('/templates', formData);
      }
      fetchTemplates();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert('Error saving template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (confirm('Delete this template?')) {
      try {
        await api.delete(`/templates/${id}`);
        fetchTemplates();
      } catch (err) {
        alert('Error deleting template');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      thumbnailUrl: '',
      structureConfig: {
        colors: { primary: '#3b82f6', text: '#111827', background: '#ffffff' },
        fonts: { heading: 'Inter', body: 'Roboto' },
        layout: 'standard'
      },
      latexTemplate: '',
      htmlTemplate: '',
      samplePdfUrl: '',
      isActive: true,
      detectedFields: []
    });
    setEditingTemplate(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900">Template Master</h1>
              <p className="text-slate-500 mt-2">Create and manage dynamic JSON-based resume layouts.</p>
            </div>
            
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-dark text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black shadow-xl shadow-slate-200 transition-all"
            >
              <Plus size={20} /> Add Template Configuration
            </button>
          </div>

          {loading ? (
             <div className="flex items-center justify-center py-20">
               <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
             </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((tpl: any) => (
                <div key={tpl._id} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Layout size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800">{tpl.name}</h3>
                    <p className="text-slate-500 text-sm line-clamp-1">{tpl.description}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <button 
                        onClick={() => { setEditingTemplate(tpl); setFormData(tpl); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                         onClick={() => deleteTemplate(tpl._id)}
                         className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${tpl.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                         {tpl.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal - Could be a separate component for cleanliness */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold font-slate-900">{editingTemplate ? 'Edit Configuration' : 'New Template Config'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
               <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2 space-y-2">
                   <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Template Name</label>
                   <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. Modern Professional"
                   />
                 </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Configuration JSON (Structure)</label>
                    <textarea 
                      required
                      rows={6}
                      value={JSON.stringify(formData.structureConfig, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setFormData({...formData, structureConfig: parsed});
                        } catch(err) {}
                      }}
                      className="w-full bg-slate-900 text-green-400 font-mono text-sm px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">LaTeX Template Source (Mustache)</label>
                    <textarea 
                      rows={8}
                      value={formData.latexTemplate}
                      onChange={(e) => setFormData({...formData, latexTemplate: e.target.value})}
                      className="w-full bg-slate-900 text-pink-400 font-mono text-[10px] px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-pink-500 transition-all"
                      placeholder="\documentclass{article} ... Use [[ personalInfo.fullName ]] style tags."
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">HTML Preview Source (Mustache/CSS)</label>
                    <textarea 
                      rows={8}
                      value={formData.htmlTemplate}
                      onChange={(e) => setFormData({...formData, htmlTemplate: e.target.value})}
                      className="w-full bg-slate-900 text-blue-400 font-mono text-[10px] px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all"
                      placeholder="<div style='font-family: Inter'>[[ personalInfo.fullName ]]</div>"
                    />
                  </div>

                   <div className="col-span-2 space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">📄 Sample PDF URL <span className="font-normal text-slate-300">(shown to users as preview)</span></label>
                     <input
                       type="url"
                       value={(formData as any).samplePdfUrl || ''}
                       onChange={(e) => setFormData({...formData, samplePdfUrl: e.target.value} as any)}
                       className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                       placeholder="https://example.com/sample-deedy-resume.pdf"
                     />
                     <p className="text-[10px] text-slate-400 ml-1">Paste a publicly accessible PDF link. Users will see it as a preview on the template card.</p>
                   </div>
               </div>

                <div className="col-span-2 p-6 bg-slate-50 rounded-[1.5rem] space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detected Variables</h4>
                     <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{formData.detectedFields?.length || 0} Found</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {formData.detectedFields?.length > 0 ? (
                        formData.detectedFields.map((field: string) => (
                          <span key={field} className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-mono text-slate-600 shadow-sm">{field}</span>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No variables detected using [[ variableName ]] syntax yet.</p>
                      )}
                   </div>
                </div>

               <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
               >
                 <Save size={20} /> {editingTemplate ? 'Update Configuration' : 'Deploy Template'}
               </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
