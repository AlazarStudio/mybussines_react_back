import express from 'express';
import {
  createNewForm,
  deleteForm,
  getForms,
  getOneForm,
  updateForm,
} from './form.controller.js';

const router = express.Router();

router.route('/').post(createNewForm).get(getForms);
router.route('/:id').get(getOneForm).put(updateForm).delete(deleteForm);

export default router;