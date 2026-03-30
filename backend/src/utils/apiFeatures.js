const { Op } = require('sequelize');

/**
 * APIFeatures - Sequelize-compatible query builder
 * 
 * Builds filter, sort, and pagination options from query string parameters.
 * Usage: 
 *   const features = new APIFeatures(req.query);
 *   const { where, order, limit, offset } = features.build();
 */
class APIFeatures {
  constructor(queryString) {
    this.queryString = queryString;
    this.filterConditions = {};
    this.sortOrder = [['createdAt', 'DESC']];
    this.limitValue = 10;
    this.offsetValue = 0;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'q'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Build Sequelize-compatible filter conditions
    const conditions = {};

    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === 'object' && value !== null) {
        // Handle advanced filters like { gte: 100, lte: 500 }
        const opMap = {
          gte: Op.gte,
          gt: Op.gt,
          lte: Op.lte,
          lt: Op.lt,
          ne: Op.ne,
          in: Op.in,
        };

        const condition = {};
        for (const [opKey, opValue] of Object.entries(value)) {
          if (opMap[opKey]) {
            condition[opMap[opKey]] = opValue;
          }
        }
        if (Object.keys(condition).length > 0) {
          conditions[key] = condition;
        }
      } else {
        conditions[key] = value;
      }
    }

    this.filterConditions = conditions;
    return this;
  }

  search() {
    const searchTerm = this.queryString.search || this.queryString.q;
    if (searchTerm) {
      this.filterConditions[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } },
        { brand: { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortFields = this.queryString.sort.split(',');
      this.sortOrder = sortFields.map(field => {
        if (field.startsWith('-')) {
          return [field.slice(1), 'DESC'];
        }
        return [field, 'ASC'];
      });
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    this.limitValue = limit;
    this.offsetValue = (page - 1) * limit;
    return this;
  }

  build() {
    return {
      where: this.filterConditions,
      order: this.sortOrder,
      limit: this.limitValue,
      offset: this.offsetValue,
    };
  }
}

module.exports = APIFeatures;