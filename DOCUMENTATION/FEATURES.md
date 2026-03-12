# Seeker — Features List

Open source. All features are free.

---

## Job Applications
- Add a job application manually
- Link application to job posting URL
- View job posting status on application detail
- Manually update posting status: `"active" | "closed" | "filled" | "unknown"`
- Track application status: `"saved" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn"`
- Edit application details — job title, company, location, URL, salary range, date applied
- Delete an application
- Paginated applications list
- Filter by status
- Sort by date, company, or status
- Automated posting status checks — checks job posting URL on user-configured schedule (hourly, daily, or weekly)
- In-app notification when posting status changes automatically
- Webhook integration — auto-ingest applications from job boards
- Auto-detect duplicate applications from webhooks
- Bulk import via CSV

## Interview Tracking
- Add an interview tied to an application
- Track type: `"phone" | "technical" | "behavioral" | "onsite" | "final"`
- Track date, time, interviewer name, title, and outcome
- Edit and delete interviews
- View all interviews tied to an application
- Track outcome: `"pending" | "passed" | "failed" | "no_show"`

## Notes
- Dedicated notes tab — notes are first-class, not nested inside other views
- Add a note with one type tag: `"interview" | "job_description" | "research" | "general"`
- Add one relational tag linking to a real record — application, interview, or company
- Edit notes via editable text area with debounced saves
- Delete notes
- Filter notes by type tag or relational tag
- Paginated notes list

## Dashboard & Metrics
- Total applications submitted
- Applications by status
- Interview rate — interviews divided by applications
- Active applications — applied or interviewing
- Offers received
- Rejections received
- Most recent activity feed
- Live job market trends — hiring activity by industry and role (future)
- Layoff metrics — recent layoff data by company and sector (future)
- Application success benchmarks vs market averages (future)
- Time-to-offer tracking (future)
- Best days and times to apply based on market data (future)

## Resume Management
- Upload a resume — PDF or DOCX only
- One or more resumes per user
- Attach resume to user profile
- Preview resume in app
- Replace existing resume
- Delete resume

## User Profile & Settings
- View and edit display name
- View and edit email
- Change password via Auth0
- Delete account — removes all data
- Configure posting status check frequency: hourly, daily, or weekly
- Configure notification preferences by channel (future)

## Notifications
- In-app notification when application status changes
- In-app reminder to follow up on applications with no activity for X days
- Mark notifications as read
- Clear all notifications
- Email notifications for status changes (future)
- Weekly email digest (future)
- Real-time alerts for tracked companies posting new roles (future)

## Webhooks & Integrations
- Receive webhooks from supported job boards
- Webhook event log
- Retry failed webhook events
- Configure webhook sources and filters

---

## Future Features (Post-Launch)
- OpenAI — resume analysis, interview prep, cover letter generation
- Company research — auto-pull public company data
- Contacts tracking — log people you have spoken to at each company
- Calendar integration — sync interviews to Google or Apple Calendar
- Mobile app
