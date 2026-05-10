const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getInvoice, getInvoicePDF, markPaid } = require('../controllers/invoiceController');

const router = express.Router({ mergeParams: true });

router.get('/', verifyToken, getInvoice);
router.get('/pdf', verifyToken, getInvoicePDF);
router.patch('/pay', verifyToken, markPaid);

module.exports = router;
