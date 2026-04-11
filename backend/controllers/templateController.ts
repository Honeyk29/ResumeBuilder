import { Request, Response } from 'express';
import Template from '../models/TemplateModel';

const extractFields = (text: string): string[] => {
  if (!text) return [];
  // Regex to find all [[ variableName ]] or [[# blockName ]] or [[/ blockName ]]
  // We only care about the names for now to identify what needs an input
  const regex = /\[\[\s*([#/^]?)?\s*([\w.]+)\s*\]\]/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const fieldName = match[2];
    // Exclude reserved or common mustache noise if needed
    if (!fieldName.startsWith('.')) {
      matches.add(fieldName);
    }
  }
  return Array.from(matches);
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, structureConfig, latexTemplate, htmlTemplate, samplePdfUrl } = req.body;
    
    // Auto-detect fields from both LaTeX and HTML sources
    const fieldsFromLatex = extractFields(latexTemplate || '');
    const fieldsFromHtml = extractFields(htmlTemplate || '');
    const detectedFields = Array.from(new Set([...fieldsFromLatex, ...fieldsFromHtml]));

    const template = await Template.create({
      name,
      description,
      structureConfig,
      latexTemplate,
      htmlTemplate,
      samplePdfUrl: samplePdfUrl || '',
      detectedFields,
      createdBy: (req as any).user._id
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error creating template' });
  }
};

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await Template.find({});
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates' });
  }
};

export const getActiveTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await Template.find({ isActive: true });
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active templates' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const template = await Template.findById(req.params.id);

    if (template) {
      template.name = req.body.name || template.name;
      template.description = req.body.description ?? template.description;
      template.thumbnailUrl = req.body.thumbnailUrl ?? template.thumbnailUrl;
      template.structureConfig = req.body.structureConfig || template.structureConfig;
      template.latexTemplate = req.body.latexTemplate ?? template.latexTemplate;
      template.htmlTemplate = req.body.htmlTemplate ?? template.htmlTemplate;
      if (req.body.samplePdfUrl !== undefined) (template as any).samplePdfUrl = req.body.samplePdfUrl;
      
      // Re-scan fields if templates changed
      if (req.body.latexTemplate !== undefined || req.body.htmlTemplate !== undefined) {
        const fieldsFromLatex = extractFields(template.latexTemplate || '');
        const fieldsFromHtml = extractFields(template.htmlTemplate || '');
        template.detectedFields = Array.from(new Set([...fieldsFromLatex, ...fieldsFromHtml]));
      }

      if (req.body.isActive !== undefined) template.isActive = req.body.isActive;

      const updatedTemplate = await template.save();
      res.json(updatedTemplate);
    } else {
      res.status(404).json({ message: 'Template not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const template = await Template.findById(req.params.id);
    if (template) {
      await Template.deleteOne({ _id: template._id });
      res.json({ message: 'Template removed' });
    } else {
      res.status(404).json({ message: 'Template not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting template' });
  }
};
