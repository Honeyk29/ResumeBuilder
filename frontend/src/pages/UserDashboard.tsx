import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, FileText, Trash2, Edit, Loader2 } from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import useAuthStore from '../store/useAuthStore';

const UserDashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes');
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await api.delete(`/resumes/${id}`);
        setResumes(resumes.filter((r: any) => r._id !== id));
      } catch (err) {
        alert('Failed to delete resume');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900">My Resumes</h1>
              <p className="text-slate-500 mt-2">Welcome back, {user?.name}. You have {resumes.length} resumes saved.</p>
            </div>
            
            <Link 
              to="/builder"
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:scale-[1.02]"
            >
              <Plus size={20} /> Create New Resume
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resumes.map((resume: any, index: number) => (
                <motion.div
                  key={resume._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden border-b">
                    {resume.templateId?.thumbnailUrl ? (
                      <img 
                        src={resume.templateId.thumbnailUrl} 
                        alt={resume.templateId.name} 
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                         <FileText size={64} className="text-slate-200" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-[2px]">
                      <Link 
                        to={`/builder/${resume._id}`}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95"
                      >
                        <Edit size={20} /> Edit Resume
                      </Link>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-bold text-xl text-slate-800 line-clamp-1">{resume.title}</h3>
                       <button 
                        onClick={() => deleteResume(resume._id)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors"
                       >
                         <Trash2 size={20} />
                       </button>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <span className="bg-slate-100 px-3 py-1 rounded-full">{resume.templateId?.name || 'Modern Template'}</span>
                      <span>Last edited Aug 24</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {resumes.length === 0 && (
                <div className="col-span-fukk md:col-span-2 lg:col-span-3 py-20 bg-white border border-dashed border-slate-300 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <FileText size={32} className="text-slate-400" />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800 mb-2">No resumes yet</h3>
                   <p className="text-slate-500 max-w-sm">Create your first professional resume using one of our premium templates.</p>
                   <Link to="/builder" className="mt-8 text-blue-600 font-bold hover:underline">Pick a Template &rarr;</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
