/**
 * Portfolio Model
 * Represents a collection of accounts grouped together
 */
class Portfolio {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.riskLevel = data.riskLevel || 'medium'; // 'low', 'medium', 'high'
    this.targetReturn = parseFloat(data.targetReturn) || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Validate portfolio data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      errors.push('Portfolio name is required and must be a non-empty string');
    }

    if (this.riskLevel && !['low', 'medium', 'high'].includes(this.riskLevel)) {
      errors.push('Risk level must be one of: low, medium, high');
    }

    if (this.targetReturn < 0) {
      errors.push('Target return cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON-safe object
   * @returns {Object} - Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      riskLevel: this.riskLevel,
      targetReturn: this.targetReturn,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Portfolio;
