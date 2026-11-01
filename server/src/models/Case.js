import mongoose from 'mongoose';
const { Schema } = mongoose;
const sub = (fields) => new Schema(fields, { _id: false });
const required = { type: String, required: true };
const schema = new Schema(
  {
    accessTokenHash: { ...required, select: false },
    premise: required,
    title: required,
    story: required,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    suspects: [
      sub({ id: required, name: required, role: required, description: required, alibi: required }),
    ],
    clues: [
      sub({
        id: required,
        title: required,
        type: {
          type: String,
          enum: ['chat', 'photo_description', 'cctv_log', 'document', 'physical'],
          required: true,
        },
        summary: required,
        content: required,
        relevance: required,
      }),
    ],
    hints: [
      sub({
        id: required,
        order: { type: Number, required: true },
        text: required,
        clueIds: [String],
      }),
    ],
    solution: {
      type: sub({
        culpritSuspectId: required,
        motive: required,
        explanation: required,
        supportingClueIds: [String],
        timeline: [sub({ time: required, event: required })],
      }),
      select: false,
      required: true,
    },
    progress: {
      discoveredClueIds: { type: [String], default: [] },
      usedHintIds: { type: [String], default: [] },
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    revision: { type: Number, default: 0 },
    accusation: {
      type: sub({ suspectId: String, correct: Boolean, submittedAt: Date }),
      default: null,
    },
    score: { type: Number, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
for (const key of ['suspects', 'clues', 'hints'])
  schema
    .path(key)
    .validate(
      (items) => new Set(items.map((x) => x.id)).size === items.length,
      'IDs must be unique',
    );
export const Case = mongoose.model('Case', schema);
