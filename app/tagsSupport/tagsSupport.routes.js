import express from 'express';
import {
  createTagsSupport,
  deleteTagsSupport,
  getTagsSupports,
  getOneTagsSupport,
  updateTagsSupport,
} from './tagsSupport.controller.js';

const router = express.Router();

router.route('/').post(createTagsSupport).get(getTagsSupports);
router.route('/:id').get(getOneTagsSupport).put(updateTagsSupport).delete(deleteTagsSupport);

export default router;
