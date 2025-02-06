import express from 'express';
import {
  createNewService,
  deleteService,
  getServices,
  getOneService,
  updateService,
} from './service.controller.js';

const router = express.Router();

router.route('/').post(createNewService).get(getServices);
router.route('/:id').get(getOneService).put(updateService).delete(deleteService);

export default router;
