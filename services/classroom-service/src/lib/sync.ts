import { google } from 'googleapis';
import Assignment from '../models/assignment';
import Enrollment from '../models/enrollment';
import axios from 'axios';

// Send immediate email notification via notifications-service
async function notifyStudents(courseId: string, assignment: any) {
  const students = await Enrollment.find({ courseId }).exec();
  const emails = students.map(s => s.studentId); // assuming studentId is email
  for (const email of emails) {
    try {
      await axios.post(`${process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:4000'}/api/notifications/send-email`, {
        to: email,
        subject: `Nueva tarea: ${assignment.title}`,
        text: `Se ha creado una nueva tarea en el curso: ${assignment.title}\n\nDescripción: ${assignment.description || ''}\n\nFecha límite: ${assignment.dueDate || 'Sin fecha'}`
      });
    } catch (err) {
      console.error('notify failed for', email, err);
    }
  }
}

export async function syncCourseworkForCourse(authClient: any, courseId: string) {
  const classroom = google.classroom({ version: 'v1', auth: authClient });
  const resp = await classroom.courses.courseWork.list({ courseId });
  const coursework = resp.data.courseWork || [];
  for (const cw of coursework) {
    const existing = await Assignment.findOne({ googleId: cw.id }).exec();
    if (!existing) {
      const a = await Assignment.create({ googleId: cw.id, courseId, title: cw.title, description: cw.description, dueDate: cw.dueDate ? new Date(cw.dueDate) : undefined });
      // Notify students immediately
      await notifyStudents(courseId, a);
    }
  }
}


