const express = require('express');
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/notesController');

const router = express.Router({ mergeParams: true });

router.get('/', verifyToken, getNotes);

router.post(
  '/',
  verifyToken,
  [
    body('content').notEmpty().trim().withMessage('content is required'),
    body('stop_id').optional().isInt().withMessage('stop_id must be an integer'),
  ],
  handleValidationErrors,
  createNote
);

router.put('/:noteId', verifyToken, updateNote);
router.delete('/:noteId', verifyToken, deleteNote);

module.exports = router;
