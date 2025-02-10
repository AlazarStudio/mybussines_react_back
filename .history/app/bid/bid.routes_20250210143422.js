import express from 'express';
import {
  getBids,
  getBidById,
  createBid,
  updateBid,
  deleteBid,
} from '../controllers/bidController.js';

const router = express.Router();

// 🔹 Получить все заявки
router.get('/', getBids);

// 🔹 Получить одну заявку по ID
router.get('/:id', getBidById);

// 🔹 Создать новую заявку
router.post('/', createBid);

// 🔹 Обновить заявку
router.put('/:id', updateBid);

// 🔹 Удалить заявку
router.delete('/:id', deleteBid);

export default router;
