const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subfolders based on file type
    let uploadPath = uploadDir;
    
    if (file.fieldname === 'profile') {
      uploadPath = path.join(uploadDir, 'profiles');
    } else if (file.fieldname === 'images' || file.fieldname === 'product') {
      uploadPath = path.join(uploadDir, 'products');
    } else {
      uploadPath = path.join(uploadDir, 'misc');
    }

    // Create subfolder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// File filter - allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, GIF, WEBP and SVG images are allowed.', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10 // Max 10 files per request
  }
});

// Error handling wrapper for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Max size is 5MB.', 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Max 10 files allowed.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field name for file upload.', 400));
    }
    return next(new AppError(err.message, 400));
  } else if (err) {
    return next(err);
  }
  next();
};

// Custom upload functions for different use cases
const uploadMiddleware = {
  // Single file upload
  single: (fieldName) => {
    return (req, res, next) => {
      const singleUpload = upload.single(fieldName);
      singleUpload(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  },

  // Multiple files upload (same field name)
  array: (fieldName, maxCount) => {
    return (req, res, next) => {
      const arrayUpload = upload.array(fieldName, maxCount);
      arrayUpload(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  },

  // Multiple fields upload
  fields: (fieldsConfig) => {
    return (req, res, next) => {
      const fieldsUpload = upload.fields(fieldsConfig);
      fieldsUpload(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  },

  // Any files upload
  any: () => {
    return (req, res, next) => {
      const anyUpload = upload.any();
      anyUpload(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  }
};

// Clean up old files utility (optional)
uploadMiddleware.cleanOldFiles = async (hours = 24) => {
  const cleanup = async (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60); // hours
      
      if (fileAge > hours) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${filePath}`);
      }
    }
  };

  // Clean up all upload subdirectories
  const dirs = [
    path.join(uploadDir, 'profiles'),
    path.join(uploadDir, 'products'),
    path.join(uploadDir, 'misc')
  ];

  for (const dir of dirs) {
    await cleanup(dir);
  }
};

// Get file info utility
uploadMiddleware.getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${file.filename}`, // URL to access the file
    fieldname: file.fieldname
  };
};

// Validate image dimensions (optional)
uploadMiddleware.validateDimensions = (req, res, next) => {
  const sharp = require('sharp');
  
  const files = req.files || (req.file ? [req.file] : []);
  const validationPromises = files.map(async (file) => {
    try {
      const metadata = await sharp(file.path).metadata();
      
      // Add dimension info to file object
      file.width = metadata.width;
      file.height = metadata.height;
      
      // Optional: Validate minimum dimensions
      if (file.fieldname === 'profile' && (metadata.width < 100 || metadata.height < 100)) {
        throw new AppError('Profile image must be at least 100x100 pixels', 400);
      }
      
      if (file.fieldname === 'images' && (metadata.width < 300 || metadata.height < 300)) {
        throw new AppError('Product image must be at least 300x300 pixels', 400);
      }
      
    } catch (error) {
      throw new AppError(`Error processing image: ${error.message}`, 400);
    }
  });

  Promise.all(validationPromises)
    .then(() => next())
    .catch(err => next(err));
};

module.exports = uploadMiddleware;