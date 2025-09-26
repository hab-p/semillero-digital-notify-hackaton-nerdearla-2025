import { google } from 'googleapis';
import { getClientForServiceAccount } from './lib/google';
import Course from './models/course';
import { syncCourseworkForCourse } from './lib/sync';

export async function pollAndSync() {
  try {
    const client = await getClientForServiceAccount();
    if (!client) return;
    const classroom = google.classroom({ version: 'v1', auth: client });
    const resp = await classroom.courses.list({ pageSize: 200 });
    const courses = resp.data.courses || [];
    for (const c of courses) {
      await Course.updateOne({ googleId: c.id }, { $set: { googleId: c.id, name: c.name, section: c.section, description: c.description, teacherId: c.ownerId } }, { upsert: true });
      // Sync coursework and notify students for new assignments
      try {
        await syncCourseworkForCourse(client, c.id);
      } catch (err) {
        console.error('sync coursework failed for', c.id, err);
      }
    }
  } catch (err) {
    console.error('poll error', err);
  }
}


