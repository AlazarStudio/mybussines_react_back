import express from 'express';

// import { protect } from '../middleware/auth.middleware.js';

import {
  createNewNews,
  deleteNews,
  getNews,
  getOneNews,
  updateNews,
} from './news.controller.js';

const router = express.Router();

router.route('/').post(createNewNews).get(getNews);

router.route('/:id').get(getOneNews).put(updateNews).delete(deleteNews);

export default router;
