import express from 'express';
import {
  createTypeSupport,
  deleteTypeSupport,
  getTypeSupports,
  getOneTypeSupport,
  updateTypeSupport,
} from './typeSupport.controller.js';

const router = express.Router();

router.route('/').post(createTypeSupport).get(getTypeSupports);
router
  .route('/:id')
  .get(getOneTypeSupport)
  .put(updateTypeSupport)
  .delete(deleteTypeSupport);

export default router;
