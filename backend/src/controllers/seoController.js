import PageSeo from '../models/PageSeo.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { triggerFrontendRevalidation } from '../utils/revalidateFrontend.js';

/**
 * GET /api/seo/page?path=/about-us
 * Public endpoint to fetch SEO metadata for a static page.
 */
export const getPageSeo = asyncHandler(async (req, response) => {
  const path = String(req.query.path || '').trim().toLowerCase();
  if (!path) {
    throw new AppError('Path query parameter is required', 400);
  }

  const pageSeo = await PageSeo.findOne({ path }).lean();
  res.success(response, { data: pageSeo || null });
});

/**
 * GET /api/seo/pages
 * Protected endpoint for Admin / Merchant to list all configured static pages SEO.
 */
export const getAllPagesSeo = asyncHandler(async (req, response) => {
  const pages = await PageSeo.find().sort({ path: 1 }).lean();
  res.success(response, { data: pages });
});

/**
 * PUT /api/seo/page
 * Protected endpoint for Admin / Merchant to update or create SEO for a static page.
 */
export const updatePageSeo = asyncHandler(async (req, response) => {
  const { path, title, description, ogImage, keywords } = req.body;
  if (!path) {
    throw new AppError('Path is required', 400);
  }

  const cleanPath = String(path).trim().toLowerCase();

  const updated = await PageSeo.findOneAndUpdate(
    { path: cleanPath },
    {
      path: cleanPath,
      title: title ? String(title).trim().slice(0, 70) : '',
      description: description ? String(description).trim().slice(0, 160) : '',
      ogImage: ogImage ? String(ogImage).trim() : '',
      keywords: Array.isArray(keywords)
        ? keywords
        : typeof keywords === 'string'
        ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Trigger on-demand revalidation for this static page and sitemap
  const revalPaths = [cleanPath, '/sitemap.xml'];
  if (cleanPath === '/') {
    revalPaths.push('');
  }
  triggerFrontendRevalidation(revalPaths);

  res.success(response, {
    data: updated,
    message: `SEO settings updated for "${cleanPath}" and live revalidation triggered.`,
  });
});
