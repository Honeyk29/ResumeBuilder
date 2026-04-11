import express from 'express';
import { createTemplate, getTemplates, getActiveTemplates, updateTemplate, deleteTemplate } from '../controllers/templateController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, adminOnly, createTemplate)
  .get(protect, adminOnly, getTemplates);

router.get('/active', getActiveTemplates); // Public or users can view

router.route('/:id')
  .put(protect, adminOnly, updateTemplate)
  .delete(protect, adminOnly, deleteTemplate);

export default router;
