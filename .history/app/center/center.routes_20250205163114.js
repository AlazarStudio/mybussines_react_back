import express from 'express';
import {
  createNewCenter,
  deleteCenter,
  getCenters,
  getOneCenter,
  updateCenter,
} from './center.controller.js';

const router = express.Router();

router.route('/').post(createNewCenter).get(getCenters);
router.route('/:id').get(getOneCenter).put(updateCenter).delete(deleteCenter);

export default router;
