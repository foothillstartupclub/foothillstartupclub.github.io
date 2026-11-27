import { z } from "zod";

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

const emailInputSchema = z.object({ email: z.string().trim().min(3).max(320).email() });

const signupInputSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().min(3).max(320).email(),
    workingOnProject: z.boolean(),
    projectRole: z.string().nullable(),
    membershipType: z.enum(["founder", "general_member", "other"]),
    referralSource: z.string().trim().min(1).max(80),
    membershipOther: z.string().trim().max(160).optional().default(""),
    referralOther: z.string().trim().max(160).optional().default(""),
  })
  .superRefine((input, context) => {
    if (input.workingOnProject && !["founder", "team_member"].includes(input.projectRole ?? "")) {
      context.addIssue({ code: "custom", message: "A founder or team member role is required." });
    }
    if (!input.workingOnProject && input.projectRole !== null) {
      context.addIssue({ code: "custom", message: "A project role requires a project." });
    }
    if (input.membershipType === "other" && input.membershipOther.length < 1) {
      context.addIssue({ code: "custom", message: "Tell us how you'd like to join." });
    }
  });

type SignupInput = {
  fullName: string;
  email: string;
  workingOnProject: boolean;
  projectRole: string | null;
  membershipType: string;
  referralSource: string;
  membershipOther?: string;
  referralOther?: string;
};


function saveError(message: string) {
  return { data: null, error: new Error(message) };
}

export async function subscribeEmail(email: string) {
  try {
    const parsed = emailInputSchema.parse({ email });
    const { error } = await supabase.rpc("subscribe_email", { p_email: parsed.email });
    if (error) {
      console.error("Supabase subscribe_email failed", error);
      return saveError("Could not save email.");
    }
    return { data: null, error: null };
  } catch {
    return saveError("Could not save email.");
  }
}

export async function submitSignup(input: SignupInput) {
  try {
    const parsed = signupInputSchema.parse(input);
    const { error } = await supabase.rpc("submit_signup", {
      p_full_name: parsed.fullName,
      p_email: parsed.email,
      p_working_on_project: parsed.workingOnProject,
      p_project_role: parsed.projectRole as string,
      p_membership_type: parsed.membershipType,
      p_referral_source: parsed.referralSource,
      p_membership_other: parsed.membershipType === "other" ? parsed.membershipOther : "",
      p_referral_other: parsed.referralOther ? parsed.referralOther : "",
    });
    if (error) {
      console.error("Supabase submit_signup failed", error);
      return saveError("Could not submit signup.");
    }
    return { data: null, error: null };
  } catch {
    return saveError("Could not submit signup.");
  }
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