// "Course Materials" section texts.
export default {
  nav: { materials: 'Course Materials' },
  materials: {
    subtitle: 'Syllabi, lecture notes, presentations and other teaching materials. Teachers upload; students browse, preview and download.',
    upload: 'Upload material', retry: 'Try again', sample: 'SAMPLE', noGroup: 'No group',
    setup: {
      title: 'Database not connected',
      text: 'This section uses Supabase (database, file storage and sign-in) for real file uploads and persistent storage. Follow these steps to connect it.',
      step1: 'Create a project at supabase.com.',
      step2: 'Run supabase/schema.sql in the SQL Editor.',
      step3: 'Copy the project URL and the anon key from Project Settings → API.',
      step4: 'Add the two variables below to .env.local (or to Environment Variables on Vercel) and restart the app.',
      doc: 'Full guide: SUPABASE_SETUP.md',
    },
    auth: {
      title: 'Sign in', text: 'Sign in to your account to view the course materials.', signIn: 'Sign in', signUp: 'Sign up',
      email: 'Email', password: 'Password', fullName: 'Full name',
      studentNote: 'New accounts are created as students. An administrator grants teacher access.',
      msg: {
        required: 'Please fill in all fields.', invalid: 'Incorrect email or password.', exists: 'This email is already registered.',
        weak: 'The password is too weak (at least 6 characters).', unconfirmed: 'The email address has not been confirmed yet.', network: 'Could not reach the server.',
        generic: 'Something went wrong. Please try again in a moment.', confirm: 'Account created. Open the confirmation link we emailed you, then sign in.',
      },
    },
    noProfile: { title: 'Profile not found', text: 'No profile exists for your account. Check that supabase/schema.sql has been run.' },
    account: { signOut: 'Sign out' },
    roles: { student: 'Student', teacher: 'Teacher', admin: 'Administrator' },
    category: { syllabus: 'Syllabus', lecture: 'Lecture', presentation: 'Presentation', seminar: 'Seminar / practice', exam_prep: 'Exam preparation', other: 'Other' },
    groupBy: { subject: 'Subject', faculty: 'Faculty', department: 'Department', year: 'Academic year', group: 'Study group', teacher: 'Teacher', none: 'No grouping' },
    filters: {
      search: 'Search', searchPlaceholder: 'Search by title, description, subject, teacher or file name…', all: 'All', faculty: 'Faculty', department: 'Department',
      year: 'Academic year', group: 'Study group', subject: 'Subject', teacher: 'Teacher', category: 'Type', groupBy: 'Group by', myGroup: 'My group only',
    },
    card: { preview: 'Preview', download: 'Download', teacher: 'Teacher', edit: 'Edit {name}', editShort: 'Edit', delete: 'Delete {name}' },
    info: { fileName: 'File name', type: 'Format', size: 'Size', subject: 'Subject', faculty: 'Faculty', department: 'Department', year: 'Academic year', groups: 'Groups', teacher: 'Teacher', uploaded: 'Uploaded' },
    empty: {
      title: 'No materials yet', student: 'Materials will appear here once teachers upload them.',
      teacher: 'Upload the first material, or load the 5 sample PDF materials (SAMPLE) in one click.',
      samples: 'Load sample materials', installing: 'Uploading…', noMatch: 'No materials match the filters',
    },
    form: {
      titleNew: 'Upload new material', titleEdit: 'Edit material', title: 'Title', description: 'Description', descriptionHint: 'A short note about what the material covers',
      category: 'Type', year: 'Academic year', subject: 'Subject', chooseSubject: 'Choose a subject…', groups: 'Study groups', groupsHint: 'If no group is selected, the material is meant for all groups.',
      noGroups: 'No groups found for this faculty.', file: 'File (PDF, DOCX, PPTX)', replaceFile: 'Replace file (optional)', current: 'Current file: {name} · {size}',
      selected: 'Selected: {name} ({size})', save: 'Save', saving: 'Saving…',
      errTitle: 'Enter a title.', errSubject: 'Choose a subject.', errFile: 'Choose a file.',
    },
    delete: { title: 'Delete material', text: '“{name}” and its file will be permanently deleted. Continue?' },
    preview: {
      loading: 'Loading…', error: 'The file could not be opened. You can download it instead.', prev: 'Previous page', next: 'Next page', page: 'Page {n} / {total}',
      zoomIn: 'Zoom in', zoomOut: 'Zoom out', unsupported: '{ext} files cannot be shown in the browser. Download the file to open it.', noText: 'No text found.',
      slide: 'Slide {n}', slidesNote: 'Text extracted from the presentation slides. Download the file for the full view.',
    },
    msg: { created: 'Material uploaded.', updated: 'Material updated.', deleted: 'Material deleted.', samples: { one: '{n} sample material uploaded.', other: '{n} sample materials uploaded.' } },
    err: {
      generic: 'The operation failed.', permission: 'You do not have permission to do this.', network: 'Could not reach the server.', tooLarge: 'The file is too large (25 MB at most).',
      badType: 'This file type is not supported. Upload a PDF, DOCX or PPTX.', empty: 'The file is empty.', notConfigured: 'Supabase is not connected.', load: 'Materials could not be loaded.',
      upload: 'The file could not be uploaded.', save: 'The material could not be saved.', delete: 'The material could not be deleted.', download: 'The file could not be downloaded.', preview: 'The file could not be opened.',
      catalogMissing: 'The faculty, subject and group lists are empty. Run supabase/schema.sql.', sampleMissing: 'A sample file is missing.',
    },
  },
}
