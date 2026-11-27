import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Pencil,
  CalendarDays,
  ChevronUp,
  Clock3,
  ExternalLink,
  Instagram,
  Linkedin,
  LockKeyhole,
  Menu,
  MessageCircle,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type EventDraft,
  type EventItem,
  type Officer,
  type OfficerDraft,
  type Project,
  type ProjectDraft,
  completeOfficerPasswordSetup,
  loadClubContent,
  removeClubContent,
  requestOfficerPasswordSetup,
  saveEvent as saveEventRecord,
  saveOfficer as saveOfficerRecord,
  saveProject as saveProjectRecord,
  signInOfficer,
  signOutOfficer,
  subscribeEmail,
  submitSignup as submitSignupRecord,
} from "@/services/clubData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Foothill Startup Club" },
      {
        name: "description",
        content: "Looking to work on a project or have your own startup idea? Come share your ideas and collaborate with others!",
      },
      { property: "og:title", content: "Foothill Startup Club" },
      {
        property: "og:description",
        content: "Looking to work on a project or have your own startup idea? Come share your ideas and collaborate with others!",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://foothillstartupclub.github.io/" },
      { property: "og:image", content: "https://foothillstartupclub.github.io/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Foothill Startup Club" },
      {
        name: "twitter:description",
        content: "Looking to work on a project or have your own startup idea? Come share your ideas and collaborate with others!",
      },
      { name: "twitter:image", content: "https://foothillstartupclub.github.io/og-image.png" },
    ],
  }),
  component: FoothillStartupClubPage,
});

const emptyEvent: EventDraft = {
  title: "",
  description: "",
  event_date: "",
  start_time: "",
  end_time: "",
  timezone: "America/Los_Angeles",
  location: "",
  registration_url: "",
};
const emptyProject: ProjectDraft = { title: "", description: "", status: "" };
const emptyOfficer: OfficerDraft = { name: "", role: "", bio: "", photo_url: "", display_order: 0 };

const NAV_SECTIONS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "events", label: "Events" },
  { id: "officers", label: "Officers" },
  { id: "launchpad", label: "Startup Launchpad" },
] as const;

function FoothillStartupClubPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [heroEmail, setHeroEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [heroEmailStatus, setHeroEmailStatus] = useState("");
  const [signupStatus, setSignupStatus] = useState("");
  const [workingOnProject, setWorkingOnProject] = useState(false);
  const [membershipType, setMembershipType] = useState("");
  const [membershipOther, setMembershipOther] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [referralOther, setReferralOther] = useState("");
  const [officerMode, setOfficerMode] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    async function loadContent() {
      try {
        const [eventResult, projectResult, officerResult] = await loadClubContent();
        if (!eventResult.error) setEvents(eventResult.data ?? []);
        if (!projectResult.error) setProjects(projectResult.data ?? []);
        if (!officerResult.error) setOfficers(officerResult.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    void loadContent();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
        setOfficerMode(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submitEmailList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailStatus("");
    const { error } = await subscribeEmail(email);
    if (error) {
      setEmailStatus("We could not save that email. Please check it and try again.");
      return;
    }
    setEmailStatus("You’re on the list. We’ll keep you posted.");
    setEmail("");
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupStatus("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const { error } = await submitSignupRecord({
      fullName: String(form.get("full_name") ?? ""),
      email: String(form.get("signup_email") ?? ""),
      workingOnProject,
      projectRole: workingOnProject ? String(form.get("project_role") ?? "") : null,
      membershipType,
      referralSource,
      membershipOther: membershipType === "other" ? membershipOther : "",
      referralOther: referralSource === "other" ? referralOther : "",
    });
    if (error) {
      setSignupStatus("We could not submit your application. Please review the form and try again.");
      return;
    }
    setSignupStatus("You’re in! We’ll be in touch.");
    formEl.reset();
    setWorkingOnProject(false);
    setMembershipType("");
    setMembershipOther("");
    setReferralSource("");
    setReferralOther("");
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter((item) => item.event_date >= today);
  const pastEvents = events.filter((item) => item.event_date < today).reverse();

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Foothill Startup Club home">
          <img className="brand-crest" src="/header-crest.svg" alt="Foothill Startup Club crest" />
          <span>
            Foothill
            <br />
            <em>Startup Club</em>
          </span>
        </a>
        <button
          className="mobile-menu-button"
          aria-label="Open navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={mobileMenuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
          {NAV_SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} onClick={() => setMobileMenuOpen(false)}>
              {section.label}
            </a>
          ))}
          <a className="nav-cta" href="#join" onClick={() => setMobileMenuOpen(false)}>
            Join the Club <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <h1>
              Foothill
              <br className="hero-title-break" />{" "}
              <em>Startup Club</em>
            </h1>
            <p className="hero-description">
              Turning ideas into reality.
            </p>
            <div className="hero-actions">
              <a className="button button-cream" href="#join">
                Join the Club <ArrowUpRight size={17} />
              </a>
              <form
                className="hero-email-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setHeroEmailStatus("");
                  const { error } = await subscribeEmail(heroEmail);
                  if (error) {
                    setHeroEmailStatus("Could not join the email list.");
                    return;
                  }
                  setHeroEmailStatus("You’re on the list.");
                  setHeroEmail("");
                }}
              >
                <label className="sr-only" htmlFor="hero-email">
                  Email address
                </label>
                <input
                  id="hero-email"
                  type="email"
                  value={heroEmail}
                  onChange={(event) => setHeroEmail(event.target.value)}
                  required
                  placeholder="Your email"
                />
                <button className="text-link light-link" type="submit">
                  Join Our Email List <ArrowUpRight size={17} />
                </button>
                {heroEmailStatus && (
                  <span className="hero-email-status" role="status">
                    {heroEmailStatus}
                  </span>
                )}
              </form>
            </div>
          </div>
          <div className="hero-crest-wrap">
            <div className="crest-tile">
              <img src="/foothill_startup_club_logo_vector.svg" alt="Foothill Startup Club crest" />
            </div>
          </div>
        </section>

        <section id="about" className="section about-section">
          <div className="section-kicker">01 / About the club</div>
          <div className="about-grid">
            <h2>
              Ideas get better
              <br />
              <em>when they’re shared.</em>
            </h2>
            <div>
              <p className="lead">
                Foothill Startup Club is a student-led space for curiosity, experimentation, and making things with
                other people.
              </p>
              <p>
                You don’t need a startup, a polished pitch, or prior experience to join. Bring a question, an early
                idea, or simply an interest in seeing what you can build.
              </p>
              <a className="text-link dark-link" href="#join">
                Find your place here <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section id="projects" className="section projects-section">
          <div className="section-heading">
            <div className="section-kicker">02 / Projects</div>
            <p>Current ideas, open questions, and ways to get involved.</p>
          </div>
          {loading ? (
            <div className="empty-state">Loading projects…</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <Plus size={18} />
              <span>Projects will appear here as members begin building together.</span>
              <a href="#join">Bring an idea</a>
            </div>
          ) : (
            <div className="project-list">
              {projects.map((project, index) => (
                <article className="project-row" key={project.id}>
                  <span className="row-number">0{index + 1}</span>
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.description || "Details coming soon."}</p>
                  </div>
                  <span className="status-pill">{project.status || "Open to explore"}</span>
                  <a className="row-arrow" href="#join" aria-label={`Express interest in ${project.title}`}>
                    <ArrowUpRight size={18} />
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="events" className="section events-section">
          <div className="section-heading">
            <div className="section-kicker">03 / Events</div>
            <p>Come by, ask questions, and meet the people making things happen.</p>
          </div>
          <div className="events-columns">
            <div>
              <h3 className="subsection-title">Upcoming</h3>
              {loading ? (
                <div className="empty-state">Loading events…</div>
              ) : upcomingEvents.length === 0 ? (
                <div className="empty-state compact">New events will be posted here soon.</div>
              ) : (
                <div className="event-list">
                  {upcomingEvents.map((item) => (
                    <EventCard key={item.id} event={item} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="subsection-title muted-title">Past events</h3>
              {pastEvents.length === 0 ? (
                <div className="empty-state compact">Your event archive will live here.</div>
              ) : (
                <div className="event-list past-list">
                  {pastEvents.map((item) => (
                    <EventCard key={item.id} event={item} past />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="officers" className="section officers-section">
          <div className="section-heading">
            <div className="section-kicker">04 / Officers</div>
            <p>The people helping make room for the next idea.</p>
          </div>
          {officers.length === 0 ? (
            <div className="empty-state">Officer profiles will be added here soon.</div>
          ) : (
            <div className="officer-list">
              {officers.map((officer) => (
                <article className="officer-row" key={officer.id}>
                  {officer.photo_url ? (
                    <img src={officer.photo_url} alt="" />
                  ) : (
                    <div className="officer-placeholder">
                      <UserRound size={22} />
                    </div>
                  )}
                  <div>
                    <h3>{officer.name}</h3>
                    <p className="officer-role">{officer.role}</p>
                    <p>{officer.bio || "Bio coming soon."}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="launchpad" className="launchpad-section">
          <div>
            <div className="section-kicker light">05 / In the ecosystem</div>
            <h2>
              Keep building
              <br />
              <em>with Launchpad.</em>
            </h2>
          </div>
          <div>
            <p>
              Startup Launchpad is a place to keep learning, testing, and moving an idea forward. Explore the program
              and see where it can take you next.
            </p>
            <a className="button button-cream" href="#" onClick={(event) => event.preventDefault()}>
              Visit Startup Launchpad <ExternalLink size={16} />
            </a>
            <span className="url-note">Official link coming soon.</span>
          </div>
        </section>

        <section id="join" className="section join-section">
          <div className="join-intro">
            <div className="section-kicker">06 / Join the club</div>
            <h2>
              Start with
              <br />
              <em>where you are.</em>
            </h2>
            <p>No perfect idea required. Tell us a little about yourself and we’ll take it from there.</p>
          </div>
          <form className="signup-form" onSubmit={submitSignup}>
            <label>
              Full name
              <input name="full_name" required minLength={2} placeholder="Your name" />
            </label>
            <label>
              Email
              <input name="signup_email" required type="email" placeholder="you@example.com" />
            </label>
            <fieldset>
              <legend>Are you working on a project or startup idea?</legend>
              <div className="choice-row">
                <label className={workingOnProject ? "choice active" : "choice"}>
                  <input
                    type="radio"
                    name="working_on_project"
                    checked={workingOnProject}
                    onChange={() => setWorkingOnProject(true)}
                  />{" "}
                  Yes
                </label>
                <label className={!workingOnProject ? "choice active" : "choice"}>
                  <input
                    type="radio"
                    name="working_on_project"
                    checked={!workingOnProject}
                    onChange={() => setWorkingOnProject(false)}
                  />{" "}
                  No
                </label>
              </div>
            </fieldset>
            {workingOnProject && (
              <fieldset className="reveal-field">
                <legend>Are you a founder or a team member?</legend>
                <div className="choice-row">
                  <label className="choice">
                    <input type="radio" name="project_role" value="founder" required /> Founder
                  </label>
                  <label className="choice">
                    <input type="radio" name="project_role" value="team_member" required /> Team member
                  </label>
                </div>
              </fieldset>
            )}
            <fieldset>
              <legend>I want to join as</legend>
              <div className="choice-stack">
                <label className={membershipType === "founder" ? "choice active" : "choice"}>
                  <input
                    type="radio"
                    name="membership_type"
                    value="founder"
                    checked={membershipType === "founder"}
                    onChange={() => setMembershipType("founder")}
                    required
                  />{" "}
                  Founder with an idea
                </label>
                <label className={membershipType === "general_member" ? "choice active" : "choice"}>
                  <input
                    type="radio"
                    name="membership_type"
                    value="general_member"
                    checked={membershipType === "general_member"}
                    onChange={() => setMembershipType("general_member")}
                  />{" "}
                  General member interested in startups
                </label>
                <label className={membershipType === "other" ? "choice active" : "choice"}>
                  <input
                    type="radio"
                    name="membership_type"
                    value="other"
                    checked={membershipType === "other"}
                    onChange={() => setMembershipType("other")}
                  />{" "}
                  Other…
                </label>
              </div>
              {membershipType === "other" && (
                <input
                  className="other-input"
                  value={membershipOther}
                  onChange={(event) => setMembershipOther(event.target.value)}
                  required
                  placeholder="Tell us how you’d like to join"
                />
              )}
            </fieldset>
            <fieldset>
              <legend>How did you find out about us?</legend>
              <div className="choice-stack">
                {["Website", "Flyers", "Word of mouth", "Class"].map((source) => (
                  <label key={source} className={referralSource === source ? "choice active" : "choice"}>
                    <input
                      type="radio"
                      name="referral_source"
                      value={source}
                      checked={referralSource === source}
                      onChange={() => setReferralSource(source)}
                      required={source === "Website"}
                    />{" "}
                    {source}
                  </label>
                ))}
                <label className={referralSource === "other" ? "choice active" : "choice"}>
                  <input
                    type="radio"
                    name="referral_source"
                    value="other"
                    checked={referralSource === "other"}
                    onChange={() => setReferralSource("other")}
                  />{" "}
                  Other…
                </label>
              </div>
              {referralSource === "other" && (
                <input
                  className="other-input"
                  value={referralOther}
                  onChange={(event) => setReferralOther(event.target.value)}
                  required
                  placeholder="Tell us how you found us"
                />
              )}
            </fieldset>
            <button className="button button-burgundy" type="submit">
              Submit Application <ArrowUpRight size={17} />
            </button>
            {signupStatus && (
              <p className={signupStatus.startsWith("You") ? "form-message success" : "form-message error"} role="status">
                {signupStatus}
              </p>
            )}
          </form>
        </section>

        <section id="email-list" className="email-section">
          <div>
            <div className="section-kicker">Stay close</div>
            <h2>Keep in the loop.</h2>
          </div>
          <form className="email-form" onSubmit={submitEmailList}>
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="Your email address"
            />
            <button className="button button-cream" type="submit">
              Join the Email List <ArrowUpRight size={16} />
            </button>
            {emailStatus && (
              <span className={emailStatus.startsWith("You") ? "form-message success" : "form-message error"} role="status">
                {emailStatus}
              </span>
            )}
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <div className="footer-crest-tile">
            <img src="/footer-crest.svg" alt="Foothill Startup Club crest" />
          </div>
          <span>
            Foothill Startup Club
            <br />
            <small>Turning ideas into reality.</small>
          </span>
        </div>
        <div className="social-links">
          <a href="https://www.instagram.com/foothill.startup" target="_blank" rel="noreferrer">
            <Instagram size={17} /> Instagram
          </a>
          <a href="https://www.linkedin.com/company/foothill-startup-club/" target="_blank" rel="noreferrer">
            <Linkedin size={17} /> LinkedIn
          </a>
          <a href="https://discord.gg/j4RYpmdyXg" target="_blank" rel="noreferrer">
            <MessageCircle size={17} /> Discord
          </a>
          <a href="#" onClick={(event) => event.preventDefault()}>
            <MessageCircle size={17} /> WhatsApp — link soon
          </a>
        </div>
        <div className="footer-bottom">
          <button className="officer-login-link" onClick={() => setOfficerMode(true)}>
            <LockKeyhole size={14} /> Officer sign in
          </button>
          <a href="#top">
            Back to top <ChevronUp size={15} />
          </a>
          <span>Foothill College · Los Altos Hills</span>
        </div>
      </footer>

      {officerMode && (
        <OfficerPanel
          onClose={() => {
            setOfficerMode(false);
            setPasswordRecovery(false);
          }}
          initialRecovery={passwordRecovery}
          events={events}
          projects={projects}
          officers={officers}
          onEvents={setEvents}
          onProjects={setProjects}
          onOfficers={setOfficers}
        />
      )}
    </div>
  );
}

function EventCard({ event, past = false }: { event: EventItem; past?: boolean }) {
  const date = new Date(`${event.event_date}T${event.start_time}`);
  const calendarUrl = useMemo(() => {
    const start = `${event.event_date.replace(/-/g, "")}T${event.start_time.replace(":", "")}00`;
    const end = `${event.event_date.replace(/-/g, "")}T${event.end_time.replace(":", "")}00`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || "",
      location: event.location || "",
      ctz: event.timezone,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [event]);

  return (
    <article className={past ? "event-card past" : "event-card"}>
      <div className="event-date">
        <strong>{date.toLocaleDateString("en-US", { month: "short" })}</strong>
        <span>{date.toLocaleDateString("en-US", { day: "2-digit" })}</span>
      </div>
      <div className="event-details">
        <h3>{event.title}</h3>
        <p>{event.description || "Details coming soon."}</p>
        <div className="event-meta">
          <span>
            <Clock3 size={14} /> {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
          </span>
          <span>
            <CalendarDays size={14} /> {event.location || "Location coming soon"}
          </span>
        </div>
        {!past && (
          <div className="event-actions">
            <a href={calendarUrl} target="_blank" rel="noreferrer">
              Add to Google Calendar <ExternalLink size={14} />
            </a>
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noreferrer">
                Register <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function OfficerPanel({
  onClose,
  initialRecovery,
  events,
  projects,
  officers,
  onEvents,
  onProjects,
  onOfficers,
}: {
  onClose: () => void;
  initialRecovery: boolean;
  events: EventItem[];
  projects: Project[];
  officers: Officer[];
  onEvents: (items: EventItem[]) => void;
  onProjects: (items: Project[]) => void;
  onOfficers: (items: Officer[]) => void;
}) {
  const [session, setSession] = useState(false);
  const [authView, setAuthView] = useState<"signin" | "setup" | "set_password">(
    initialRecovery ? "set_password" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [tab, setTab] = useState<"events" | "projects" | "officers">("events");
  const [eventDraft, setEventDraft] = useState<EventDraft>(emptyEvent);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProject);
  const [officerDraft, setOfficerDraft] = useState<OfficerDraft>(emptyOfficer);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingOfficerId, setEditingOfficerId] = useState<string | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    const result = await signInOfficer(email, password);
    if (result.error || !result.authorized) {
      setIsError(true);
      setMessage("Sign-in could not be completed.");
      return;
    }
    setSession(true);
  }

  async function sendSetupEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    const { error } = await requestOfficerPasswordSetup(email);
    if (error) {
      setIsError(true);
      setMessage("Could not send the verification email. Check the address and try again.");
      return;
    }
    setMessage("Check your inbox for a link to verify your email and choose a new password.");
  }

  async function finishPasswordSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    const result = await completeOfficerPasswordSetup(password);
    if (result.error || !result.authorized) {
      setIsError(true);
      setMessage("Could not complete officer sign-in. Make sure your account has officer access.");
      return;
    }
    setSession(true);
    setPassword("");
  }

  async function signOut() {
    await signOutOfficer();
    setSession(false);
    setAuthView("signin");
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await saveEventRecord(eventDraft, editingEventId ?? undefined);
    if (result.error || !result.data) {
      setIsError(true);
      setMessage("Could not save the event. Check each field.");
      return;
    }
    onEvents(
      (editingEventId ? events.map((item) => (item.id === editingEventId ? result.data : item)) : [...events, result.data]).sort(
        (a, b) => a.event_date.localeCompare(b.event_date),
      ),
    );
    setEventDraft(emptyEvent);
    setEditingEventId(null);
    setIsError(false);
    setMessage("Event saved.");
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await saveProjectRecord(projectDraft, editingProjectId ?? undefined);
    if (result.error || !result.data) {
      setIsError(true);
      setMessage("Could not save the project.");
      return;
    }
    onProjects(editingProjectId ? projects.map((item) => (item.id === editingProjectId ? result.data : item)) : [result.data, ...projects]);
    setProjectDraft(emptyProject);
    setEditingProjectId(null);
    setIsError(false);
    setMessage("Project saved.");
  }

  async function saveOfficer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await saveOfficerRecord(officerDraft, editingOfficerId ?? undefined);
    if (result.error || !result.data) {
      setIsError(true);
      setMessage("Could not save the officer profile.");
      return;
    }
    onOfficers(
      (editingOfficerId ? officers.map((item) => (item.id === editingOfficerId ? result.data : item)) : [...officers, result.data]).sort(
        (a, b) => a.display_order - b.display_order,
      ),
    );
    setOfficerDraft(emptyOfficer);
    setEditingOfficerId(null);
    setIsError(false);
    setMessage("Officer profile saved.");
  }

  async function remove(table: "events" | "projects" | "officers", id: string) {
    const result = await removeClubContent(table, id);
    if (result.error) {
      setIsError(true);
      setMessage("Could not remove that item.");
      return;
    }
    if (table === "events") onEvents(events.filter((item) => item.id !== id));
    if (table === "projects") onProjects(projects.filter((item) => item.id !== id));
    if (table === "officers") onOfficers(officers.filter((item) => item.id !== id));
  }

  return (
    <div className="admin-backdrop">
      <aside className="admin-panel">
        <div className="admin-header">
          <div>
            <span className="section-kicker">Club office</span>
            <h2>Manage the club</h2>
          </div>
          <button className="icon-button" aria-label="Close officer panel" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!session ? (
          authView === "set_password" ? (
            <form className="admin-login" onSubmit={finishPasswordSetup}>
              <p>Choose a new password to finish signing in as an officer.</p>
              <label>
                New password
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button className="button button-burgundy" type="submit">
                Set password & sign in <ArrowUpRight size={16} />
              </button>
              {message && <p className={`form-message ${isError ? "error" : "success"}`}>{message}</p>}
            </form>
          ) : authView === "setup" ? (
            <form className="admin-login" onSubmit={sendSetupEmail}>
              <p>Enter your officer email to receive a verification link and choose a new password.</p>
              <label>
                Email
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <button className="button button-burgundy" type="submit">
                Send verification link <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                className="admin-mode-toggle"
                onClick={() => {
                  setAuthView("signin");
                  setMessage("");
                }}
              >
                Back to password sign-in
              </button>
              {message && <p className={`form-message ${isError ? "error" : "success"}`}>{message}</p>}
            </form>
          ) : (
            <form className="admin-login" onSubmit={signIn}>
              <p>Authorized officers can sign in to update events, projects, and officer profiles.</p>
              <label>
                Email
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                Password
                <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <button className="button button-burgundy" type="submit">
                Sign in <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                className="admin-mode-toggle"
                onClick={() => {
                  setAuthView("setup");
                  setMessage("");
                }}
              >
                First time signing in or forgot password?
              </button>
              {message && <p className={`form-message ${isError ? "error" : "success"}`}>{message}</p>}
            </form>
          )
        ) : (
          <>
            <div className="admin-tabs">
              <button className={tab === "events" ? "active" : ""} onClick={() => setTab("events")}>
                Events
              </button>
              <button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>
                Projects
              </button>
              <button className={tab === "officers" ? "active" : ""} onClick={() => setTab("officers")}>
                Officers
              </button>
            </div>
            {tab === "events" && (
              <AdminSection title={editingEventId ? "Edit event" : "Add an event"} onSubmit={saveEvent}>
                <AdminInput
                  label="Title"
                  value={eventDraft.title}
                  onChange={(value) => setEventDraft({ ...eventDraft, title: value })}
                />
                <AdminInput
                  label="Description"
                  value={eventDraft.description ?? ""}
                  onChange={(value) => setEventDraft({ ...eventDraft, description: value })}
                />
                <div className="admin-two-col">
                  <AdminInput
                    label="Date"
                    type="date"
                    value={eventDraft.event_date}
                    onChange={(value) => setEventDraft({ ...eventDraft, event_date: value })}
                  />
                  <AdminInput
                    label="Timezone"
                    value={eventDraft.timezone}
                    onChange={(value) => setEventDraft({ ...eventDraft, timezone: value })}
                  />
                </div>
                <div className="admin-two-col">
                  <AdminInput
                    label="Start"
                    type="time"
                    value={eventDraft.start_time}
                    onChange={(value) => setEventDraft({ ...eventDraft, start_time: value })}
                  />
                  <AdminInput
                    label="End"
                    type="time"
                    value={eventDraft.end_time}
                    onChange={(value) => setEventDraft({ ...eventDraft, end_time: value })}
                  />
                </div>
                <AdminInput
                  label="Location"
                  value={eventDraft.location ?? ""}
                  onChange={(value) => setEventDraft({ ...eventDraft, location: value })}
                />
                <AdminInput
                  label="Registration URL"
                  type="url"
                  value={eventDraft.registration_url ?? ""}
                  onChange={(value) => setEventDraft({ ...eventDraft, registration_url: value })}
                />
                <button className="button button-burgundy" type="submit">
                  {editingEventId ? "Update event" : "Save event"} <Plus size={16} />
                </button>
                <AdminList
                  items={events}
                  onEdit={(id) => {
                    const item = events.find((event) => event.id === id);
                    if (item) {
                      setEventDraft(item);
                      setEditingEventId(id);
                    }
                  }}
                  onRemove={(id) => void remove("events", id)}
                />
              </AdminSection>
            )}
            {tab === "projects" && (
              <AdminSection title={editingProjectId ? "Edit project" : "Add a project"} onSubmit={saveProject}>
                <AdminInput
                  label="Title"
                  value={projectDraft.title}
                  onChange={(value) => setProjectDraft({ ...projectDraft, title: value })}
                />
                <AdminInput
                  label="Description"
                  value={projectDraft.description ?? ""}
                  onChange={(value) => setProjectDraft({ ...projectDraft, description: value })}
                />
                <AdminInput
                  label="Status"
                  value={projectDraft.status ?? ""}
                  onChange={(value) => setProjectDraft({ ...projectDraft, status: value })}
                />
                <button className="button button-burgundy" type="submit">
                  {editingProjectId ? "Update project" : "Save project"} <Plus size={16} />
                </button>
                <AdminList
                  items={projects}
                  onEdit={(id) => {
                    const item = projects.find((project) => project.id === id);
                    if (item) {
                      setProjectDraft(item);
                      setEditingProjectId(id);
                    }
                  }}
                  onRemove={(id) => void remove("projects", id)}
                />
              </AdminSection>
            )}
            {tab === "officers" && (
              <AdminSection title={editingOfficerId ? "Edit officer" : "Add an officer"} onSubmit={saveOfficer}>
                <AdminInput
                  label="Name"
                  value={officerDraft.name}
                  onChange={(value) => setOfficerDraft({ ...officerDraft, name: value })}
                />
                <AdminInput
                  label="Role"
                  value={officerDraft.role}
                  onChange={(value) => setOfficerDraft({ ...officerDraft, role: value })}
                />
                <AdminInput
                  label="Bio"
                  value={officerDraft.bio ?? ""}
                  onChange={(value) => setOfficerDraft({ ...officerDraft, bio: value })}
                />
                <AdminInput
                  label="Photo URL"
                  type="url"
                  value={officerDraft.photo_url ?? ""}
                  onChange={(value) => setOfficerDraft({ ...officerDraft, photo_url: value })}
                />
                <AdminInput
                  label="Display order"
                  type="number"
                  value={String(officerDraft.display_order)}
                  onChange={(value) => setOfficerDraft({ ...officerDraft, display_order: Number(value) })}
                />
                <button className="button button-burgundy" type="submit">
                  {editingOfficerId ? "Update officer" : "Save officer"} <Plus size={16} />
                </button>
                <AdminList
                  items={officers}
                  onEdit={(id) => {
                    const item = officers.find((officer) => officer.id === id);
                    if (item) {
                      setOfficerDraft(item);
                      setEditingOfficerId(id);
                    }
                  }}
                  onRemove={(id) => void remove("officers", id)}
                />
              </AdminSection>
            )}
            <button className="sign-out" onClick={() => void signOut()}>
              Sign out
            </button>
            {message && <p className={`form-message ${isError ? "error" : "success"}`}>{message}</p>}
          </>
        )}
      </aside>
    </div>
  );
}

function AdminSection({
  title,
  onSubmit,
  children,
}: {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <form className="admin-section" onSubmit={onSubmit}>
      <h3>{title}</h3>
      {children}
    </form>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={label !== "Description" && label !== "Photo URL" && label !== "Registration URL"}
      />
    </label>
  );
}

function AdminList({
  items,
  onEdit,
  onRemove,
}: {
  items: Array<{ id: string; title?: string; name?: string }>;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="admin-list">
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.title || item.name}</span>
          <span className="admin-list-actions">
            <button type="button" aria-label={`Edit ${item.title || item.name}`} onClick={() => onEdit(item.id)}>
              <Pencil size={15} />
            </button>
            <button type="button" aria-label={`Remove ${item.title || item.name}`} onClick={() => onRemove(item.id)}>
              <Trash2 size={15} />
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
