/**
 * Wraps an async Express route handler so that rejected promises are
 * automatically forwarded to the Express error-handling middleware.
 *
 * Usage:
 *   router.get('/items', asyncHandler(async (req, res) => { … }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
