// Centralised demo data. Every other module references courses by `courseId`,
// so a course always has the same instructor, colour and room across the app.
export const student = {
  firstName: 'Turan', lastName: 'Qəhrəmanov', email: 'turan.qahramanov@student.demo',
  studentId: 'ST-2024-0318', faculty: 'Faculty of Applied Mathematics and Informatics',
  program: 'Data Science and Applied Mathematics', year: '3rd year', group: 'AM-32', semester: 'Autumn 2026',
  advisor: 'Nigar Mammadova', enrolled: '2024',
}

export const courses = [
  { id: 'math', title: 'Mathematical Analysis', instructor: 'Nigar Mammadova', color: '#4A7DB5', icon: 'Sigma', credits: 6, room: '204' },
  { id: 'prog', title: 'Programming', instructor: 'Elvin Hasanov', color: '#4F8F8B', icon: 'Laptop', credits: 6, room: '305' },
  { id: 'prob', title: 'Probability Theory', instructor: 'Aygun Aliyeva', color: '#B0585A', icon: 'Dices', credits: 5, room: '210' },
  { id: 'phys', title: 'Physics', instructor: 'Rauf Guliyev', color: '#B7791F', icon: 'Atom', credits: 5, room: '112' },
  { id: 'db', title: 'Database Systems', instructor: 'Kamran Ismayilov', color: '#7A6AA0', icon: 'Database', credits: 5, room: '301' },
  { id: 'stat', title: 'Statistical Methods', instructor: 'Sevinc Rzayeva', color: '#6F8A3A', icon: 'BarChart3', credits: 5, room: '205' },
  { id: 'eng', title: 'English Language', instructor: 'Leyla Abbasova', color: '#9A7B45', icon: 'Languages', credits: 3, room: '118' },
  { id: 'ai', title: 'Introduction to Artificial Intelligence', instructor: 'Orkhan Jafarov', color: '#7A8A99', icon: 'Bot', credits: 4, room: '308' },
]

// Weekly timetable. weekday: 0 = Sunday … 6 = Saturday.
export const schedule = [
  { id: 'cl1', courseId: 'math', weekday: 1, start: '09:00', end: '10:30', room: '204', type: 'Lecture' },
  { id: 'cl2', courseId: 'prog', weekday: 1, start: '11:00', end: '12:30', room: '305', type: 'Lecture' },
  { id: 'cl3', courseId: 'prob', weekday: 2, start: '10:00', end: '11:30', room: '210', type: 'Lecture' },
  { id: 'cl4', courseId: 'stat', weekday: 2, start: '13:00', end: '14:30', room: '205', type: 'Seminar' },
  { id: 'cl5', courseId: 'phys', weekday: 3, start: '09:00', end: '10:30', room: '112', type: 'Lecture' },
  { id: 'cl6', courseId: 'prog', weekday: 3, start: '11:00', end: '12:30', room: '305', type: 'Laboratory' },
  { id: 'cl7', courseId: 'eng', weekday: 3, start: '13:00', end: '14:30', room: '118', type: 'Seminar' },
  { id: 'cl8', courseId: 'eng', weekday: 4, start: '09:00', end: '10:30', room: '118', type: 'Lecture' },
  { id: 'cl9', courseId: 'db', weekday: 4, start: '12:00', end: '13:30', room: '301', type: 'Lecture' },
  { id: 'cl10', courseId: 'db', weekday: 4, start: '14:00', end: '15:30', room: '302', type: 'Laboratory' },
  { id: 'cl11', courseId: 'stat', weekday: 5, start: '10:00', end: '11:30', room: '205', type: 'Lecture' },
  { id: 'cl12', courseId: 'ai', weekday: 5, start: '14:00', end: '15:30', room: '308', type: 'Lecture' },
]
// Weekly classes run only inside this window (the exam session follows).
export const semester = { start: '2026-09-07', end: '2026-12-19' }
// One-off changes to the timetable.
export const scheduleExceptions = [
  { classId: 'cl3', date: '2026-11-10', reason: 'Lecture cancelled: it overlaps with the Mathematical Analysis midterm.', reasonKey: 'content.reason.cl3' },
]

