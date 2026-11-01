import mongoose from 'mongoose';
import { Case } from '../models/Case.js';
export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await Case.createIndexes();
}
