import { Router } from 'express';
import { google, classroom_v1 } from 'googleapis';
import { getClientForUser, getClientForServiceAccount } from '../lib/google';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));

async function listCoursesWithClient(authClient: any) {
  const classroom = google.classroom({ version: 'v1', auth: authClient });
  const resp = await classroom.courses.list({ pageSize: 200 });
  return resp.data.courses || [];
}

router.get('/courses', async (req, res) => {
  try {
    // Prefer service account for cross-domain sync
    let client = await getClientForServiceAccount();
    if (client) {
      const courses = await listCoursesWithClient(client);
      return res.json({ courses });
    }

    // Fallback: if userId supplied, use user tokens
    const userId = req.query.userId as string;
    if (userId) {
      client = await getClientForUser(userId);
      if (client) {
        const courses = await listCoursesWithClient(client);
        return res.json({ courses });
      }
    }

    return res.status(400).json({ error: 'no credentials available' });
  } catch (err) {
    console.error('courses error', err);
    return res.status(500).json({ error: 'failed to list courses' });
  }
});

router.get('/courses/:courseId/roster', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    let client = await getClientForServiceAccount();
    if (!client) {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      client = await getClientForUser(userId) as any;
    }

    const classroom = google.classroom({ version: 'v1', auth: client });
    const resp = await classroom.courses.students.list({ courseId });
    return res.json({ students: resp.data.students || [] });
  } catch (err) {
    console.error('roster error', err);
    return res.status(500).json({ error: 'failed to get roster' });
  }
});

router.get('/courses/:courseId/assignments', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    let client = await getClientForServiceAccount();
    if (!client) {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      client = await getClientForUser(userId) as any;
    }

    const classroom = google.classroom({ version: 'v1', auth: client });
    const resp = await classroom.courses.courseWork.list({ courseId });
    return res.json({ coursework: resp.data.courseWork || [] });
  } catch (err) {
    console.error('assignments error', err);
    return res.status(500).json({ error: 'failed to get assignments' });
  }
});

export default router;


