import { Router } from 'express';
import Course from '../models/course';
import Enrollment from '../models/enrollment';
import axios from 'axios';
import { google } from 'googleapis';
import { getClientForServiceAccount, getClientForUser } from '../lib/google';

const router = Router();

// Simple webhook receiver for Classroom push notifications (if configured)
router.post('/classroom', async (req, res) => {
  try {
    const body = req.body;
    // Google push notifications contain a 'message' field for Cloud Pub/Sub or notifications object
    // For now, store a minimal log and trigger a resync
    console.log('classroom webhook received', JSON.stringify(body).slice(0, 300));

    // Trigger immediate sync: fetch courses using service account or fallback
    let client = await getClientForServiceAccount();
    if (!client && body.userId) client = await getClientForUser(body.userId) as any;
    if (client) {
      const classroom = google.classroom({ version: 'v1', auth: client });
      const resp = await classroom.courses.list({ pageSize: 200 });
      const courses = resp.data.courses || [];
      // Upsert courses
      for (const c of courses) {
        await Course.updateOne({ googleId: c.id }, { $set: { googleId: c.id, name: c.name, section: c.section, description: c.description, teacherId: c.ownerId } }, { upsert: true });
        try {
          // Sync coursework and notify students
          const { syncCourseworkForCourse } = await import('../lib/sync');
          await syncCourseworkForCourse(client, c.id);
        } catch (err) {
          console.error('sync coursework failed for', c.id, err);
        }
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).json({ error: 'webhook handling failed' });
  }
});

export default router;


