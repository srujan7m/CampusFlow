const express = require('express');
const { admin } = require('../config/firebase');
const { COLLECTIONS } = require('../config/firestore-schema');
const { ingestDocument } = require('../services/ingestion');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/events - List all events
 */
router.get('/', async (req, res) => {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection(COLLECTIONS.EVENTS).get();

        const events = [];
        snapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Fetched ${events.length} events`);
        res.json({ events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

/**
 * GET /api/events/:id - Get event by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const db = admin.firestore();
        const doc = await db.collection(COLLECTIONS.EVENTS).doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

/**
 * POST /api/events - Create new event
 */
router.post('/', async (req, res) => {
    try {
        console.log('Received create event request:', req.body);
        const db = admin.firestore();
        // Accept both userId and organizerId for backwards compatibility
        const {
            name,
            description,
            location,
            address,
            lat,
            lng,
            date,
            ticketPrice,
            organizerId,
            userId,
            organizerTelegramChatId,
            telegramChatId,
            formSchema
        } = req.body;

        // Use userId if provided, otherwise fall back to organizerId
        const actualOrganizerId = userId || organizerId;

        // Validate required fields
        if (!actualOrganizerId) {
            console.error('Missing userId or organizerId');
            return res.status(400).json({
                error: 'Missing required field: userId or organizerId'
            });
        }

        // Validate date
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            console.error('Invalid date:', date);
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Generate unique event code
        const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Build location object according to Firestore schema
        // Schema expects: location: { lat: number, lng: number, address: string }
        let locationData;
        if (location && typeof location === 'object') {
            // If location is already an object, use it
            locationData = location;
        } else {
            // Build location object from separate fields
            locationData = {
                address: address || location || '',
                lat: lat || 0,
                lng: lng || 0
            };
        }

        const eventData = {
            name,
            description,
            eventCode,
            organizerId: actualOrganizerId,
            organizerTelegramChatId: telegramChatId || organizerTelegramChatId || null,
            location: locationData,
            date: admin.firestore.Timestamp.fromDate(eventDate),
            ticketPrice: ticketPrice || 0,
            indoorMapUrl: null,
            indoorMapPOIs: [],
            formSchema: formSchema || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection(COLLECTIONS.EVENTS).add(eventData);

        res.status(201).json({ id: docRef.id, code: eventCode, ...eventData });
    } catch (error) {
        console.error('Error creating event:', error);
        console.error('Request body:', req.body);
        res.status(500).json({ error: 'Failed to create event', details: error.message });
    }
});

/**
 * PUT /api/events/:id - Update event
 */
router.put('/:id', async (req, res) => {
    try {
        const db = admin.firestore();
        const { name, description, location, date, ticketPrice, organizerTelegramChatId, formSchema } = req.body;

        const updateData = {
            ...(name && { name }),
            ...(description && { description }),
            ...(location && { location }),
            ...(date && { date: admin.firestore.Timestamp.fromDate(new Date(date)) }),
            ...(ticketPrice !== undefined && { ticketPrice }),
            ...(organizerTelegramChatId !== undefined && { organizerTelegramChatId }),
            ...(formSchema && { formSchema }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(COLLECTIONS.EVENTS).doc(req.params.id).update(updateData);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

/**
 * POST /api/events/:id/documents - Upload and process document
 */
router.post('/:id/documents', upload.single('file'), async (req, res) => {
    try {
        const db = admin.firestore();
        const eventId = req.params.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const storageFilename = `events/${eventId}/documents/${Date.now()}_${file.originalname}`;
        const fileRef = bucket.file(storageFilename);

        await fileRef.save(file.buffer, {
            metadata: {
                contentType: file.mimetype
            }
        });

        const storageUrl = await fileRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        });

        // Create document record
        const docRef = await db.collection(COLLECTIONS.EVENTS).doc(eventId)
            .collection('documents').add({
                filename: file.originalname,
                storageUrl: storageUrl[0],
                uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedAt: null,
                chunkCount: 0
            });

        // Process document asynchronously (in production, use background worker)
        ingestDocument(eventId, docRef.id, file.buffer, file.originalname)
            .catch(error => console.error('Document processing error:', error));

        res.status(201).json({
            id: docRef.id,
            message: 'Document uploaded. Processing in background...'
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

/**
 * POST /api/events/:id/indoor-map - Upload indoor map
 */
router.post('/:id/indoor-map', upload.single('file'), async (req, res) => {
    try {
        const db = admin.firestore();
        const eventId = req.params.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const storageFilename = `events/${eventId}/indoor-maps/${Date.now()}_${file.originalname}`;
        const fileRef = bucket.file(storageFilename);

        await fileRef.save(file.buffer, {
            metadata: {
                contentType: file.mimetype
            }
        });

        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFilename}`;

        // Update event with indoor map URL
        await db.collection(COLLECTIONS.EVENTS).doc(eventId).update({
            indoorMapUrl: publicUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ indoorMapUrl: publicUrl });
    } catch (error) {
        console.error('Error uploading indoor map:', error);
        res.status(500).json({ error: 'Failed to upload indoor map' });
    }
});

/**
 * PUT /api/events/:id/pois - Update POIs for indoor map
 */
router.put('/:id/pois', async (req, res) => {
    try {
        const db = admin.firestore();
        const { pois } = req.body;

        await db.collection(COLLECTIONS.EVENTS).doc(req.params.id).update({
            indoorMapPOIs: pois,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating POIs:', error);
        res.status(500).json({ error: 'Failed to update POIs' });
    }
});

module.exports = router;
