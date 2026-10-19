import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../db/prisma';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

const router = Router();

// Configure memory storage (Zero disk dependency for 100% Vercel & serverless compatibility)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB max limit
  },
});

// 1. Upload File (Stores permanently in PostgreSQL database)
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

      const ext = path.extname(req.file.originalname);
      const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const base64Data = req.file.buffer.toString('base64');
      const fileSizeKb = Math.round(req.file.size / 1024);

      // Save permanently in database
      const fileRecord = await prisma.uploadedFile.create({
        data: {
          filename: uniqueFilename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype || 'application/octet-stream',
          size: req.file.size,
          data: base64Data,
          createdById: req.user?.id,
        },
      });

      const fileUrl = `/api/upload/file/${fileRecord.id}`;
      const dataUrl = req.file.mimetype.startsWith('image/')
        ? `data:${req.file.mimetype};base64,${base64Data}`
        : null;

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
        message: 'File uploaded and secured permanently.',
        file: {
          id: fileRecord.id,
          url: fileUrl,
          dataUrl,
          filename: fileRecord.filename,
          originalName: fileRecord.originalName,
          mimetype: fileRecord.mimetype,
          size: fileRecord.size,
          sizeKb: fileSizeKb,
        },
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      return res.status(500).json({ success: false, message: err.message || 'File upload failed.' });
    }
  }
);

// 2. Stream / View File by ID (Publicly accessible for embedded images, documents, and PDFs)
router.get('/file/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fileRecord = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      return res.status(404).send('File not found');
    }

    const buffer = Buffer.from(fileRecord.data, 'base64');
    res.setHeader('Content-Type', fileRecord.mimetype || 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileRecord.originalName)}"`);

    return res.send(buffer);
  } catch (err: any) {
    console.error('File stream error:', err);
    return res.status(500).send('Failed to serve file');
  }
});

// 3. Fallback: Lookup by filename
router.get('/raw/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const fileRecord = await prisma.uploadedFile.findFirst({
      where: { filename },
    });

    if (!fileRecord) {
      return res.status(404).send('File not found');
    }

    const buffer = Buffer.from(fileRecord.data, 'base64');
    res.setHeader('Content-Type', fileRecord.mimetype || 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileRecord.originalName)}"`);

    return res.send(buffer);
  } catch (err: any) {
    console.error('File raw stream error:', err);
    return res.status(500).send('Failed to serve file');
  }
});

export default router;
