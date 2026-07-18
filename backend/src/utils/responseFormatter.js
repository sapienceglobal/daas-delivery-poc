/**
 * Standardised API response helpers.
 *
 * Every JSON response from the platform uses this shape:
 *   { success: Boolean, message: String, data: Any, pagination?: Object }
 */

export const success = (res, { data = null, message = 'Success', statusCode = 200, pagination = null } = {}) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

export const created = (res, { data = null, message = 'Created successfully' } = {}) => {
  return success(res, { data, message, statusCode: 201 });
};

export const error = (res, { message = 'Something went wrong', statusCode = 500, errors = null } = {}) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

export const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, { message, statusCode: 400, errors });
};

export const unauthorized = (res, message = 'Not authorized') => {
  return error(res, { message, statusCode: 401 });
};

export const forbidden = (res, message = 'Forbidden: Insufficient privileges') => {
  return error(res, { message, statusCode: 403 });
};

export const notFound = (res, message = 'Resource not found') => {
  return error(res, { message, statusCode: 404 });
};

export const conflict = (res, message = 'Resource already exists') => {
  return error(res, { message, statusCode: 409 });
};

export const serviceUnavailable = (res, message = 'Service temporarily unavailable') => {
  return error(res, { message, statusCode: 503 });
};

/**
 * Build a pagination metadata object for list endpoints.
 *
 * @param {Number} page     - Current page (1-indexed)
 * @param {Number} limit    - Items per page
 * @param {Number} total    - Total number of matching documents
 */
export const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};
