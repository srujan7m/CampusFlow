const express = require('express');
const { admin } = require('../config/firebase');
const { COLLECTIONS, PAYMENT_STATUS } = require('../config/firestore-schema');
const { createOrder, verifyPaymentSignature } = require('../services/razorpay');

const router = express.Router();

/**
 * GET /api/registrations - List registrations (with optional eventId filter)
 */
router.get('/', async (req, res) => {
    try {
        const db = admin.firestore();
        const { eventId, userId } = req.query;

        let query = db.collection(COLLECTIONS.REGISTRATIONS);

        if (eventId) {
            query = query.where('eventId', '==', eventId);
        }

        if (userId) {
            query = query.where('userId', '==', userId);
        }

        const snapshot = await query.get();

        const registrations = [];
        snapshot.forEach(doc => {
            registrations.push({ id: doc.id, ...doc.data() });
        });

        res.json({ registrations });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

/**
 * POST /api/registrations - Create registration and payment order
 */
router.post('/', async (req, res) => {
    try {
        const db = admin.firestore();
        const { eventId, name, email, userId, answers } = req.body;

        // Get event
        const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = eventDoc.data();
        const amount = event.ticketPrice || 0;

        // Create registration
        const regRef = await db.collection(COLLECTIONS.REGISTRATIONS).add({
            eventId,
            userId: userId || '',
            name,
            email,
            answers: answers || {},
            eventName: event.name || '',
            eventDate: event.date || null,
            eventLocation: event.location || null,
            paymentStatus: PAYMENT_STATUS.PENDING,
            amount,
            registeredAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create Razorpay order
        const order = await createOrder(amount, regRef.id, {
            eventId,
            registrationId: regRef.id
        });

        // Update registration with order ID
        await regRef.update({
            razorpayOrderId: order.id
        });

        res.status(201).json({
            registrationId: regRef.id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ error: 'Failed to create registration' });
    }
});

/**
 * POST /api/registrations/verify-payment - Verify payment
 */
router.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Update registration
        const db = admin.firestore();
        const regsSnapshot = await db.collection(COLLECTIONS.REGISTRATIONS)
            .where('razorpayOrderId', '==', razorpay_order_id)
            .limit(1)
            .get();

        if (regsSnapshot.empty) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        const regDoc = regsSnapshot.docs[0];
        await regDoc.ref.update({
            paymentStatus: PAYMENT_STATUS.PAID,
            razorpayPaymentId: razorpay_payment_id,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

module.exports = router;
