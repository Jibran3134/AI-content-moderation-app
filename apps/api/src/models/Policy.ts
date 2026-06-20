import mongoose, { Document, Schema } from 'mongoose';

export const POLICY_CATEGORIES = [
  'graphic_violence',
  'hate_symbols',
  'self_harm',
  'extremist_propaganda',
  'weapons_contraband',
  'harassment_humiliation',
] as const;

export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];
export type PolicyEnforcement = 'auto_block' | 'flag_for_review';

export interface IPolicy extends Document {
  category: PolicyCategory;
  enabled: boolean;
  confidenceThreshold: number;
  enforcement: PolicyEnforcement;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: POLICY_CATEGORIES,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    confidenceThreshold: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    enforcement: {
      type: String,
      enum: ['auto_block', 'flag_for_review'],
      default: 'flag_for_review',
    },
  },
  { timestamps: true, versionKey: false },
);

export const Policy = mongoose.model<IPolicy>('Policy', PolicySchema);
