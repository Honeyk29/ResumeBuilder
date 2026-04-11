import express from 'express';
import { createResume, getMyResumes, getResumeById, updateResume, deleteResume, generateLatexPDF } from '../controllers/resumeController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:id/pdf', protect, generateLatexPDF);

router.route('/')
  .post(protect, createResume)
  .get(protect, getMyResumes);

router.route('/:id')
  .get(protect, getResumeById)
  .put(protect, updateResume)
  .delete(protect, deleteResume);

export default router;
