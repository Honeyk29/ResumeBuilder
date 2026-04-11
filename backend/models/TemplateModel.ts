import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description: string;
  thumbnailUrl: string;
  samplePdfUrl?: string;
  structureConfig: any; // Flexible JSON defining layout, colors, and font styles
  latexTemplate?: string;
  htmlTemplate?: string;
  detectedFields: string[];
  isActive: boolean;
  createdBy: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    samplePdfUrl: { type: String, default: '' },
    structureConfig: { type: Schema.Types.Mixed, required: true }, // Admin controls mapping via JSON
    latexTemplate: { type: String, default: '' },
    htmlTemplate: { type: String, default: '' },
    detectedFields: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITemplate>('Template', TemplateSchema);
