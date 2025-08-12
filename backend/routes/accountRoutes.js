const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// Account routes
router.get('/accounts', accountController.getAllAccounts);
router.get('/accounts/:id', accountController.getAccountById);
router.post('/accounts', accountController.createAccount);
router.put('/accounts/:id', accountController.updateAccount);
router.delete('/accounts/:id', accountController.deleteAccount);
router.get('/accounts/:id/summary', accountController.getAccountSummary);

// Sync routes
router.post('/accounts/:id/sync', accountController.syncWithGroww);
router.get('/accounts/:id/sync/status', accountController.getSyncStatus);
router.delete('/accounts/:id/sync', accountController.clearSyncData);

module.exports = router;
