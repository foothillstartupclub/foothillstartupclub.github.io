import { supabase } from "@/integrations/supabase/client";

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  location: string | null;
  registration_url: string | null;
};

export type Project = { id: string; title: string; description: string | null; status: string | null };
export type Officer = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  display_order: number;
};
export type EventDraft = Omit<EventItem, "id">;
export type ProjectDraft = Omit<Project, "id">;
export type OfficerDraft = Omit<Officer, "id">;

export async function loadClubContent() {
  return Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: true }).order("start_time", { ascending: true }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("officers").select("*").order("display_order", { ascending: true }),
  ]);
}

export async function subscribeEmail(email: string) {
  return supabase.rpc("subscribe_email", { p_email: email });
}

export async function submitSignup(input: {
  fullName: string;
  email: string;
  workingOnProject: boolean;
  projectRole: string | null;
  membershipType: string;
  referralSource: string;
}) {
  return supabase.rpc("submit_signup", {
    p_full_name: input.fullName,
    p_email: input.email,
    p_working_on_project: input.workingOnProject,
    p_project_role: (input.projectRole ?? null) as unknown as string,
    p_membership_type: input.membershipType,
    p_referral_source: input.referralSource,
  });
}

export async function signInOfficer(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) return { authorized: false, error: result.error };
  const access = await supabase.from("officer_access").select("user_id").maybeSingle();
  if (access.error || !access.data) {
    await supabase.auth.signOut();
    return { authorized: false, error: new Error("Unauthorized officer") };
  }
  return { authorized: true, error: null };
}

export async function requestOfficerPasswordSetup(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
}

export async function completeOfficerPasswordSetup(password: string) {
  const update = await supabase.auth.updateUser({ password });
  if (update.error) return { authorized: false, error: update.error };
  const access = await supabase.from("officer_access").select("user_id").maybeSingle();
  if (access.error || !access.data) {
    await supabase.auth.signOut();
    return { authorized: false, error: new Error("Unauthorized officer") };
  }
  return { authorized: true, error: null };
}

export function signOutOfficer() {
  return supabase.auth.signOut();
}

export function saveEvent(draft: EventDraft, id?: string) {
  return id
    ? supabase.from("events").update(draft).eq("id", id).select().single()
    : supabase.from("events").insert(draft).select().single();
}

export function saveProject(draft: ProjectDraft, id?: string) {
  return id
    ? supabase.from("projects").update(draft).eq("id", id).select().single()
    : supabase.from("projects").insert(draft).select().single();
}

export function saveOfficer(draft: OfficerDraft, id?: string) {
  return id
    ? supabase.from("officers").update(draft).eq("id", id).select().single()
    : supabase.from("officers").insert(draft).select().single();
}

export function removeClubContent(table: "events" | "projects" | "officers", id: string) {
  return supabase.from(table).delete().eq("id", id);
}