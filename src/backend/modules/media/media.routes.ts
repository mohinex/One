import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.ts";
import { uploadLimiter } from "../../middlewares/rateLimiters.ts";
import { upload } from "../../middlewares/upload.ts";
import * as mediaController from "./media.controller.ts";

const router = Router();

router.post(
  "/upload",
  authenticate as any,
  uploadLimiter,
  upload.single("file"),
  mediaController.uploadMedia
);

router.delete("/:id", authenticate as any, mediaController.deleteMedia);
router.get("/", authenticate as any, mediaController.listMedia);

export default router;
