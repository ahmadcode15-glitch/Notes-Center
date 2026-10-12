import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

const router = Router();

// Ensure uploads directory exists (use /tmp on serverless environments like Vercel)
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create upload directory:', err);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit
  },
});

// Admin File Upload Endpoint
router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const fileSizeKb = Math.round(req.file.size / 1024);

      // Record audit activity
      await recordActivity({
        userId: req.user?.id,
        username: req.user?.username,
        action: 'FILE_UPLOADED',
        details: `Uploaded file '${req.file.originalname}' (${fileSizeKb} KB, type: ${req.file.mimetype}).`,
        req,
      });

      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        file: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          sizeKb: fileSizeKb,
        },
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      return res.status(500).json({ success: false, message: err.message || 'File upload failed.' });
    }
  }
);

export default router;

