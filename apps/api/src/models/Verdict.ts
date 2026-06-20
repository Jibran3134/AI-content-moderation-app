import mongoose, { Document, Schema, Types } from 'mongoose';

export type VerdictDecision = 'approved' | 'rejected' | 'needs_review' | 'escalated';
export type AICategory =
  | 'hate_speech'
  | 'violence'
  | 'sexual_content'
  | 'spam'
  | 'misinformation'
  | 'harassment'
  | 'self_harm'
  | 'safe'
  | 'other';

export interface AIAnalysisResult {
  decision: VerdictDecision;
  confidence: number;
  categories: Array<{ name: AICategory; score: number }>;
  reasoning: string;
  flaggedSegments: Array<{ text: string; category: AICategory; severity: 'low' | 'medium' | 'high' }>;
  processingTimeMs?: number;
}

export interface IVerdict extends Document {
  submissionId: Types.ObjectId;
  decision: VerdictDecision;
  notes: string;
  overridesAI: boolean;
  overrideReason?: string;
  aiAnalysis?: AIAnalysisResult;
  reviewedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VerdictSchema = new Schema<IVerdict>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      unique: true,
      index: true,
    },
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'needs_review', 'escalated'],
      required: true,
    },
    notes: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    overridesAI: { type: Boolean, default: false },
    overrideReason: { type: String, maxlength: 2000 },
    aiAnalysis: {
      decision: String,
      confidence: Number,
      categories: [{ name: String, score: Number }],
      reasoning: String,
      flaggedSegments: [{ text: String, category: String, severity: String }],
      processingTimeMs: Number,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Verdict = mongoose.model<IVerdict>('Verdict', VerdictSchema);
