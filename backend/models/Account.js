/**
 * Account Model
 * Represents a user's investment account
 */
class Account {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type; // 'savings', 'checking', 'investment', 'retirement', 'brokerage', 'trading'
    this.balance = parseFloat(data.balance) || 0;
    this.currency = data.currency || 'USD';
    this.description = data.description || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Validate account data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      errors.push('Account name is required and must be a non-empty string');
    }

    if (!this.type || !['savings', 'checking', 'investment', 'retirement', 'brokerage', 'trading'].includes(this.type)) {
      errors.push('Account type must be one of: savings, checking, investment, retirement, brokerage, trading');
    }

    if (this.balance < 0) {
      errors.push('Account balance cannot be negative');
    }

    if (this.currency && typeof this.currency !== 'string') {
      errors.push('Currency must be a string');
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
      type: this.type,
      balance: this.balance,
      currency: this.currency,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Account;
