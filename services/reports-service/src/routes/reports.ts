import { Router } from 'express';
import Submission from '../../shared/models/submission';
import Enrollment from '../../shared/models/enrollment';
import Course from '../../shared/models/course';
import dayjs from 'dayjs';

const router = Router();

router.get('/overview', async (req, res) => {
  // Example overview: total students, classes, assignments, overall submission rate
  try {
    const totalStudents = await Enrollment.distinct('studentId').countDocuments();
    const totalClasses = await Course.countDocuments();
    const totalAssignments = await Submission.distinct('assignmentId').countDocuments();
    const submitted = await Submission.countDocuments({ state: { $in: ['TURNED_IN', 'RETURNED'] } });
    const submissionRate = totalAssignments === 0 ? 0 : submitted / totalAssignments;
    res.json({ totalStudents, totalClasses, totalAssignments, submissionRate });
  } catch (err) {
    console.error('overview error', err);
    res.status(500).json({ error: 'failed to compute overview' });
  }
});

router.get('/attendance', async (req, res) => {
  // Placeholder: attendance requires events collection where attendance is stored
  try {
    const since = req.query.since ? dayjs(req.query.since as string) : dayjs().subtract(30, 'day');
    // Implement aggregation using attendance collection later
    res.json({ since: since.toISOString(), attendanceByCourse: [] });
  } catch (err) {
    res.status(500).json({ error: 'failed to compute attendance' });
  }
});

router.get('/delivery-rate', async (req, res) => {
  // Returns % of assignments submitted on time per cohort or course
  try {
    // Simplified: group by assignment and compute on-time rate
    res.json({ perCourse: [] });
  } catch (err) {
    res.status(500).json({ error: 'failed to compute delivery rate' });
  }
});

export default router;


