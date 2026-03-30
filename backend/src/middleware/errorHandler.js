const AppError = require('../utils/AppError');

const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(e => e.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const fields = err.errors.map(e => e.path).join(', ');
  const message = `Duplicate value for field(s): ${fields}. Please use another value!`;
  return new AppError(message, 400);
};

const handleSequelizeForeignKeyConstraintError = (err) => {
  const message = 'Referenced resource not found or cannot be deleted due to existing references.';
  return new AppError(message, 400);
};

const handleSequelizeDatabaseError = (err) => {
  // Handle invalid UUID format
  if (err.message && err.message.includes('invalid input syntax for type uuid')) {
    return new AppError('Invalid ID format', 400);
  }
  return new AppError('Database error occurred', 500);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    // Sequelize Validation Error
    if (err.name === 'SequelizeValidationError') {
      error = handleSequelizeValidationError(err);
    }

    // Sequelize Unique Constraint Error
    if (err.name === 'SequelizeUniqueConstraintError') {
      error = handleSequelizeUniqueConstraintError(err);
    }

    // Sequelize Foreign Key Constraint Error
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      error = handleSequelizeForeignKeyConstraintError(err);
    }

    // Sequelize Database Error (e.g., invalid UUID)
    if (err.name === 'SequelizeDatabaseError') {
      error = handleSequelizeDatabaseError(err);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};