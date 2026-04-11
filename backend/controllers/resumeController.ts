import { Request, Response } from 'express';
import Resume from '../models/ResumeModel';
import Template from '../models/TemplateModel';
import Mustache from 'mustache';
import axios from 'axios';
import FormData from 'form-data';

const escapeLatex = (str: string) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/#/g, '\\#')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}');
};

const recursiveEscape = (obj: any): any => {
  if (typeof obj === 'string') {
    return escapeLatex(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveEscape);
  }
  if (typeof obj === 'object' && obj !== null && !(obj instanceof Date)) {
    // If it's a Mongoose document, we should handle it
    const newObj: any = {};
    const target = obj.toObject ? obj.toObject() : obj;
    for (const key in target) {
      newObj[key] = recursiveEscape(target[key]);
    }
    return newObj;
  }
  return obj;
};

export const generateLatexPDF = async (req: Request, res: Response) => {
  try {
    const resume = await Resume.findById(req.params.id).populate('templateId');
    if (!resume || resume.userId.toString() !== (req as any).user._id.toString()) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const template = resume.templateId as any;
    if (!template || !template.latexTemplate) {
      return res.status(400).json({ message: 'This template does not support LaTeX generation' });
    }

    // Merge data using Mustache with custom tags [[ ]] to avoid clashing with LaTeX
    const rawData = resume.toObject();
    const cleanData = recursiveEscape(rawData);
    
    const dataToRender = {
      ...(cleanData.personalInfo || {}),
      firstName: (cleanData.personalInfo?.fullName || '').split(' ')[0],
      lastName:  (cleanData.personalInfo?.fullName || '').split(' ').slice(1).join(' '),
      website:   cleanData.personalInfo?.portfolio || '',
      objective: cleanData.personalInfo?.summary  || '',
      ...cleanData,
      ...(cleanData.customData || {}),
      formattedSkills: (resume.skills || []).map((s: string) => escapeLatex(s)).join(', ')
    };

    
    // Disable Mustache's default HTML escaping for LaTeX
    const originalEscape = Mustache.escape;
    Mustache.escape = (text) => text;
    
    const renderedTex = Mustache.render(template.latexTemplate, dataToRender, {}, ['[[', ']]']);
    
    // Restore Mustache escape
    Mustache.escape = originalEscape;

    // Call TeXLive.net API for compilation
    const form = new FormData();
    form.append('filecontents0', renderedTex);
    form.append('filename0', 'resume.tex');
    form.append('engine', 'pdflatex');
    form.append('return', 'pdf');

    const response = await axios.post('https://texlive.net/cgi-bin/latexcgi', form, {
      headers: { ...form.getHeaders() },
      responseType: 'arraybuffer'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title || 'resume'}.pdf"`);
    res.send(Buffer.from(response.data));

  } catch (error: any) {
    console.error('LaTeX Compilation Error:', error.message);
    res.status(500).json({ message: 'Error generating PDF via LaTeX' });
  }
};

export const createResume = async (req: Request, res: Response) => {
  try {
    const { templateId, title, personalInfo, experience, education, projects, certifications, skills } = req.body;
    
    const resume = await Resume.create({
      userId: (req as any).user._id,
      templateId,
      title,
      personalInfo,
      experience,
      education,
      projects,
      certifications,
      skills
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Error creating resume' });
  }
};

export const getMyResumes = async (req: Request, res: Response) => {
  try {
    const resumes = await Resume.find({ userId: (req as any).user._id }).populate('templateId', 'name thumbnailUrl');
    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resumes' });
  }
};

export const getResumeById = async (req: Request, res: Response) => {
  try {
    const resume = await Resume.findById(req.params.id)
      .populate('templateId', 'name structureConfig')
      // Ensure the user actually owns this resume
    if (resume && resume.userId.toString() === (req as any).user._id.toString()) {
      res.status(200).json(resume);
    } else {
      res.status(404).json({ message: 'Resume not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resume' });
  }
};

export const updateResume = async (req: Request, res: Response) => {
  try {
    const { title, personalInfo, experience, education, projects, certifications, skills } = req.body;

    const resume = await Resume.findById(req.params.id);

    if (resume && resume.userId.toString() === (req as any).user._id.toString()) {
      resume.title = title || resume.title;
      if (personalInfo) resume.personalInfo = personalInfo;
      if (experience) resume.experience = experience;
      if (education) resume.education = education;
      if (projects) resume.projects = projects;
      if (certifications) resume.certifications = certifications;
      if (skills) resume.skills = skills;

      const updatedResume = await resume.save();
      res.json(updatedResume);
    } else {
      res.status(404).json({ message: 'Resume not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating resume' });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (resume && resume.userId.toString() === (req as any).user._id.toString()) {
      await Resume.deleteOne({ _id: resume._id });
      res.json({ message: 'Resume removed' });
    } else {
      res.status(404).json({ message: 'Resume not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resume' });
  }
};
