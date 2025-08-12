const fs = require('fs').promises;
const path = require('path');

/**
 * Utility functions for safely reading and writing JSON files
 */
class FileService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
  }

  /**
   * Safely read JSON file
   * @param {string} filename - Name of the JSON file
   * @returns {Promise<Object>} - Parsed JSON data
   */
  async readJsonFile(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty structure
        console.log(`File ${filename} doesn't exist, creating with empty structure`);
        await this.writeJsonFile(filename, this.getDefaultStructure(filename));
        return this.getDefaultStructure(filename);
      }
      throw new Error(`Error reading ${filename}: ${error.message}`);
    }
  }

  /**
   * Safely write JSON file
   * @param {string} filename - Name of the JSON file
   * @param {Object} data - Data to write
   * @returns {Promise<void>}
   */
  async writeJsonFile(filename, data) {
    try {
      const filePath = path.join(this.dataDir, filename);
      
      // Ensure directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Write file with proper formatting
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Error writing ${filename}: ${error.message}`);
    }
  }

  /**
   * Get default structure for different file types
   * @param {string} filename - Name of the file
   * @returns {Object} - Default structure
   */
  getDefaultStructure(filename) {
    const structures = {
      'accounts.json': [],
      'stocks.json': [],
      'portfolios.json': [],
      'portfolio_accounts.json': []
    };
    
    return structures[filename] || [];
  }

  /**
   * Generate unique ID
   * @returns {string} - Unique ID
   */
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Safely update an item in a JSON array by ID
   * @param {string} filename - JSON file name
   * @param {string} id - ID of item to update
   * @param {Object} updatedData - New data
   * @returns {Promise<Object>} - Updated item
   */
  async updateById(filename, id, updatedData) {
    const data = await this.readJsonFile(filename);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with ID ${id} not found`);
    }
    
    data[index] = { ...data[index], ...updatedData, id };
    await this.writeJsonFile(filename, data);
    return data[index];
  }

  /**
   * Safely delete an item from JSON array by ID
   * @param {string} filename - JSON file name
   * @param {string} id - ID of item to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteById(filename, id) {
    const data = await this.readJsonFile(filename);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with ID ${id} not found`);
    }
    
    data.splice(index, 1);
    await this.writeJsonFile(filename, data);
    return true;
  }

  /**
   * Add new item to JSON array
   * @param {string} filename - JSON file name
   * @param {Object} newItem - Item to add
   * @returns {Promise<Object>} - Added item with ID
   */
  async addItem(filename, newItem) {
    const data = await this.readJsonFile(filename);
    const itemWithId = { ...newItem, id: this.generateId(), createdAt: new Date().toISOString() };
    data.push(itemWithId);
    await this.writeJsonFile(filename, data);
    return itemWithId;
  }

  /**
   * Find items by criteria
   * @param {string} filename - JSON file name
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} - Matching items
   */
  async findBy(filename, criteria) {
    const data = await this.readJsonFile(filename);
    return data.filter(item => {
      return Object.keys(criteria).every(key => item[key] === criteria[key]);
    });
  }

  /**
   * Find single item by ID
   * @param {string} filename - JSON file name
   * @param {string} id - ID to search for
   * @returns {Promise<Object|null>} - Found item or null
   */
  async findById(filename, id) {
    const data = await this.readJsonFile(filename);
    return data.find(item => item.id === id) || null;
  }
}

module.exports = new FileService();