// Exams. Status is derived from the date, except `Postponed` which is explicit.
export const exams = [
  { id: 'ex1', courseId: 'prog', type: 'Midterm', title: 'Midterm I', date: '2026-10-16', start: '12:00', end: '13:00', room: '305', score: 72 },
  { id: 'ex2', courseId: 'phys', type: 'Midterm', title: 'Midterm I', date: '2026-10-20', start: '09:00', end: '10:00', room: '112', score: 78 },
  { id: 'ex3', courseId: 'db', type: 'Midterm', title: 'Midterm I', date: '2026-10-22', start: '12:00', end: '13:00', room: '301', score: 85 },
  { id: 'ex4', courseId: 'stat', type: 'Midterm', title: 'Midterm I', date: '2026-10-23', start: '10:00', end: '11:00', room: '205', score: 81 },
  { id: 'ex5', courseId: 'eng', type: 'Midterm', title: 'Midterm I', date: '2026-10-26', start: '13:00', end: '14:00', room: '118', score: 90 },
  { id: 'ex6', courseId: 'ai', type: 'Quiz', title: 'Quiz I', date: '2026-10-30', start: '14:00', end: '14:30', room: '308', score: 88 },
  { id: 'ex7', courseId: 'math', type: 'Midterm', title: 'Midterm I', date: '2026-11-10', start: '10:00', end: '11:00', room: '204' },
  { id: 'ex8', courseId: 'prog', type: 'Midterm', title: 'Midterm II', date: '2026-11-13', start: '12:00', end: '13:00', room: '305' },
  { id: 'ex9', courseId: 'prob', type: 'Midterm', title: 'Midterm I', date: '2026-11-17', start: '09:00', end: '10:00', room: '210' },
  { id: 'ex10', courseId: 'db', type: 'Midterm', title: 'Midterm II', date: '2026-11-19', start: '12:00', end: '13:00', room: '301' },
  { id: 'ex11', courseId: 'eng', type: 'Quiz', title: 'Quiz II', date: '2026-11-19', start: '09:00', end: '09:30', room: '118' },
  { id: 'ex12', courseId: 'phys', type: 'Midterm', title: 'Midterm II', date: '2026-11-24', start: '09:00', end: '10:00', room: '112', status: 'Postponed', note: 'Moved from Nov 20 at the instructor’s request.', noteKey: 'content.examNote.ex12' },
  { id: 'ex13', courseId: 'math', type: 'Final', title: 'Final Exam', date: '2026-12-21', start: '09:00', end: '11:00', room: 'Hall A' },
  { id: 'ex14', courseId: 'prog', type: 'Final', title: 'Final Exam', date: '2026-12-22', start: '09:00', end: '11:00', room: 'Hall A' },
  { id: 'ex15', courseId: 'prob', type: 'Final', title: 'Final Exam', date: '2026-12-23', start: '09:00', end: '11:00', room: 'Hall B' },
  { id: 'ex16', courseId: 'phys', type: 'Final', title: 'Final Exam', date: '2026-12-24', start: '09:00', end: '11:00', room: 'Hall A' },
  { id: 'ex17', courseId: 'db', type: 'Final', title: 'Final Exam', date: '2026-12-25', start: '09:00', end: '11:00', room: 'Hall B' },
  { id: 'ex18', courseId: 'stat', type: 'Final', title: 'Final Exam', date: '2026-12-28', start: '09:00', end: '11:00', room: 'Hall A' },
  { id: 'ex19', courseId: 'eng', type: 'Final', title: 'Final Exam', date: '2026-12-29', start: '09:00', end: '10:30', room: 'Hall B' },
  { id: 'ex20', courseId: 'ai', type: 'Final', title: 'Final Exam', date: '2026-12-30', start: '09:00', end: '11:00', room: 'Hall A' },
]

