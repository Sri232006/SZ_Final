const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
    }));

    return next(new AppError('Validation failed', 400, extractedErrors));
  };
};

module.exports = validate;