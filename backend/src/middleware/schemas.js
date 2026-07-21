import Joi from 'joi';

// ── Auth Schemas ────────────────────────────────────────────────────────────

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(1).required().messages({
    'any.required': 'Password is required'
  })
});

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Name is required',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password requires uppercase, lowercase, number & special character (@$!%*?&)',
      'any.required': 'Password is required'
    }),
  phone: Joi.string().allow('').optional(),
  role: Joi.string().valid('customer', 'merchant').optional()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password requires uppercase, lowercase, number & special character (@$!%*?&)',
      'any.required': 'Password is required'
    })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'Password requires uppercase, lowercase, number & special character (@$!%*?&)',
      'any.required': 'New password is required'
    })
});

// ── Order Schemas ───────────────────────────────────────────────────────────

export const createOrderSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required().messages({
    'any.required': 'restaurantId is required',
    'string.hex': 'Invalid restaurant ID format',
    'string.length': 'Invalid restaurant ID format'
  }),
  items: Joi.array().items(
    Joi.object({
      menuItemId: Joi.string().hex().length(24),
      _id: Joi.string().hex().length(24),
      quantity: Joi.number().integer().min(1).max(99).default(1),
      selectedSize: Joi.object({
        name: Joi.string().required(),
        price: Joi.number()
      }).allow(null).optional(),
      addOns: Joi.array().items(
        Joi.object({
          _id: Joi.string(),
          name: Joi.string(),
          price: Joi.number()
        })
      ).optional(),
      specialInstructions: Joi.string().max(500).allow('').optional()
    }).or('menuItemId', '_id')
  ).min(1).max(50).required().messages({
    'array.min': 'Order must contain at least one item',
    'array.max': 'Maximum 50 items per order',
    'any.required': 'Items are required'
  }),
  address: Joi.string().max(500).allow('', null).optional(),
  addressLat: Joi.number().min(-90).max(90).allow(null).optional(),
  addressLng: Joi.number().min(-180).max(180).allow(null).optional(),
  orderType: Joi.string().valid('delivery', 'pickup', 'dine_in').default('delivery'),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'apple_pay', 'google_pay', 'cash').default('credit_card'),
  tip: Joi.number().min(0).max(10000).default(0),
  couponCode: Joi.string().max(50).allow('', null).optional(),
  courierNotes: Joi.string().max(500).allow('', null).optional(),
  scheduledTime: Joi.string().allow(null).optional(),
  tableNumber: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
  stripePaymentIntentId: Joi.string().max(200).allow('', null).optional(),
  useLoyaltyPoints: Joi.boolean().default(false)
});

export const rateOrderSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be between 1 and 5',
    'number.max': 'Rating must be between 1 and 5',
    'any.required': 'Rating is required'
  }),
  review: Joi.string().max(1000).allow('', null).optional()
});

export const deliveryQuoteSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required(),
  address: Joi.string().required(),
  addressLat: Joi.number().min(-90).max(90).allow(null).optional(),
  addressLng: Joi.number().min(-180).max(180).allow(null).optional(),
  scheduledTime: Joi.string().allow(null).optional(),
  items: Joi.array().optional()
});

// ── Reservation Schemas ─────────────────────────────────────────────────────

export const createReservationSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required(),
  date: Joi.string().required().messages({
    'any.required': 'Reservation date is required'
  }),
  time: Joi.string().required().messages({
    'any.required': 'Reservation time is required'
  }),
  partySize: Joi.number().integer().min(1).max(100).required().messages({
    'number.min': 'Party size must be at least 1',
    'number.max': 'Maximum party size is 100',
    'any.required': 'Party size is required'
  }),
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(30).required(),
  specialRequests: Joi.string().max(500).allow('', null).optional(),
  occasion: Joi.string().max(100).allow('', null).optional()
});

// ── Catering Schemas ────────────────────────────────────────────────────────

export const createCateringSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required(),
  eventType: Joi.string().max(100).required(),
  eventDate: Joi.string().required(),
  guestCount: Joi.number().integer().min(1).max(10000).required(),
  customerName: Joi.string().trim().max(100).required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string().max(30).required(),
  venue: Joi.string().max(300).allow('', null).optional(),
  budget: Joi.number().min(0).allow(null).optional(),
  dietaryRequirements: Joi.array().items(Joi.string().max(100)).optional(),
  additionalNotes: Joi.string().max(1000).allow('', null).optional(),
  menuPreferences: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional()
});

// ── Review Schemas ──────────────────────────────────────────────────────────

export const replyToReviewSchema = Joi.object({
  reply: Joi.string().trim().min(1).max(1000).required().messages({
    'any.required': 'Reply content is required',
    'string.max': 'Reply cannot exceed 1000 characters'
  })
});

// ── Refund Schema ───────────────────────────────────────────────────────────

export const refundOrderSchema = Joi.object({
  amount: Joi.number().min(0.01).optional(),
  reason: Joi.string().max(500).allow('', null).optional()
});
