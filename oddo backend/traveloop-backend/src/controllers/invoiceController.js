const db = require('../config/db');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

const verifyTripOwnership = async (tripId, userId) => {
  const result = await db.query(
    `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
    [tripId, userId]
  );
  return result.rows.length > 0;
};

const fetchInvoiceData = async (tripId) => {
  let invoiceRow = null;

  const invoiceCheck = await db.query(
    `SELECT * FROM invoices WHERE trip_id=$1`,
    [tripId]
  );

  if (invoiceCheck.rows.length === 0) {
    // Create invoice
    const subtotalRes = await db.query(
      `SELECT COALESCE(SUM(amount),0)::numeric AS subtotal FROM expenses WHERE trip_id=$1`,
      [tripId]
    );
    const subtotal = Number(subtotalRes.rows[0].subtotal);
    const tax_rate = 5.0;
    const tax_amount = (subtotal * tax_rate) / 100;
    const discount = 0;
    const grand_total = subtotal + tax_amount - discount;
    const invoice_number = generateInvoiceNumber();

    const inserted = await db.query(
      `INSERT INTO invoices (trip_id, invoice_number, subtotal, tax_rate, discount, grand_total)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tripId, invoice_number, subtotal, tax_rate, discount, grand_total]
    );
    invoiceRow = inserted.rows[0];
  } else {
    invoiceRow = invoiceCheck.rows[0];
  }

  const [lineItemsRes, tripUserRes] = await Promise.all([
    db.query(
      `SELECT description, category, expense_date, amount FROM expenses WHERE trip_id=$1 ORDER BY expense_date ASC`,
      [tripId]
    ),
    db.query(
      `SELECT t.title, t.start_date, t.end_date,
              u.first_name, u.last_name, u.email
       FROM trips t JOIN users u ON u.id=t.user_id WHERE t.id=$1`,
      [tripId]
    ),
  ]);

  const tripUser = tripUserRes.rows[0];

  return {
    invoice: invoiceRow,
    line_items: lineItemsRes.rows,
    trip: { title: tripUser.title, start_date: tripUser.start_date, end_date: tripUser.end_date },
    user: { first_name: tripUser.first_name, last_name: tripUser.last_name, email: tripUser.email },
  };
};

// GET /api/trips/:tripId/invoice
const getInvoice = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const data = await fetchInvoiceData(tripId);

    return res.status(200).json({
      success: true,
      data: {
        invoice: data.invoice,
        line_items: data.line_items,
        trip: data.trip,
        user: data.user,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/trips/:tripId/invoice/pdf
const getInvoicePDF = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const data = await fetchInvoiceData(tripId);

    generateInvoicePDF(
      {
        invoice_number: data.invoice.invoice_number,
        generated_date: data.invoice.generated_date,
        is_paid: data.invoice.is_paid,
        trip: data.trip,
        user: data.user,
        line_items: data.line_items,
        subtotal: data.invoice.subtotal,
        tax_rate: data.invoice.tax_rate,
        discount: data.invoice.discount,
        grand_total: data.invoice.grand_total,
      },
      res
    );
  } catch (err) {
    next(err);
  }
};

// PATCH /api/trips/:tripId/invoice/pay
const markPaid = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const result = await db.query(
      `UPDATE invoices SET is_paid=true WHERE trip_id=$1 RETURNING *`,
      [tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Generate invoice first' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInvoice, getInvoicePDF, markPaid };
