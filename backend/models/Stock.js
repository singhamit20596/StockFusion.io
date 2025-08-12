/**
 * Stock Model
 * Represents a stock holding in an account
 */
class Stock {
  constructor(data) {
    this.id = data.id;
    this.accountId = data.accountId;
    this.symbol = data.symbol;
    this.name = data.name;
    this.quantity = parseFloat(data.quantity) || 0;
    this.purchasePrice = parseFloat(data.purchasePrice) || 0;
    this.currentPrice = parseFloat(data.currentPrice) || data.purchasePrice || 0;
    this.purchaseDate = data.purchaseDate || new Date().toISOString();
    this.sector = data.sector || '';
    this.exchange = data.exchange || '';
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Calculate current value of the stock holding
   * @returns {number} - Current total value
   */
  getCurrentValue() {
    return this.quantity * this.currentPrice;
  }

  /**
   * Calculate initial investment value
   * @returns {number} - Initial investment value
   */
  getInitialValue() {
    return this.quantity * this.purchasePrice;
  }

  /**
   * Calculate gain/loss
   * @returns {Object} - Gain/loss information
   */
  getGainLoss() {
    const currentValue = this.getCurrentValue();
    const initialValue = this.getInitialValue();
    const absoluteGainLoss = currentValue - initialValue;
    const percentageGainLoss = initialValue > 0 ? (absoluteGainLoss / initialValue) * 100 : 0;

    return {
      absolute: absoluteGainLoss,
      percentage: percentageGainLoss,
      currentValue,
      initialValue
    };
  }

  /**
   * Validate stock data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    if (!this.accountId || typeof this.accountId !== 'string') {
      errors.push('Account ID is required');
    }

    if (!this.symbol || typeof this.symbol !== 'string' || this.symbol.trim().length === 0) {
      errors.push('Stock symbol is required and must be a non-empty string');
    }

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      errors.push('Stock name is required and must be a non-empty string');
    }

    if (this.quantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }

    if (this.purchasePrice < 0) {
      errors.push('Purchase price cannot be negative');
    }

    if (this.currentPrice < 0) {
      errors.push('Current price cannot be negative');
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
    const gainLoss = this.getGainLoss();
    
    return {
      id: this.id,
      accountId: this.accountId,
      symbol: this.symbol,
      name: this.name,
      quantity: this.quantity,
      purchasePrice: this.purchasePrice,
      currentPrice: this.currentPrice,
      purchaseDate: this.purchaseDate,
      sector: this.sector,
      exchange: this.exchange,
      currentValue: gainLoss.currentValue,
      initialValue: gainLoss.initialValue,
      gainLoss: {
        absolute: gainLoss.absolute,
        percentage: gainLoss.percentage
      },
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Stock;
