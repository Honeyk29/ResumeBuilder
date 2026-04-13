import mustache from 'mustache';

interface Props {
  data: any;
  config: any;
  htmlTemplate?: string;
  detectedFields?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a unified flat context for Mustache rendering */
const buildContext = (data: any) => ({
  ...(data.personalInfo || {}),
  firstName: (data.personalInfo?.fullName || data.fullName || '').split(' ')[0],
  lastName:  (data.personalInfo?.fullName || data.fullName || '').split(' ').slice(1).join(' '),
  website:   data.personalInfo?.portfolio || data.website || '',
  objective: data.personalInfo?.summary  || data.objective || '',
  ...data,
  ...(data.customData || {}),
});

/** Check if a section block exists in the template source */
const hasBlock = (fields: string[], name: string) =>
  fields.some(f => f.toLowerCase() === name.toLowerCase());

// ─── Smart Universal Auto-Renderer ────────────────────────────────────────────
// Renders any template dynamically based on detected fields, with no HTML needed.

const SectionTitle = ({ title, accent }: { title: string; accent: string }) => (
  <div style={{ borderBottom: `2px solid ${accent}`, marginBottom: 8, paddingBottom: 2 }}>
    <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: '#222' }}>
      {title}
    </span>
  </div>
);

const Placeholder = ({ text }: { text: string }) => (
  <span style={{ color: '#ccc', fontStyle: 'italic', fontSize: 10 }}>{text}</span>
);

