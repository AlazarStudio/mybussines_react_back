import express from "express";
import {
  createBid,
  deleteBid,
  getBidById,
  getBids,
  updateBid,
} from "./bid.controller.js"; // Подключаем контроллер

const router = express.Router();

// 🔹 Создать новую заявку / Получить список заявок (с пагинацией и фильтрацией)
router.route("/").post(createBid).get(getBids);

// 🔹 Получить, обновить или удалить заявку по ID
router.route("/:id").get(getBidById).put(updateBid).delete(deleteBid);

export default router;
