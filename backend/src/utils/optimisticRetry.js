import logger from './logger.js';
import { AppError } from '../middleware/errorHandler.js';

export const withOptimisticRetry = async (doc, updateFn, maxRetries = 3) => {
  let currentDoc = doc;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await updateFn(currentDoc);
    try {
      await currentDoc.save();
      return { doc: currentDoc, result };
    } catch (error) {
      if (error.name === 'VersionError' && attempt < maxRetries - 1) {
        logger.warn(`VersionError encountered on ${currentDoc.constructor.modelName} ${currentDoc._id}. Retrying... Attempt ${attempt + 1}`);
        currentDoc = await currentDoc.constructor.findById(currentDoc._id);
        if (!currentDoc) throw new AppError('Document not found during optimistic retry', 404);
        continue;
      }
      throw error;
    }
  }
};
