import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  templateId: mongoose.Schema.Types.ObjectId;
  title: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    summary: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
  }>;
  projects: Array<{
    name: string;
    tech: string;
    link?: string;
    description: string;
  }>;
  certifications: Array<{
    title: string;
    issuer: string;
    date: string;
  }>;
  skills: string[];
  customData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    title: { type: String, default: 'Untitled Resume' },
    personalInfo: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      summary: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' }
    },
    experience: [
      {
        company: { type: String },
        position: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String }
      }
    ],
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        startDate: { type: String },
        endDate: { type: String }
      }
    ],
    projects: [
      {
        name: { type: String },
        tech: { type: String },
        link: { type: String },
        description: { type: String }
      }
    ],
    certifications: [
      {
        title: { type: String },
        issuer: { type: String },
        date: { type: String }
      }
    ],
    skills: [{ type: String }],
    customData: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, strict: false }
);

export default mongoose.model<IResume>('Resume', ResumeSchema);
