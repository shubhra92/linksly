import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { isValidUrl, formatUrl } from '../lib/utils.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Linksly URL Shortener API',
      version: '1.0.0',
      description: 'A powerful URL shortener with analytics',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/server/api.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Validation schemas
const createLinkSchema = z.object({
  originalUrl: z.string().url(),
  customAlias: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Link:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         originalUrl:
 *           type: string
 *         shortCode:
 *           type: string
 *         customAlias:
 *           type: string
 *         title:
 *           type: string
 *         totalClicks:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/links:
 *   post:
 *     summary: Create a new short link
 *     tags: [Links]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *               customAlias:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 */
app.post('/api/links', async (req, res) => {
  try {
    const { originalUrl, customAlias, title, description, expiresAt } = createLinkSchema.parse(req.body);
    
    const formattedUrl = formatUrl(originalUrl);
    
    if (!isValidUrl(formattedUrl)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    let shortCode = customAlias || nanoid(8);
    
    // Check if custom alias already exists
    if (customAlias) {
      const existing = await prisma.link.findUnique({
        where: { customAlias }
      });
      if (existing) {
        return res.status(400).json({ error: 'Custom alias already exists' });
      }
    }

    const link = await prisma.link.create({
      data: {
        originalUrl: formattedUrl,
        shortCode,
        customAlias,
        title,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    res.status(201).json(link);
  } catch (error) {
    console.error('Error creating link:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/links:
 *   get:
 *     summary: Get all links with pagination
 *     tags: [Links]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of links
 */
app.get('/api/links', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { clicks: true }
          }
        }
      }),
      prisma.link.count()
    ]);

    res.json({
      links,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/links/{id}:
 *   get:
 *     summary: Get link details
 *     tags: [Links]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Link details
 */
app.get('/api/links/:id', async (req, res) => {
  try {
    const link = await prisma.link.findUnique({
      where: { id: req.params.id },
      include: {
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(link);
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/links/{id}/qr:
 *   get:
 *     summary: Generate QR code for a link
 *     tags: [Links]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code image
 */
app.get('/api/links/:id/qr', async (req, res) => {
  try {
    const link = await prisma.link.findUnique({
      where: { id: req.params.id }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const shortUrl = `${req.protocol}://${req.get('host')}/s/${link.shortCode}`;
    const qrCode = await QRCode.toDataURL(shortUrl);

    res.json({ qrCode });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /s/{shortCode}:
 *   get:
 *     summary: Redirect to original URL
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to original URL
 */
app.get('/s/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const link = await prisma.link.findFirst({
      where: {
        OR: [
          { shortCode },
          { customAlias: shortCode }
        ],
        isActive: true
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Check if link has expired
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    // Record click analytics
    await Promise.all([
      prisma.click.create({
        data: {
          linkId: link.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer'),
        }
      }),
      prisma.link.update({
        where: { id: link.id },
        data: { totalClicks: { increment: 1 } }
      })
    ]);

    res.redirect(link.originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics overview
 */
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const [totalLinks, totalClicks, recentClicks] = await Promise.all([
      prisma.link.count(),
      prisma.click.count(),
      prisma.click.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    // Get top links
    const topLinks = await prisma.link.findMany({
      take: 5,
      orderBy: { totalClicks: 'desc' },
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        totalClicks: true,
        title: true
      }
    });

    // Get clicks over time (last 7 days)
    const clicksOverTime = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as clicks
      FROM clicks 
      WHERE createdAt >= datetime('now', '-7 days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    res.json({
      totalLinks,
      totalClicks,
      recentClicks,
      topLinks,
      clicksOverTime
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
});

export default app;