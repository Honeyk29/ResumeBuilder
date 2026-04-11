import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Palette, Download, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-blue-600 font-medium"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Resume Generation</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-tight"
            >
              Build your professional <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                future in minutes.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed"
            >
              Stand out to recruiters with premium templates, live preview, 
              and effortless PDF exporting. Your dream job is just a few fields away.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center justify-center gap-4"
            >
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2 group"
              >
                Create My Resume <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login"
                className="bg-white text-slate-900 px-8 py-4 rounded-2xl text-lg font-semibold border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                View Examples
              </Link>
            </motion.div>

            {/* Decorative background blur */}
            <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-400/20 blur-[120px] rounded-full -z-10" />
          </div>

          {/* Features Section */}
          <div className="mt-40 grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-blue-600" />}
              title="Modern Templates"
              description="Choose from a library of professional templates vetted by HR experts and designers."
              delay={0.4}
            />
            <FeatureCard 
              icon={<Palette className="w-6 h-6 text-purple-600" />}
              title="Full Customization"
              description="Admin-generated dynamic layouts that allow you to adjust every detail to your liking."
              delay={0.5}
            />
            <FeatureCard 
              icon={<Download className="w-6 h-6 text-indigo-600" />}
              title="One-Click Export"
              description="Download your resume as a high-quality PDF or share it with a live link."
              delay={0.6}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
  >
    <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </motion.div>
);

export default Home;
