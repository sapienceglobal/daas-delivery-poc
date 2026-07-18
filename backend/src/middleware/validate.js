import { AppError } from './errorHandler.js';

/**
 * Express middleware factory that validates req.body (or req.query / req.params)
 * against a Joi schema.
 *
 * Usage:
 *   import Joi from 'joi';
 *   const schema = Joi.object({ name: Joi.string().required() });
 *   router.post('/items', validate(schema), controller.create);
 *
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} source — which part of the request to validate
 */
const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    if (!schema || typeof schema.validate !== 'function') {
      return next();
    }

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const messages = error.details.map((d) => d.message.replace(/"/g, '')).join('. ');
      return next(new AppError(messages, 400));
    }

    req[source] = value;
    return next();
  };
};

export default validate;
