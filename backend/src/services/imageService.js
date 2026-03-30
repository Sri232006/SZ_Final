const cloudinary = require('cloudinary').v2;
const config = require('../config/env');

cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
});

class ImageService {
  async uploadImage(file, folder = 'products') {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `e-clothing/${folder}`,
        use_filename: true,
        unique_filename: true,
      });

      return result.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  async uploadMultipleImages(files, folder = 'products') {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Multiple images upload error:', error);
      throw new Error('Failed to upload images');
    }
  }

  async deleteImage(imageUrl) {
    try {
      const publicId = this.extractPublicId(imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      // Don't throw error as this is not critical
    }
  }

  extractPublicId(imageUrl) {
    try {
      const urlParts = imageUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const publicId = lastPart.split('.')[0];
      return `e-clothing/products/${publicId}`;
    } catch (error) {
      return null;
    }
  }

  getOptimizedUrl(imageUrl, options = {}) {
    try {
      const { width, height, quality = 80 } = options;
      return cloudinary.url(imageUrl, {
        width,
        height,
        quality,
        crop: 'fill',
        fetch_format: 'auto',
      });
    } catch (error) {
      return imageUrl;
    }
  }
}

module.exports = new ImageService();