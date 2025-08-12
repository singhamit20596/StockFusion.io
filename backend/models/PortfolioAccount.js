/**
 * PortfolioAccount Model
 * Links portfolios to accounts (many-to-many relationship)
 */
class PortfolioAccount {
  constructor(data) {
    this.id = data.id;
    this.portfolioId = data.portfolioId;
    this.accountId = data.accountId;
    this.weight = parseFloat(data.weight) || 0; // Percentage weight in portfolio (0-100)
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Validate portfolio account link data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    if (!this.portfolioId || typeof this.portfolioId !== 'string') {
      errors.push('Portfolio ID is required');
    }

    if (!this.accountId || typeof this.accountId !== 'string') {
      errors.push('Account ID is required');
    }

    if (this.weight < 0 || this.weight > 100) {
      errors.push('Weight must be between 0 and 100');
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
      portfolioId: this.portfolioId,
      accountId: this.accountId,
      weight: this.weight,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = PortfolioAccount;