// Assignments. `status` is the stored status; Overdue is derived from the deadline.
// `grade` is 0–100 and only present once evaluated.
export const assignments = [
  { id: 'as1', courseId: 'math', title: 'Definite integrals problem set', description: 'Solve 10 problems related to definite integrals. Show every substitution and the final numeric value.', assigned: '2026-10-12', due: '2026-10-26', status: 'Completed', submittedAt: '2026-10-25', grade: 90 },
  { id: 'as2', courseId: 'math', title: 'Independent study: differential equations', description: 'Study first-order differential equations on your own and submit a two-page summary with three worked examples.', assigned: '2026-10-26', due: '2026-11-12', status: 'In Progress' },
  { id: 'as3', courseId: 'math', title: 'Quiz on limits and continuity', description: 'Online quiz covering limits, one-sided limits and continuity of piecewise functions. Submit your worked answers.', assigned: '2026-11-02', due: '2026-11-09', status: 'New' },
  { id: 'as4', courseId: 'prog', title: 'Implement functions in Python', description: 'Write ten small Python functions with docstrings and tests, as listed in the task sheet.', assigned: '2026-10-05', due: '2026-10-19', status: 'Completed', submittedAt: '2026-10-18', grade: 94 },
  { id: 'as5', courseId: 'prog', title: 'Practical exercises: lists and dictionaries', description: 'Complete the practical exercises on list comprehensions, dictionary methods and nested data structures.', assigned: '2026-10-26', due: '2026-11-05', status: 'New' },
  { id: 'as6', courseId: 'prog', title: 'Develop a small programming project', description: 'Build a small command-line application (for example a task tracker) and submit the code with a short README.', assigned: '2026-11-02', due: '2026-11-30', status: 'New' },
  { id: 'as7', courseId: 'prob', title: 'Fundamental probability formulas', description: 'Problems involving the addition and multiplication rules, conditional probability and Bayes’ formula.', assigned: '2026-10-08', due: '2026-10-22', status: 'Completed', submittedAt: '2026-10-21', grade: 88 },
  { id: 'as8', courseId: 'prob', title: 'Distributions of random variables', description: 'Work through the problems on discrete and continuous distributions (binomial, Poisson, normal).', assigned: '2026-10-29', due: '2026-11-11', status: 'In Progress' },
  { id: 'as9', courseId: 'prob', title: 'Mathematical expectation and variance', description: 'Calculate the expectation and variance for the random variables given in the task sheet.', assigned: '2026-11-05', due: '2026-11-18', status: 'New' },
  { id: 'as10', courseId: 'phys', title: 'Laws of mechanics problems', description: 'Solve the problems on Newton’s laws, friction and motion on inclined planes.', assigned: '2026-10-14', due: '2026-10-28', status: 'Completed', submittedAt: '2026-10-29', grade: 76 },
  { id: 'as11', courseId: 'phys', title: 'Conservation of energy applications', description: 'Apply the law of conservation of energy to the pendulum, spring and roller-coaster problems.', assigned: '2026-11-02', due: '2026-11-14', status: 'New' },
  { id: 'as12', courseId: 'db', title: 'SQL SELECT and JOIN exercises', description: 'Write queries using SELECT, WHERE and the four JOIN types on the university sample database.', assigned: '2026-10-06', due: '2026-10-20', status: 'Completed', submittedAt: '2026-10-19', grade: 92 },
  { id: 'as13', courseId: 'db', title: 'GROUP BY and HAVING practice', description: 'Practical exercises on aggregate functions, GROUP BY and HAVING.', assigned: '2026-10-27', due: '2026-11-06', status: 'In Progress' },
  { id: 'as14', courseId: 'db', title: 'Subqueries and CTE assignment', description: 'Rewrite the given queries using subqueries and common table expressions (WITH).', assigned: '2026-11-04', due: '2026-11-20', status: 'New' },
  { id: 'as15', courseId: 'stat', title: 'Descriptive statistics calculations', description: 'Compute mean, median, mode, variance and quartiles for the supplied datasets.', assigned: '2026-10-09', due: '2026-10-23', status: 'Completed', submittedAt: '2026-10-23', grade: 83 },
  { id: 'as16', courseId: 'stat', title: 'Hypothesis testing', description: 'Perform t-tests and chi-square tests on the supplied data and interpret the p-values.', assigned: '2026-10-30', due: '2026-11-13', status: 'In Progress' },
  { id: 'as17', courseId: 'stat', title: 'Correlation analysis', description: 'Compute Pearson and Spearman correlations and discuss the strength and direction of each relationship.', assigned: '2026-11-06', due: '2026-11-24', status: 'New' },
  { id: 'as18', courseId: 'eng', title: 'Academic vocabulary exercises', description: 'Complete the academic word list exercises for units 5 to 7.', assigned: '2026-10-12', due: '2026-10-26', status: 'Completed', submittedAt: '2026-10-24', grade: 95 },
  { id: 'as19', courseId: 'eng', title: 'Reading comprehension', description: 'Read the assigned academic article and answer the comprehension questions.', assigned: '2026-11-02', due: '2026-11-09', status: 'New' },
  { id: 'as20', courseId: 'eng', title: 'Essay writing', description: 'Write a 500-word argumentative essay on a topic from the list.', assigned: '2026-11-05', due: '2026-11-27', status: 'New' },
  { id: 'as21', courseId: 'ai', title: 'Research: fundamental machine learning concepts', description: 'Write a one-page overview of core machine learning concepts: features, labels, training, overfitting.', assigned: '2026-10-15', due: '2026-10-29', status: 'Completed', submittedAt: '2026-10-28', grade: 89 },
  { id: 'as22', courseId: 'ai', title: 'Compare supervised and unsupervised learning', description: 'Prepare a comparison table with examples, typical algorithms and evaluation methods for both approaches.', assigned: '2026-11-03', due: '2026-11-12', status: 'In Progress' },
  { id: 'as23', courseId: 'ai', title: 'Build a simple machine learning model', description: 'Train and evaluate a simple classifier on a small dataset and report the accuracy.', assigned: '2026-11-06', due: '2026-12-04', status: 'New' },
]

