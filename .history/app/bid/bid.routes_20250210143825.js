import express from 'express';
import {
  createSupport,
  deleteSupport,
  getOneSupport,
  getBids,
  updateSupport,
} from './support.controller.js';

const router = express.Router();

router.route('/').post(createSupport).get(getSupports);
router.route('/:id').get(getOneSupport).put(updateSupport).delete(deleteSupport);

export default router;
