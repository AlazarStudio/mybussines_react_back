import express from 'express';
import {
  createMap,
  deleteMap,
  getMaps,
  getOneMap,
  updateMap,
} from './map.controller.js';

const router = express.Router();

router.route('/').post(createMap).get(getMaps);
router.route('/:id').get(getOneMap).put(updateMap).delete(deleteMap);

export default router;