// Independent study projects (same status model as assignments).
export const studies = [
  { id: 'is1', courseId: 'math', title: 'Convergence of improper integrals', description: 'Prepare a short report on convergence tests for improper integrals, with five worked examples.', assigned: '2026-10-05', due: '2026-10-30', status: 'Completed', submittedAt: '2026-10-29', grade: 91 },
  { id: 'is2', courseId: 'prog', title: 'Algorithm complexity report', description: 'Compare the time complexity of common sorting algorithms and support it with timing experiments.', assigned: '2026-10-20', due: '2026-11-16', status: 'In Progress' },
  { id: 'is3', courseId: 'prob', title: 'Monte Carlo simulation: the birthday problem', description: 'Simulate the birthday problem and compare the simulated result with the analytic probability.', assigned: '2026-11-01', due: '2026-11-22', status: 'New' },
  { id: 'is4', courseId: 'phys', title: 'Energy analysis of a pendulum', description: 'Analyse kinetic and potential energy of a simple pendulum and write up your measurements.', assigned: '2026-10-10', due: '2026-11-03', status: 'In Progress' },
  { id: 'is5', courseId: 'db', title: 'ER diagram for a library system', description: 'Design an entity-relationship diagram and relational schema for a library management system.', assigned: '2026-10-12', due: '2026-11-02', status: 'Completed', submittedAt: '2026-11-01', grade: 87 },
  { id: 'is6', courseId: 'stat', title: 'Analyse a public dataset', description: 'Pick a public dataset, run descriptive statistics and one hypothesis test, and report the findings.', assigned: '2026-11-03', due: '2026-12-01', status: 'New' },
  { id: 'is7', courseId: 'eng', title: 'Academic presentation on AI ethics', description: 'Prepare a five-minute academic presentation on an ethical issue in artificial intelligence.', assigned: '2026-10-26', due: '2026-11-14', status: 'In Progress' },
  { id: 'is8', courseId: 'ai', title: 'Overview of neural networks', description: 'Write a short overview of how a feed-forward neural network is trained, with one diagram.', assigned: '2026-11-05', due: '2026-12-07', status: 'New' },
]

// Attendance per course (classes held / attended so far this semester).
export const attendance = {
  math: { held: 18, attended: 17 }, prog: { held: 24, attended: 22 }, prob: { held: 16, attended: 14 }, phys: { held: 16, attended: 15 },
  db: { held: 20, attended: 20 }, stat: { held: 20, attended: 17 }, eng: { held: 20, attended: 19 }, ai: { held: 8, attended: 7 },
}

export const GRADE_WEIGHTS = { midterm: 0.3, assignment: 0.25, study: 0.15, attendance: 0.1, final: 0.2 }

