import mongoose, { Document, Schema, Types } from 'mongoose';

export type AppealStatus = 'pending' | 'accepted' | 'rejected';

export interface IAppeal extends Document {
  submissionId: Types.ObjectId;
  userId: Types.ObjectId;
  justification: string;
  status: AppealStatus;
  adminResponse?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AppealSchema = new Schema<IAppeal>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      unique: true,   // one appeal per submission
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    justification: {
      type: String,
      required: [true, 'Justification is required'],
      minlength: [10, 'Justification must be at least 10 characters'],
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminResponse: { type: String, maxlength: 5000 },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

export const Appeal = mongoose.model<IAppeal>('Appeal', AppealSchema);
