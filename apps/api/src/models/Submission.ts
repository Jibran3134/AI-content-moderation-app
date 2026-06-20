import mongoose, { Document, Schema, Types } from 'mongoose';

export type VerdictOutcome = 'approved' | 'flagged' | 'blocked';

export interface ICategoryResult {
  category: string;
  detected: boolean;
  confidence: number;
  reasoning: string;
}

export interface IVerdict {
  outcome: VerdictOutcome;
  categoryResults: ICategoryResult[];
}

export interface ISubmission extends Document {
  userId: Types.ObjectId;
  imageUrl?: string;
  verdict?: IVerdict;
  appealId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryResultSchema = new Schema<ICategoryResult>(
  {
    category: { type: String, required: true },
    detected: { type: Boolean, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    reasoning: { type: String, required: true },
  },
  { _id: false },
);

const VerdictSubSchema = new Schema<IVerdict>(
  {
    outcome: {
      type: String,
      enum: ['approved', 'flagged', 'blocked'],
      required: true,
    },
    categoryResults: { type: [CategoryResultSchema], default: [] },
  },
  { _id: false },
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: { type: String },
    verdict: { type: VerdictSubSchema },
    appealId: {
      type: Schema.Types.ObjectId,
      ref: 'Appeal',
    },
  },
  { timestamps: true, versionKey: false },
);

SubmissionSchema.index({ userId: 1, createdAt: -1 });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