export const notificationTemplates = [
  { id: 'n1', category: 'Homework', title: 'New assignment: Correlation analysis', text: 'Statistical Methods. Deadline Nov 24.', at: '2026-11-06T16:20:00', read: false, titleKey: 'notif.tpl.newAssignment.title', textKey: 'notif.tpl.newAssignment.text', params: { task: 'assignment:as17', course: 'stat', date: '2026-11-24' } },
  { id: 'n2', category: 'Homework', title: 'New assignment: Build a simple machine learning model', text: 'Introduction to Artificial Intelligence. Deadline Dec 4.', at: '2026-11-06T11:05:00', read: false, titleKey: 'notif.tpl.newAssignment.title', textKey: 'notif.tpl.newAssignment.text', params: { task: 'assignment:as23', course: 'ai', date: '2026-12-04' } },
  { id: 'n3', category: 'Midterms', title: 'Midterm reminder: Mathematical Analysis', text: 'Midterm I is on Nov 10 at 10:00 in Room 204.', at: '2026-11-06T09:00:00', read: false, titleKey: 'notif.tpl.midtermReminder.title', textKey: 'notif.tpl.midtermReminder.text', params: { course: 'math', exam: 'Midterm I', date: '2026-11-10', time: '10:00', room: '204' } },
  { id: 'n4', category: 'Class schedule', title: 'Class cancelled: Probability Theory', text: 'The lecture on Nov 10 is cancelled because it overlaps with the Mathematical Analysis midterm.', at: '2026-11-05T18:40:00', read: false, titleKey: 'notif.tpl.classCancelled.title', textKey: 'notif.tpl.classCancelled.text', params: { course: 'prob', date: '2026-11-10', overlapCourse: 'math' } },
  { id: 'n5', category: 'Exam schedule', title: 'Exam rescheduled: Physics Midterm II', text: 'Moved from Nov 20 to Nov 24, 09:00 in Room 112.', at: '2026-11-05T13:15:00', read: true, titleKey: 'notif.tpl.examRescheduled.title', textKey: 'notif.tpl.examRescheduled.text', params: { course: 'phys', exam: 'Midterm II', from: '2026-11-20', date: '2026-11-24', time: '09:00', room: '112' } },
  { id: 'n6', category: 'Homework', title: 'New assignment: Subqueries and CTE assignment', text: 'Database Systems. Deadline Nov 20.', at: '2026-11-04T10:30:00', read: true, titleKey: 'notif.tpl.newAssignment.title', textKey: 'notif.tpl.newAssignment.text', params: { task: 'assignment:as14', course: 'db', date: '2026-11-20' } },
  { id: 'n7', category: 'Evaluations', title: 'Assignment evaluated: ER diagram for a library system', text: 'Database Systems. Your score is 87/100.', at: '2026-11-03T15:50:00', read: true, titleKey: 'notif.tpl.evaluated.title', textKey: 'notif.tpl.evaluated.text', params: { task: 'study:is5', course: 'db', score: 87 } },
  { id: 'n8', category: 'Grades', title: 'Midterm I grade published: Physics', text: 'Physics. Your score is 78/100.', at: '2026-10-22T12:00:00', read: true, titleKey: 'notif.tpl.gradePublished.title', textKey: 'notif.tpl.gradePublished.text', params: { exam: 'Midterm I', course: 'phys', score: 78 } },
  { id: 'n9', category: 'Midterms', title: 'Midterm reminder: Programming', text: 'Midterm II is on Nov 13 at 12:00 in Room 305.', at: '2026-11-04T09:00:00', read: true, titleKey: 'notif.tpl.midtermReminder.title', textKey: 'notif.tpl.midtermReminder.text', params: { course: 'prog', exam: 'Midterm II', date: '2026-11-13', time: '12:00', room: '305' } },
  { id: 'n10', category: 'Evaluations', title: 'Independent study evaluated: Convergence of improper integrals', text: 'Mathematical Analysis. Your score is 91/100.', at: '2026-11-02T14:10:00', read: true, titleKey: 'notif.tpl.studyEvaluated.title', textKey: 'notif.tpl.studyEvaluated.text', params: { task: 'study:is1', course: 'math', score: 91 } },
]
export const NOTIFICATION_CATEGORIES = ['Homework', 'Midterms', 'Exam schedule', 'Evaluations', 'Grades', 'Class schedule']

export const defaultPrefs = {
  theme: 'light', density: 'comfortable', weekStart: 1, calendarView: 'week',
  notify: { Homework: true, Midterms: true, 'Exam schedule': true, Evaluations: true, Grades: true, 'Class schedule': true },
  emailDigest: false,
}