const UniversalAutoRenderer = ({ data, fields, accent }: { data: any; fields: string[]; accent: string }) => {
  const pi = data.personalInfo || {};
  const fullName = pi.fullName || (data.firstName ? `${data.firstName} ${data.lastName}` : '');

  const leftSections: string[] = [];
  const rightSections: string[] = [];

  // Classify sections into left/right based on Deedy-style (or single-column)
  const isTwoColumn = hasBlock(fields, 'minipage') ||
    (hasBlock(fields, 'education') && hasBlock(fields, 'links')) ||
    (hasBlock(fields, 'coursework') && hasBlock(fields, 'experience'));

  const leftOrder  = ['objective', 'education', 'links', 'coursework', 'skills'];
  const rightOrder = ['experience', 'projects', 'training', 'publications', 'certifications'];

  leftOrder.forEach(s  => { if (hasBlock(fields, s))  leftSections.push(s); });
  rightOrder.forEach(s => { if (hasBlock(fields, s)) rightSections.push(s); });

  const renderSection = (name: string) => {
    switch (name) {
      case 'objective':
        return (
          <div key="objective" style={{ marginBottom: 16 }}>
            <SectionTitle title="Objective" accent={accent} />
            <p style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>
              {pi.summary || data.objective || <Placeholder text="Your objective..." />}
            </p>
          </div>
        );

      case 'education':
        return (
          <div key="education" style={{ marginBottom: 16 }}>
            <SectionTitle title="Education" accent={accent} />
            {(data.education || []).map((edu: any, i: number) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 12 }}>{edu.institution || <Placeholder text="Institution" />}</div>
                <div style={{ fontStyle: 'italic', fontSize: 11, color: '#555' }}>{edu.degree || <Placeholder text="Degree" />}</div>
                <div style={{ fontSize: 10, color: '#777' }}>{edu.details || `${edu.startDate || ''} – ${edu.endDate || ''}`}</div>
              </div>
            ))}
            {(!data.education || data.education.length === 0) && <Placeholder text="Add education entries" />}
          </div>
        );

      case 'links':
        return (
          <div key="links" style={{ marginBottom: 16 }}>
            <SectionTitle title="Links" accent={accent} />
            {(data.links || []).map((lnk: any, i: number) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 700 }}>{lnk.label}</span>
                {lnk.label ? '://' : ''}
                <span style={{ color: accent }}>{lnk.text || lnk.url}</span>
              </div>
            ))}
            {(!data.links || data.links.length === 0) && <Placeholder text="Add links" />}
          </div>
        );

      case 'coursework':
        return (
          <div key="coursework" style={{ marginBottom: 16 }}>
            <SectionTitle title="Coursework" accent={accent} />
            {(data.coursework || []).map((cw: any, i: number) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11 }}>{cw.title}</div>
                <div style={{ fontSize: 10, color: '#555', lineHeight: 1.6 }}>
                  {(cw.items || []).join(' • ')}
                </div>
              </div>
            ))}
            {(!data.coursework || data.coursework.length === 0) && <Placeholder text="Add coursework groups" />}
          </div>
        );

      case 'skills':
        return (
          <div key="skills" style={{ marginBottom: 16 }}>
            <SectionTitle title="Skills" accent={accent} />
            {(data.skills?.length > 0)
              ? <p style={{ fontSize: 11, color: '#444' }}>{data.skills.join(', ')}</p>
              : <Placeholder text="Add skills" />
            }
          </div>
        );

      case 'experience':
        return (
          <div key="experience" style={{ marginBottom: 16 }}>
            <SectionTitle title="Experience" accent={accent} />
            {(data.experience || []).map((exp: any, i: number) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 800, fontSize: 12 }}>{exp.company || <Placeholder text="Company" />}</span>
                  <span style={{ fontSize: 10, color: '#888' }}>{exp.duration || `${exp.startDate || ''} – ${exp.endDate || ''}`}</span>
                </div>
                <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>
                  {exp.role || exp.position} {exp.location ? `| ${exp.location}` : ''}
                </div>
                {exp.description && (
                  <p style={{ fontSize: 11, color: '#444', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{exp.description}</p>
                )}
              </div>
            ))}
            {(!data.experience || data.experience.length === 0) && <Placeholder text="Add experience" />}
          </div>
        );

      case 'projects':
        return (
          <div key="projects" style={{ marginBottom: 16 }}>
            <SectionTitle title="Projects" accent={accent} />
            {(data.projects || []).map((proj: any, i: number) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 12 }}>{proj.title || proj.name || <Placeholder text="Project" />}</div>
                <div style={{ fontSize: 10, color: '#777' }}>
                  {proj.duration ? `${proj.duration} | ` : ''}{proj.organization || proj.tech || ''}
                </div>
                {proj.description && <p style={{ fontSize: 11, color: '#444', marginTop: 3, lineHeight: 1.5 }}>{proj.description}</p>}
              </div>
            ))}
            {(!data.projects || data.projects.length === 0) && <Placeholder text="Add projects" />}
          </div>
        );

      case 'training':
        return (
          <div key="training" style={{ marginBottom: 16 }}>
            <SectionTitle title="Training" accent={accent} />
            {(data.training || []).map((tr: any, i: number) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{tr.title}</div>
                {tr.location && <div style={{ fontSize: 10, color: '#777' }}>{tr.location}</div>}
                {tr.description && <p style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{tr.description}</p>}
              </div>
            ))}
            {(!data.training || data.training.length === 0) && <Placeholder text="Add training entries" />}
          </div>
        );

      case 'publications':
        return (
          <div key="publications" style={{ marginBottom: 16 }}>
            <SectionTitle title="Publication" accent={accent} />
            {(data.publications || []).map((pub: any, i: number) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{pub.title}</div>
                {pub.description && <p style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{pub.description}</p>}
              </div>
            ))}
            {(!data.publications || data.publications.length === 0) && <Placeholder text="Add publications" />}
          </div>
        );

      case 'certifications':
        return (
          <div key="certifications" style={{ marginBottom: 16 }}>
            <SectionTitle title="Certifications" accent={accent} />
            {(data.certifications || []).map((cert: any, i: number) => (
              <div key={i} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{cert.title}</div>
                  <div style={{ fontSize: 10, color: '#777', fontStyle: 'italic' }}>{cert.issuer}</div>
                </div>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 700 }}>{cert.date}</div>
              </div>
            ))}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: '36px 40px', background: '#fff', minHeight: 1050 }}>
      {/* ── Header ── */}
      <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 30, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: '#111' }}>
          <span style={{ fontWeight: 300 }}>{(fullName.split(' ')[0] || '') + ' '}</span>
          <span style={{ fontWeight: 900, color: accent }}>{fullName.split(' ').slice(1).join(' ') || ''}</span>
        </div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '0 16px' }}>
          {pi.portfolio && <span>🌐 {pi.portfolio}</span>}
          {pi.email    && <span>✉ {pi.email}</span>}
          {pi.phone    && <span>📞 {pi.phone}</span>}
          {pi.address  && <span>📍 {pi.address}</span>}
        </div>
      </div>

      {/* ── Body ── */}
      {isTwoColumn ? (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Left ~33% */}
          <div style={{ width: '33%', borderRight: '1.5px solid #eee', paddingRight: 20 }}>
            {leftSections.map(s => renderSection(s))}
          </div>
          {/* Right ~66% */}
          <div style={{ flex: 1 }}>
            {rightSections.map(s => renderSection(s))}
          </div>
        </div>
      ) : (
        <div>
          {[...leftSections, ...rightSections].map(s => renderSection(s))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const TemplateRenderer = ({ data, config, htmlTemplate, detectedFields }: Props) => {
  if (!config) return <div className="p-8 text-slate-400">Loading template configuration...</div>;

  const { colors } = config;
  const accent = colors?.primary || '#3b82f6';

  // ── Path 1: Admin has provided a custom HTML template ──
  if (htmlTemplate && htmlTemplate.trim().length > 10) {
    try {
      const ctx = buildContext(data);
      const renderedHtml = mustache.render(htmlTemplate, ctx, {}, { tags: ['[[', ']]'] } as any);
      return <div className="universal-template-container" dangerouslySetInnerHTML={{ __html: renderedHtml }} />;
    } catch (err) {
      console.error('Universal Rendering Error:', err);
      return <div className="p-12 text-red-500 font-bold">Error rendering HTML template. Check your [[ ]] tags.</div>;
    }
  }

  // ── Path 2: Smart Universal Auto-Renderer (works for ANY template with [[ ]] tags) ──
  const fields = detectedFields || [];
  if (fields.length > 0) {
    return <UniversalAutoRenderer data={data} fields={fields} accent={accent} />;
  }

  // ── Path 3: Legacy Harshibar React Layout (fallback) ──
  const { fonts } = config;
  const style: any = { backgroundColor: colors?.background || '#fff', color: colors?.text || '#111827', fontFamily: fonts?.body || 'sans-serif' };
  const borderPrimaryStyle = { borderColor: accent };
  const primaryStyle = { color: accent };

  return (
    <div style={style} className="w-full min-h-[1100px] shadow-2xl p-16 space-y-10">
      <div className="text-center space-y-4 border-b-2 pb-8" style={borderPrimaryStyle}>
        <h1 className="text-5xl font-extrabold uppercase tracking-tighter" style={{ ...primaryStyle, fontFamily: fonts?.heading }}>
          {data.personalInfo?.fullName || 'YOUR NAME'}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
          <span>✉ {data.personalInfo?.email}</span>
          <span>📞 {data.personalInfo?.phone}</span>
          <span>📍 {data.personalInfo?.address}</span>
        </div>
      </div>

      <div className="space-y-8">
        {data.personalInfo?.summary && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest border-l-4 pl-4 mb-3" style={borderPrimaryStyle}>Summary</h2>
            <p className="text-slate-600 text-sm pl-5 leading-relaxed">{data.personalInfo.summary}</p>
          </section>
        )}

        <section>
          <h2 className="text-lg font-black uppercase tracking-widest border-l-4 pl-4 mb-3" style={borderPrimaryStyle}>Experience</h2>
          <div className="space-y-5 pl-5">
            {data.experience?.map((exp: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">{exp.company}</span>
                  <span className="text-xs text-slate-400">{exp.startDate} — {exp.endDate}</span>
                </div>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{exp.position || exp.role}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>

        {data.projects?.length > 0 && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest border-l-4 pl-4 mb-3" style={borderPrimaryStyle}>Projects</h2>
            <div className="space-y-4 pl-5">
              {data.projects.map((proj: any, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">{proj.name || proj.title}</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{proj.tech}</span>
                  </div>
                  <p className="text-sm text-slate-600">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-8">
          <section>
            <h2 className="text-base font-black uppercase tracking-widest border-l-4 pl-4 mb-3" style={borderPrimaryStyle}>Education</h2>
            <div className="space-y-3 pl-5">
              {data.education?.map((edu: any, idx: number) => (
                <div key={idx}>
                  <p className="font-bold text-slate-800 text-sm">{edu.degree}</p>
                  <p className="text-xs text-slate-500">{edu.institution}</p>
                  <p className="text-[10px] text-slate-400">{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-widest border-l-4 pl-4 mb-3" style={borderPrimaryStyle}>Expertise</h2>
            <div className="flex flex-wrap gap-2 pl-5">
              {data.skills?.map((skill: string, idx: number) => (
                <span key={idx} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">{skill}</span>
              ))}
            </div>
            {data.certifications?.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-black uppercase tracking-widest border-l-4 pl-4 mb-2" style={borderPrimaryStyle}>Certifications</h2>
                <div className="space-y-2 pl-5">
                  {data.certifications.map((cert: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <p className="font-bold text-slate-800">{cert.title}</p>
                      <p className="text-[10px] text-slate-500">{cert.issuer} • {cert.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default TemplateRenderer;
