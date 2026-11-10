import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import { recordActivity } from '../utils/audit';

const router = Router();

// Configure memory storage (Zero disk dependency for 100% Vercel & serverless compatibility)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit per file
  },
});

// 1. Upload File or Multiple Files (Stores permanently in PostgreSQL database)
router.post(
  '/',
  authenticate,
  upload.any(),
  async (req: AuthRequest, res: Response) => {
    try {
      const rawFiles = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      if (!rawFiles || rawFiles.length === 0) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const savedFiles: any[] = [];

      for (const file of rawFiles) {
        const ext = path.extname(file.originalname);
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueFilename = `${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
        const base64Data = file.buffer.toString('base64');
        const fileSizeKb = Math.round(file.size / 1024);

        // Save permanently in database
        const fileRecord = await prisma.uploadedFile.create({
          data: {
            filename: uniqueFilename,
            originalName: file.originalname,
            mimetype: file.mimetype || 'application/octet-stream',
            size: file.size,
            data: base64Data,
            createdById: req.user?.id,
          },
        });

        const fileUrl = `/api/upload/file/${fileRecord.id}`;
        const dataUrl = file.mimetype.startsWith('image/')
          ? `data:${file.mimetype};base64,${base64Data}`
          : null;

        savedFiles.push({
          id: fileRecord.id,
          url: fileUrl,
          dataUrl,
          filename: fileRecord.filename,
          originalName: fileRecord.originalName,
          mimetype: fileRecord.mimetype,
          size: fileRecord.size,
          sizeKb: fileSizeKb,
        });

        // Record audit activity
        await recordActivity({
          userId: req.user?.id,
          username: req.user?.username,
          action: 'FILE_UPLOADED',
          details: `Uploaded file '${file.originalname}' (${fileSizeKb} KB, type: ${file.mimetype}).`,
          req,
        }).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: savedFiles.length === 1 ? 'File uploaded and secured permanently.' : `${savedFiles.length} files uploaded and secured permanently.`,
        file: savedFiles[0],
        files: savedFiles,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      return res.status(500).json({ success: false, message: err.message || 'File upload failed.' });
    }
  }
);

// 2. Stream / View File by ID or filename (Publicly accessible for embedded images, documents, and PDFs)
router.get('/file/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let fileRecord = await prisma.uploadedFile.findUnique({
      where: { id },
    }).catch(() => null);

    if (!fileRecord) {
      fileRecord = await prisma.uploadedFile.findFirst({
        where: { filename: id },
      }).catch(() => null);
    }

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

// 3. Fallback: Lookup by filename or ID
router.get('/raw/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    let fileRecord = await prisma.uploadedFile.findFirst({
      where: { filename },
    }).catch(() => null);

    if (!fileRecord) {
      fileRecord = await prisma.uploadedFile.findUnique({
        where: { id: filename },
      }).catch(() => null);
    }

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
