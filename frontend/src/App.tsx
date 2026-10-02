import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileUp,
  Filter,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  UsersRound,
  WandSparkles,
  X,
} from "lucide-react";
import "./App.css";
import "./workspace.css";

type LeadStatus = "New" | "Sent" | "Opened" | "Replied";
type Channel = "Email" | "SMS";
type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  status: LeadStatus;
  createdAt: string;
  response?: string;
  responseSummary?: { summary: string; action: string };
};
type Campaign = {
  id: string;
  name: string;
  channel: Channel;
  audience: string;
  goal: string;
  status: string;
  createdAt: string;
  scheduledAt?: string | null;
};
type Message = {
  id: string;
  leadId: string;
  campaignId: string | null;
  channel: Channel;
  subject: string;
  content: string;
  status: string;
  aiGenerated: boolean;
  sentAt: string | null;
};
type Variant = { subject: string; content: string };
type Workspace = { leads: Lead[]; campaigns: Campaign[]; messages: Message[] };
type Page = "overview" | "leads" | "campaigns" | "composer" | "analytics";

const STORAGE_KEY = "signaldesk-react-demo-v1";
const TODAY_LABEL = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
})
  .format(new Date())
  .toUpperCase();
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.BASE_URL === "/" ? location.origin : "")
).replace(/\/$/, "");
const sample: Workspace = {
  leads: [
    {
      id: "l-1",
      firstName: "Avery",
      lastName: "Chen",
      company: "Meridian Health",
      role: "VP of Marketing",
      email: "avery.chen@example.test",
      phone: "+1 415 555 0184",
      notes: "Expanding into two new markets. Interested in patient retention.",
      status: "Replied",
      createdAt: "2026-10-01",
      response: "Can you send pricing and a couple of healthcare case studies?",
      responseSummary: {
        summary: "The lead asked about pricing or budget.",
        action:
          "Send a concise pricing overview and connect the investment to a relevant outcome.",
      },
    },
    {
      id: "l-2",
      firstName: "Marcus",
      lastName: "Reed",
      company: "Fieldwork",
      role: "Founder",
      email: "marcus@example.test",
      phone: "+1 415 555 0162",
      notes: "Small product studio hiring its first growth marketer.",
      status: "Sent",
      createdAt: "2026-09-30",
    },
    {
      id: "l-3",
      firstName: "Priya",
      lastName: "Nair",
      company: "Northstar Finance",
      role: "Head of Growth",
      email: "priya@example.test",
      phone: "+1 212 555 0145",
      notes: "Focused on reducing customer acquisition costs.",
      status: "Opened",
      createdAt: "2026-09-29",
    },
    {
      id: "l-4",
      firstName: "Theo",
      lastName: "Williams",
      company: "Juniper & Co.",
      role: "Managing Director",
      email: "theo@example.test",
      phone: "+1 312 555 0128",
      notes: "Boutique ecommerce brand planning seasonal campaigns.",
      status: "New",
      createdAt: "2026-09-28",
    },
    {
      id: "l-5",
      firstName: "Sofia",
      lastName: "Martinez",
      company: "Brightpath Learning",
      role: "Director of Partnerships",
      email: "sofia@example.test",
      phone: "+1 617 555 0107",
      notes: "Exploring partnerships before the next enrollment cycle.",
      status: "Replied",
      createdAt: "2026-09-27",
      response: "Could we schedule a call next week?",
      responseSummary: {
        summary: "The lead is open to scheduling a conversation.",
        action: "Offer two specific times and include a short agenda.",
      },
    },
    {
      id: "l-6",
      firstName: "Noah",
      lastName: "Bennett",
      company: "Kindred Goods",
      role: "COO",
      email: "noah@example.test",
      phone: "+1 503 555 0171",
      notes: "Growing DTC revenue; lean team.",
      status: "Sent",
      createdAt: "2026-09-26",
    },
  ],
  campaigns: [
    {
      id: "c-1",
      name: "Q3 Growth Leaders",
      channel: "Email",
      audience: "New prospects",
      goal: "Book a discovery call",
      status: "Active",
      createdAt: "2026-09-30",
    },
    {
      id: "c-2",
      name: "Customer Story Follow-up",
      channel: "Email",
      audience: "Follow-up queue",
      goal: "Share a customer story",
      status: "Active",
      createdAt: "2026-09-24",
    },
    {
      id: "c-3",
      name: "Founder Intro — SMS",
      channel: "SMS",
      audience: "New prospects",
      goal: "Start a conversation",
      status: "Paused",
      createdAt: "2026-09-20",
    },
  ],
  messages: [
    {
      id: "m-1",
      leadId: "l-1",
      campaignId: "c-1",
      channel: "Email",
      subject: "A thought for Meridian Health",
      content:
        "Hi Avery, I noticed Meridian Health is expanding into new markets. Would a brief conversation about patient retention be useful?",
      status: "Replied",
      aiGenerated: true,
      sentAt: "2026-10-01",
    },
    {
      id: "m-2",
      leadId: "l-2",
      campaignId: "c-1",
      channel: "Email",
      subject: "A growth idea for Fieldwork",
      content:
        "Hi Marcus, growing a product studio can make outreach harder to scale. Open to a short conversation?",
      status: "Sent",
      aiGenerated: true,
      sentAt: "2026-09-30",
    },
    {
      id: "m-3",
      leadId: "l-3",
      campaignId: "c-2",
      channel: "Email",
      subject: "Lowering acquisition costs",
      content:
        "Hi Priya, I saw Northstar is focused on acquisition efficiency. Would a customer story be useful?",
      status: "Opened",
      aiGenerated: true,
      sentAt: "2026-09-29",
    },
    {
      id: "m-4",
      leadId: "l-5",
      campaignId: "c-1",
      channel: "Email",
      subject: "Partnerships at Brightpath",
      content:
        "Hi Sofia, with Brightpath planning for enrollment, would a quick call next week be useful?",
      status: "Replied",
      aiGenerated: true,
      sentAt: "2026-09-27",
    },
  ],
};

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: UsersRound },
  { id: "campaigns", label: "Campaigns", icon: Send },
  { id: "composer", label: "AI composer", icon: WandSparkles },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

function loadSample(): Workspace {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Workspace;
  } catch {
    /* Use sample data if local browser storage is unavailable. */
  }
  return structuredClone(sample);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}/api${path}`, { ...init, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.status === 204
    ? (null as T)
    : (response.json() as Promise<T>);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' && quoted && source[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeWorkspace(raw: Record<string, unknown>): Workspace {
  const leads = (raw.leads as Record<string, unknown>[]).map((item) => ({
    id: String(item.id),
    firstName: String(item.first_name),
    lastName: String(item.last_name || ""),
    company: String(item.company),
    role: String(item.role || ""),
    email: String(item.email || ""),
    phone: String(item.phone || ""),
    notes: String(item.notes || ""),
    status: String(item.status) as LeadStatus,
    createdAt: String(item.created_at || "").slice(0, 10),
    response: item.response ? String(item.response) : undefined,
    responseSummary: item.response_summary
        ? {
          summary: String(item.response_summary),
          action: String(item.response_action || "Review the reply and choose a human-approved next step."),
        }
      : undefined,
  }));
  const campaigns = (raw.campaigns as Record<string, unknown>[]).map(
    (item) => ({
      id: String(item.id),
      name: String(item.name),
      channel: String(item.channel) as Channel,
      audience: String(item.audience),
      goal: String(item.goal || ""),
      status: String(item.status),
      createdAt: String(item.created_at || "").slice(0, 10),
      scheduledAt: item.scheduled_at ? String(item.scheduled_at) : null,
    }),
  );
  const messages = (raw.messages as Record<string, unknown>[]).map((item) => ({
    id: String(item.id),
    leadId: String(item.lead_id),
    campaignId: item.campaign_id ? String(item.campaign_id) : null,
    channel: String(item.channel) as Channel,
    subject: String(item.subject || ""),
    content: String(item.content),
    status: String(item.status),
    aiGenerated: Boolean(item.ai_generated),
    sentAt: item.sent_at ? String(item.sent_at).slice(0, 10) : null,
  }));
  return { leads, campaigns, messages };
}

function initials(lead: Lead) {
  return `${lead.firstName[0] || ""}${lead.lastName[0] || ""}`.toUpperCase();
}
function dateLabel(value: string) {
  return value
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(`${value}T12:00:00`),
      )
    : "—";
}
function summarize(text: string) {
  const lower = text.toLowerCase();
  if (/price|pricing|cost|budget|quote/.test(lower))
    return {
      summary: "The lead asked about pricing or budget.",
      action:
        "Send a concise pricing overview and connect the investment to a relevant business outcome.",
    };
  if (/meeting|call|schedule|available|calendar|next week/.test(lower))
    return {
      summary: "The lead is open to scheduling a conversation.",
      action: "Offer two specific times and include a short agenda.",
    };
  if (/case stud|example|reference|customer story/.test(lower))
    return {
      summary: "The lead wants a relevant customer example.",
      action:
        "Share the closest matching case study and highlight a role-relevant result.",
    };
  if (/not now|later|next quarter|busy|timing/.test(lower))
    return {
      summary: "The lead signaled that timing may be a concern.",
      action: "Acknowledge their timing and set a considerate follow-up date.",
    };
  if (/no thanks|not interested|unsubscribe|remove me/.test(lower))
    return {
      summary: "The lead declined further outreach.",
      action: "Respect the request and suppress further campaign messages.",
    };
  return {
    summary: "The lead responded; intent needs a quick human review.",
    action: "Acknowledge the specific point and suggest one clear next step.",
  };
}
function fallbackDraft(
  lead: Lead,
  channel: Channel,
  tone: string,
  goal: string,
): Variant[] {
  const first = lead.firstName || "there";
  const company = lead.company || "your team";
  const context = lead.notes.toLowerCase().includes("retention")
    ? "customer retention"
    : lead.notes.toLowerCase().includes("growth")
      ? "growth and customer conversations"
      : "more relevant customer outreach";
  const close =
    tone === "Friendly"
      ? "Would you be up for a quick chat?"
      : tone === "Aggressive"
        ? "Could we put 15 minutes on the calendar this week?"
        : tone === "Consultative"
          ? "Would it be useful to compare approaches?"
          : "Would a brief conversation next week be worthwhile?";
  const result = [
    {
      subject: `A thought for ${company}`,
      content: `Hi ${first},\n\nI noticed ${company} is focused on ${context}. We help teams make outreach more personal and easier to learn from.\n\n${goal}? ${close}\n\nBest,\nSam`,
    },
    {
      subject: `${company}: a practical idea`,
      content: `Hi ${first},\n\nYour work at ${company} caught my attention. Teams working on ${context} often want a consistent way to start useful conversations.\n\nIf ${goal} is on your radar, I can share a couple of ideas. ${close}\n\nBest,\nSam`,
    },
    {
      subject: `Quick question, ${first}`,
      content: `Hi ${first},\n\nHow is ${company} approaching ${context} right now? I thought there could be a useful conversation.\n\n${close}\n\nBest,\nSam`,
    },
  ];
  return channel === "SMS"
    ? result.map((_, index) => ({
        subject: "",
        content: [
          `Hi ${first}, noticed ${company} is focused on ${context}. We help make outreach more relevant without extra busywork. ${close}`,
          `Hey ${first}, a quick thought for ${company}: better outreach could support ${context}. Want to compare notes?`,
          `${first}, how is ${company} approaching ${context}? I have one practical idea if this is a priority. Worth a quick chat?`,
        ][index],
      }))
    : result;
}

function App() {
  const [workspace, setWorkspace] = useState<Workspace>(loadSample);
  const [page, setPage] = useState<Page>("overview");
  const [connected, setConnected] = useState(!API_BASE);
  const [apiStatus, setApiStatus] = useState(
    API_BASE ? "Connecting to workspace…" : "Browser demo · local data",
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<"lead" | "campaign" | "reply" | null>(
    null,
  );
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [replyLead, setReplyLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState("");
  const [channel, setChannel] = useState<Channel>("Email");
  const [tone, setTone] = useState("Professional");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [goal, setGoal] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(
    null,
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  };
  const syncApi = async () => {
    const [raw, stats] = await Promise.all([
      api<Record<string, unknown>>("/bootstrap"),
      api<Record<string, unknown>>("/analytics"),
    ]);
    setWorkspace(normalizeWorkspace(raw));
    setAnalytics(stats);
    setConnected(true);
    setApiStatus("PostgreSQL · API connected");
  };
  useEffect(() => {
    if (!API_BASE) return;
    let active = true;
    Promise.all([
      api<Record<string, unknown>>("/bootstrap"),
      api<Record<string, unknown>>("/analytics"),
    ])
      .then(([raw, stats]) => {
        if (active) {
          setWorkspace(normalizeWorkspace(raw));
          setAnalytics(stats);
          setConnected(true);
          setApiStatus("PostgreSQL · API connected");
        }
      })
      .catch((error: Error) => {
        if (active) {
          setConnected(false);
          setApiStatus("API unavailable");
          notify(error.message);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!API_BASE) localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  const request = async <T,>(path: string, init?: RequestInit) => {
    if (API_BASE) {
      if (!connected)
        throw new Error(
          "The API is not connected. Check the backend and retry.",
        );
      return api<T>(path, init);
    }
    throw new Error("No backend is configured.");
  };
  const selectPage = (next: Page) => {
    setPage(next);
    setMobileNav(false);
  };
  const openAddLead = () => {
    setEditingLead(null);
    setModal("lead");
  };
  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = {
      firstName: String(form.get("firstName") || "").trim(),
      lastName: String(form.get("lastName") || "").trim(),
      company: String(form.get("company") || "").trim(),
      role: String(form.get("role") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      notes: String(form.get("notes") || "").trim(),
    };
    try {
      if (API_BASE) {
        const payload = {
          first_name: fields.firstName,
          last_name: fields.lastName,
          company: fields.company,
          role: fields.role,
          email: fields.email,
          phone: fields.phone,
          notes: fields.notes,
        };
        await request(editingLead ? `/leads/${editingLead.id}` : "/leads", {
          method: editingLead ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        });
        await syncApi();
      } else if (editingLead)
        setWorkspace((current) => ({
          ...current,
          leads: current.leads.map((lead) =>
            lead.id === editingLead.id ? { ...lead, ...fields } : lead,
          ),
        }));
      else
        setWorkspace((current) => ({
          ...current,
          leads: [
            {
              ...fields,
              id: crypto.randomUUID(),
              status: "New",
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...current.leads,
          ],
        }));
      setModal(null);
      notify(editingLead ? "Lead updated." : "Lead added to your workspace.");
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const submitCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = {
      name: String(form.get("name") || "").trim(),
      channel: String(form.get("channel") || "Email") as Channel,
      audience: String(form.get("audience") || "All active leads"),
      goal: String(form.get("goal") || "").trim(),
      scheduledAt: String(form.get("scheduledAt") || ""),
    };
    try {
      if (API_BASE)
        await request("/campaigns", {
          method: "POST",
          body: JSON.stringify({
            name: fields.name,
            channel: fields.channel,
            audience: fields.audience,
            goal: fields.goal,
            scheduled_at: fields.scheduledAt
              ? new Date(fields.scheduledAt).toISOString()
              : null,
          }),
        });
      else
        setWorkspace((current) => ({
          ...current,
          campaigns: [
            {
              ...fields,
              id: crypto.randomUUID(),
              status: "Active",
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...current.campaigns,
          ],
        }));
      if (API_BASE) await syncApi();
      setModal(null);
      notify("Campaign created.");
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (API_BASE) {
        const upload = new FormData();
        upload.append("file", file);
        const result = await request<{
          imported: number;
          skipped_duplicates: number;
        }>("/leads/import.csv", { method: "POST", body: upload });
        await syncApi();
        notify(
          `Imported ${result.imported} leads; skipped ${result.skipped_duplicates} duplicate emails.`,
        );
        selectPage("leads");
        event.target.value = "";
        return;
      }
      const [headersRow, ...lines] = parseCsv(await file.text());
      if (!headersRow) throw new Error("CSV needs a header row.");
      const headers = headersRow.map((value) =>
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
      );
      const column = (keys: string[]) =>
        headers.findIndex((header) => keys.includes(header));
      const indexes = {
        firstName: column(["firstname", "first"]),
        lastName: column(["lastname", "last"]),
        company: column(["company", "companyname", "organization"]),
        role: column(["role", "title", "jobtitle"]),
        email: column(["email", "emailaddress"]),
        phone: column(["phone", "phonenumber"]),
        notes: column(["notes", "context", "description"]),
      };
      if (indexes.firstName < 0 || indexes.company < 0)
        throw new Error("CSV needs first name and company columns.");
      const rows = lines
        .map((values) => ({
          first_name: values[indexes.firstName] || "",
          last_name: values[indexes.lastName] || "",
          company: values[indexes.company] || "",
          role: values[indexes.role] || "",
          email: values[indexes.email] || "",
          phone: values[indexes.phone] || "",
          notes: values[indexes.notes] || "",
        }))
        .filter((lead) => lead.first_name && lead.company);
      if (!rows.length) throw new Error("No valid leads found in this CSV.");
      const knownEmails = new Set(
        workspace.leads.map((lead) => lead.email.toLowerCase()).filter(Boolean),
      );
      const uniqueRows = rows.filter((lead) => {
        const email = lead.email.toLowerCase();
        if (!email) return true;
        if (knownEmails.has(email)) return false;
        knownEmails.add(email);
        return true;
      });
      const additions = uniqueRows.map((lead) => ({
        id: crypto.randomUUID(),
        firstName: lead.first_name,
        lastName: lead.last_name,
        company: lead.company,
        role: lead.role,
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
        status: "New" as LeadStatus,
        createdAt: new Date().toISOString().slice(0, 10),
      }));
      setWorkspace((current) => ({
        ...current,
        leads: [...additions, ...current.leads],
      }));
      notify(
        `Imported ${additions.length} leads${rows.length > additions.length ? `; skipped ${rows.length - additions.length} duplicate emails` : ""}.`,
      );
      selectPage("leads");
    } catch (error) {
      notify((error as Error).message);
    }
    event.target.value = "";
  };
  const generate = async () => {
    const lead =
      workspace.leads.find((item) => item.id === selectedLeadId) ||
      workspace.leads[0];
    if (!lead) {
      notify("Add a lead before generating outreach.");
      return;
    }
    const campaign = workspace.campaigns.find(
      (item) => item.id === selectedCampaignId,
    );
    const campaignGoal =
      goal || campaign?.goal || "Start a useful conversation";
    setGenerating(true);
    try {
      let drafts: Variant[];
      if (API_BASE) {
        const result = await request<{ variants: Variant[] }>(
          "/outreach/generate",
          {
            method: "POST",
            body: JSON.stringify({
              lead_id: lead.id,
              campaign_id: selectedCampaignId || null,
              channel,
              tone,
              goal: campaignGoal,
              variants: 3,
            }),
          },
        );
        drafts = result.variants;
      } else drafts = fallbackDraft(lead, channel, tone, campaignGoal);
      setSelectedLeadId(lead.id);
      setVariants(drafts);
      setActiveVariant(0);
      notify("Three options are ready. Review and edit before saving.");
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setGenerating(false);
    }
  };
  const saveMessage = async (send = false) => {
    const lead =
      workspace.leads.find((item) => item.id === selectedLeadId) ||
      workspace.leads[0];
    const variant = variants[activeVariant];
    if (!lead || !variant) return;
    try {
      if (API_BASE) {
        const created = await request<Message>("/messages", {
          method: "POST",
          body: JSON.stringify({
            lead_id: lead.id,
            campaign_id: selectedCampaignId || null,
            channel,
            subject: variant.subject,
            content: variant.content,
            ai_generated: true,
            variant: activeVariant + 1,
          }),
        });
        if (send)
          await request(`/messages/${created.id}/send`, { method: "POST" });
        await syncApi();
      } else {
        const message = {
          ...variant,
          id: crypto.randomUUID(),
          leadId: lead.id,
          campaignId: selectedCampaignId || null,
          channel,
          status: send ? "Sent" : "Draft",
          aiGenerated: true,
          sentAt: send ? new Date().toISOString().slice(0, 10) : null,
        };
        setWorkspace((current) => ({
          ...current,
          messages: [message, ...current.messages],
          leads: current.leads.map((item) =>
            item.id === lead.id && send && item.status === "New"
              ? { ...item, status: "Sent" }
              : item,
          ),
        }));
      }
      setVariants([]);
      notify(
        send
          ? "Marked sent in the log. No external message was delivered."
          : "Draft saved to message history.",
      );
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const submitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyLead) return;
    const content = String(
      new FormData(event.currentTarget).get("reply") || "",
    ).trim();
    if (!content) return;
    const insight = summarize(content);
    try {
      if (API_BASE)
        await request(`/leads/${replyLead.id}/replies`, {
          method: "POST",
          body: JSON.stringify({ content }),
        });
      else
        setWorkspace((current) => ({
          ...current,
          leads: current.leads.map((lead) =>
            lead.id === replyLead.id
              ? {
                  ...lead,
                  response: content,
                  responseSummary: insight,
                  status: "Replied",
                }
              : lead,
          ),
          messages: current.messages.map((message) =>
            message.leadId === replyLead.id && message.status !== "Draft"
              ? { ...message, status: "Replied" }
              : message,
          ),
        }));
      if (API_BASE) await syncApi();
      setModal(null);
      setReplyLead(null);
      notify(`${insight.summary} Next: ${insight.action}`);
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const markSent = async (message: Message) => {
    try {
      if (API_BASE) {
        await request(`/messages/${message.id}/send`, { method: "POST" });
        await syncApi();
      } else
        setWorkspace((current) => ({
          ...current,
          messages: current.messages.map((item) =>
            item.id === message.id
              ? {
                  ...item,
                  status: "Sent",
                  sentAt: new Date().toISOString().slice(0, 10),
                }
              : item,
          ),
        }));
      notify(
        "Message marked sent in the activity log; nothing was delivered externally.",
      );
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const trackEngagement = async (
    message: Message,
    eventType: "Opened" | "Clicked",
  ) => {
    try {
      if (API_BASE) {
        await request(`/messages/${message.id}/events`, {
          method: "POST",
          body: JSON.stringify({ event_type: eventType }),
        });
        await syncApi();
      } else
        setWorkspace((current) => ({
          ...current,
          messages: current.messages.map((item) =>
            item.id === message.id ? { ...item, status: eventType } : item,
          ),
        }));
      notify(`${eventType} activity recorded.`);
    } catch (error) {
      notify((error as Error).message);
    }
  };

  const sentMessages = workspace.messages.filter(
    (message) => message.status !== "Draft",
  );
  const replied = sentMessages.filter(
    (message) => message.status === "Replied",
  ).length;
  const opened = sentMessages.filter((message) =>
    ["Opened", "Clicked", "Replied"].includes(message.status),
  ).length;
  const replyRate = sentMessages.length
    ? Math.round((replied / sentMessages.length) * 100)
    : 0;
  const openRate = sentMessages.length
    ? Math.round((opened / sentMessages.length) * 100)
    : 0;
  const filteredLeads = workspace.leads.filter(
    (lead) =>
      (filter === "All statuses" || lead.status === filter) &&
      `${lead.firstName} ${lead.lastName} ${lead.company} ${lead.email} ${lead.role}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pageCopy: Record<
    Page,
    { eyebrow: string; title: string; subtitle: string }
  > = {
    overview: {
      eyebrow: TODAY_LABEL,
      title: "Good morning, Sam",
      subtitle: "Here’s what’s happening across your outreach today.",
    },
    leads: {
      eyebrow: "RELATIONSHIPS",
      title: "Leads",
      subtitle:
        "Keep prospect context close and make every follow-up personal.",
    },
    campaigns: {
      eyebrow: "OUTREACH PROGRAMS",
      title: "Campaigns",
      subtitle: "Coordinate outreach and learn what earns a response.",
    },
    composer: {
      eyebrow: "HUMAN-REVIEWED AI",
      title: "AI outreach composer",
      subtitle:
        "Turn useful context into a relevant first message. Review every draft before saving or sending.",
    },
    analytics: {
      eyebrow: "MEASURE WHAT MATTERS",
      title: "Analytics",
      subtitle: "Engagement signals to help improve the next campaign.",
    },
  };

  const renderLeadTable = (leads: Lead[]) => (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>CONTACT</th>
            <th>COMPANY</th>
            <th>ROLE</th>
            <th>STATUS</th>
            <th>ADDED</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <div className="person-cell">
                  <span className="avatar">{initials(lead)}</span>
                  <span>
                    <b>
                      {lead.firstName} {lead.lastName}
                    </b>
                    <small>{lead.email || "No email added"}</small>
                  </span>
                </div>
              </td>
              <td>{lead.company}</td>
              <td>{lead.role || "—"}</td>
              <td>
                <span
                  className={`status status-${lead.status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {lead.status}
                </span>
              </td>
              <td>{dateLabel(lead.createdAt)}</td>
              <td>
                <div className="row-actions">
                  <button
                    className="text-action"
                    onClick={() => {
                      setReplyLead(lead);
                      setModal("reply");
                    }}
                  >
                    {lead.response ? "Reply" : "Log reply"}
                  </button>
                  <button
                    className="text-action"
                    onClick={() => {
                      setEditingLead(lead);
                      setModal("lead");
                    }}
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!leads.length && (
            <tr>
              <td colSpan={6}>
                <div className="empty-state">
                  <b>No leads found</b>
                  <span>Add or import leads to build your workspace.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderActivityTable = (messages: Message[]) => (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>CONTACT</th>
            <th>CAMPAIGN</th>
            <th>CHANNEL</th>
            <th>STATUS</th>
            <th>DATE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {messages.slice(0, 7).map((message) => {
            const lead = workspace.leads.find(
              (item) => item.id === message.leadId,
            );
            const campaign = workspace.campaigns.find(
              (item) => item.id === message.campaignId,
            );
            return (
              <tr key={message.id}>
                <td>
                  {lead ? `${lead.firstName} ${lead.lastName}` : "Unknown lead"}
                </td>
                <td>{campaign?.name || "One-off message"}</td>
                <td>{message.channel}</td>
                <td>
                  <span
                    className={`status status-${message.status.toLowerCase()}`}
                  >
                    {message.status}
                  </span>
                </td>
                <td>{dateLabel(message.sentAt || "")}</td>
                <td>
                  {message.status === "Draft" && (
                    <button
                      className="text-action"
                      onClick={() => void markSent(message)}
                    >
                      Mark sent
                    </button>
                  )}
                  {message.status === "Sent" && (
                    <button
                      className="text-action"
                      onClick={() => void trackEngagement(message, "Opened")}
                    >
                      Mark opened
                    </button>
                  )}
                  {message.status === "Opened" && (
                    <button
                      className="text-action"
                      onClick={() => void trackEngagement(message, "Clicked")}
                    >
                      Mark clicked
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {!messages.length && (
            <tr>
              <td colSpan={6}>
                <div className="empty-state">
                  <b>No message activity yet</b>
                  <span>Generate an outreach draft to begin.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const panelTitle = (
    title: string,
    subtitle: string,
    action?: React.ReactNode,
  ) => (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
  const statsCard = (
    title: string,
    value: string | number,
    hint: string,
    icon: React.ReactNode,
    color: string,
  ) => (
    <article className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <span className={`metric-icon ${color}`}>{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
  const openCampaignModal = () => setModal("campaign");

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <a
          className="brand"
          href="#overview"
          onClick={(event) => {
            event.preventDefault();
            selectPage("overview");
          }}
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>
            signal<span className="brand-light">desk</span>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span className="workspace-copy">
            <b>Northstar Studio</b>
            <small>Growth team</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <nav className="primary-nav" aria-label="Main navigation">
          <div className="nav-label">WORKSPACE</div>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${page === id ? "active" : ""}`}
              onClick={() => selectPage(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
              {id === "leads" && (
                <small className="nav-count">
                  {workspace.leads.length.toString().padStart(2, "0")}
                </small>
              )}
              {id === "composer" && <small className="nav-new">AI</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="ai-status">
            <span
              className={`status-pulse ${API_BASE && !connected ? "offline" : ""}`}
            />
            <div>
              <b>AI workspace</b>
              <small>{apiStatus}</small>
            </div>
            <MoreHorizontal size={17} />
          </div>
          <button className="profile-button">
            <span className="profile-avatar">SM</span>
            <span className="profile-copy">
              <b>Sam Morgan</b>
              <small>Workspace admin</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileNav((value) => !value)}
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumbs">
            <span>Northstar Studio</span>
            <i>/</i>
            <b>{navItems.find((item) => item.id === page)?.label}</b>
          </div>
          <div className="topbar-actions">
            <span
              className={`demo-pill ${API_BASE && connected ? "live-pill" : ""}`}
            >
              <i />
              {API_BASE && connected ? "LIVE API" : "SAMPLE WORKSPACE"}
            </span>
            <button
              className="icon-button"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <i />
            </button>
            <button className="help-button" title="Workspace help">
              <CircleHelp size={14} />
            </button>
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{pageCopy[page].eyebrow}</span>
              <h1>{pageCopy[page].title}</h1>
              <p>{pageCopy[page].subtitle}</p>
            </div>
            <div className="heading-actions">
              {page === "overview" && (
                <>
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      document.getElementById("csv-upload")?.click()
                    }
                  >
                    <FileUp size={14} />
                    Import leads
                  </button>
                  <button
                    className="button button-primary"
                    onClick={openCampaignModal}
                  >
                    <Plus size={15} />
                    Create campaign
                  </button>
                </>
              )}
              {page === "leads" && (
                <>
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      document.getElementById("csv-upload")?.click()
                    }
                  >
                    <FileUp size={14} />
                    Upload CSV
                  </button>
                  <button
                    className="button button-primary"
                    onClick={openAddLead}
                  >
                    <Plus size={15} />
                    Add lead
                  </button>
                </>
              )}
              {page === "campaigns" && (
                <button
                  className="button button-primary"
                  onClick={openCampaignModal}
                >
                  <Plus size={15} />
                  Create campaign
                </button>
              )}
            </div>
          </div>
          <input
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={importCsv}
          />

          {page === "overview" && (
            <>
              <section className="metrics-grid">
                {statsCard(
                  "Total leads",
                  workspace.leads.length.toLocaleString(),
                  "Across all segments",
                  <UsersRound size={15} />,
                  "green",
                )}
                {statsCard(
                  "Messages sent",
                  sentMessages.length,
                  "Across all campaigns",
                  <Send size={15} />,
                  "coral",
                )}
                {statsCard(
                  "Reply rate",
                  `${replyRate}%`,
                  `${replied} replies from ${sentMessages.length} sends`,
                  <MessageCircle size={15} />,
                  "yellow",
                )}
                {statsCard(
                  "Active campaigns",
                  workspace.campaigns.filter(
                    (campaign) => campaign.status === "Active",
                  ).length,
                  `${workspace.campaigns.length} total campaigns`,
                  <Activity size={15} />,
                  "teal",
                )}
              </section>
              <section className="dashboard-grid">
                <article className="panel">
                  {panelTitle(
                    "Engagement over time",
                    "Replies and opens across tracked activity",
                    <select className="range-select">
                      <option>Last 30 days</option>
                      <option>Last 7 days</option>
                    </select>,
                  )}
                  <EngagementChart
                    analytics={analytics}
                    messages={workspace.messages}
                  />
                </article>
                <article className="panel recommendations">
                  {panelTitle(
                    "Recommended next steps",
                    "Based on tracked engagement",
                    <span className="insight-tag">AI INSIGHTS</span>,
                  )}
                  {workspace.leads
                    .filter((lead) => lead.response || lead.status === "Opened")
                    .slice(0, 3)
                    .map((lead) => (
                      <div className="recommendation" key={lead.id}>
                        <span className="rec-icon">
                          <Sparkles size={15} />
                        </span>
                        <div>
                          <b>
                            {lead.response
                              ? `Reply to ${lead.firstName} ${lead.lastName}`
                              : `Follow up with ${lead.firstName} ${lead.lastName}`}
                          </b>
                          <p>
                            {lead.responseSummary?.summary ||
                              "Opened an outreach message without replying."}
                          </p>
                          <button
                            className="text-action"
                            onClick={() => {
                              setReplyLead(lead);
                              setModal("reply");
                            }}
                          >
                            Review conversation <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {!workspace.leads.some(
                    (lead) => lead.response || lead.status === "Opened",
                  ) && (
                    <div className="recommendation">
                      <span className="rec-icon">
                        <Clock3 size={15} />
                      </span>
                      <div>
                        <b>Start with new prospects</b>
                        <p>
                          Prioritize leads with fresh context and no previous
                          outreach.
                        </p>
                        <button
                          className="text-action"
                          onClick={() => selectPage("composer")}
                        >
                          Open composer <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              </section>
              <section className="panel">
                {panelTitle(
                  "Recent lead activity",
                  "Your highest-priority conversations",
                  <button
                    className="text-action"
                    onClick={() => selectPage("leads")}
                  >
                    All leads <ArrowRight size={13} />
                  </button>,
                )}
                {renderLeadTable(
                  [...workspace.leads]
                    .sort(
                      (a, b) =>
                        Number(Boolean(b.response)) -
                        Number(Boolean(a.response)),
                    )
                    .slice(0, 5),
                )}
              </section>
            </>
          )}

          {page === "leads" && (
            <>
              <div className="insight-strip">
                <Sparkles size={16} />
                <div>
                  <b>Prioritize conversations, not spreadsheets.</b>
                  <p>
                    {workspace.leads.filter((lead) => lead.response).length}{" "}
                    leads have replied and are ready for a thoughtful next step.
                  </p>
                </div>
              </div>
              <section className="panel table-panel">
                <div className="table-toolbar">
                  <label className="search-field">
                    <Search size={14} />
                    <input
                      placeholder="Search leads or companies"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <label className="filter-field">
                    <Filter size={13} />
                    <select
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                    >
                      <option>All statuses</option>
                      {["New", "Sent", "Opened", "Replied"].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {renderLeadTable(filteredLeads)}
                <div className="table-footer">
                  Showing {filteredLeads.length} of {workspace.leads.length}{" "}
                  leads <span>Sorted by recent activity</span>
                </div>
              </section>
            </>
          )}

          {page === "campaigns" && (
            <>
              <section className="metrics-grid compact-metrics">
                {statsCard(
                  "Total campaigns",
                  workspace.campaigns.length,
                  "Email and SMS",
                  <Send size={15} />,
                  "green",
                )}
                {statsCard(
                  "In progress",
                  workspace.campaigns.filter(
                    (campaign) => campaign.status === "Active",
                  ).length,
                  "Currently running",
                  <Activity size={15} />,
                  "coral",
                )}
                {statsCard(
                  "Messages sent",
                  sentMessages.length,
                  "Across campaigns",
                  <Mail size={15} />,
                  "yellow",
                )}
                {statsCard(
                  "Average reply rate",
                  `${replyRate}%`,
                  "Based on tracked sends",
                  <MessageCircle size={15} />,
                  "teal",
                )}
              </section>
              <section className="panel">
                {panelTitle(
                  "All campaigns",
                  "Performance updates when you track outreach and replies",
                )}
                <div className="campaign-list">
                  {workspace.campaigns.map((campaign) => {
                    const messages = workspace.messages.filter(
                      (message) =>
                        message.campaignId === campaign.id &&
                        message.status !== "Draft",
                    );
                    const engaged = messages.filter((message) =>
                      ["Opened", "Clicked", "Replied"].includes(message.status),
                    ).length;
                    const rate = messages.length
                      ? Math.round((engaged / messages.length) * 100)
                      : 0;
                    return (
                      <div className="campaign-row" key={campaign.id}>
                        <div>
                          <b>{campaign.name}</b>
                          <small>
                            {campaign.scheduledAt
                              ? `Scheduled ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(campaign.scheduledAt))}`
                              : `Created ${dateLabel(campaign.createdAt)} · ${campaign.audience}`}
                          </small>
                        </div>
                        <div className="campaign-channel">
                          <span>
                            {campaign.channel === "SMS" ? (
                              "▣"
                            ) : (
                              <Mail size={13} />
                            )}
                          </span>
                          {campaign.channel}
                        </div>
                        <div className="campaign-stat">
                          {messages.length}
                          <small>sent</small>
                        </div>
                        <div>
                          <div className="progress-track">
                            <i style={{ width: `${rate}%` }} />
                          </div>
                          <small>{rate}% engagement</small>
                        </div>
                        <span
                          className={`status status-${campaign.status.toLowerCase()}`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    );
                  })}
                  {!workspace.campaigns.length && (
                    <div className="empty-state">
                      <b>No campaigns yet</b>
                      <span>
                        Create your first campaign to organize outreach.
                      </span>
                    </div>
                  )}
                </div>
              </section>
              <section className="panel activity-panel">
                {panelTitle(
                  "Message activity",
                  "Recent drafts, sends, opens, and replies",
                )}
                {renderActivityTable(workspace.messages)}
              </section>
            </>
          )}

          {page === "composer" && (
            <section className="composer-layout">
              <article className="panel composer-controls">
                <h2>Message brief</h2>
                <div className="field-stack">
                  <label>
                    Lead
                    <select
                      value={selectedLeadId || workspace.leads[0]?.id || ""}
                      onChange={(event) =>
                        setSelectedLeadId(event.target.value)
                      }
                    >
                      {workspace.leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.firstName} {lead.lastName} · {lead.company}
                        </option>
                      ))}
                    </select>
                    <small>
                      Personalization uses the profile and notes you provide.
                    </small>
                  </label>
                  <label>
                    Campaign
                    <select
                      value={selectedCampaignId}
                      onChange={(event) =>
                        setSelectedCampaignId(event.target.value)
                      }
                    >
                      <option value="">No campaign</option>
                      {workspace.campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className="field-label">Channel</span>
                    <div className="segmented">
                      {(["Email", "SMS"] as Channel[]).map((item) => (
                        <button
                          key={item}
                          className={channel === item ? "selected" : ""}
                          onClick={() => {
                            setChannel(item);
                            setVariants([]);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="field-label">Tone</span>
                    <div className="tone-options">
                      {[
                        "Professional",
                        "Friendly",
                        "Aggressive",
                        "Consultative",
                      ].map((item) => (
                        <button
                          key={item}
                          className={tone === item ? "selected" : ""}
                          onClick={() => {
                            setTone(item);
                            setVariants([]);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    Campaign goal
                    <input
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                      placeholder="e.g. Book a discovery call"
                    />
                  </label>
                </div>
                <button
                  className="button button-primary generate-button"
                  disabled={generating || !workspace.leads.length}
                  onClick={() => void generate()}
                >
                  <WandSparkles size={15} />
                  {generating ? "Generating…" : "Generate 3 options"}
                </button>
                <p className="generation-note">
                  {API_BASE
                    ? "Server-side AI · review required"
                    : "Local demo generation · no API key needed"}
                </p>
              </article>
              <article className="panel draft-panel">
                <div className="panel-heading">
                  <h2>Draft preview</h2>
                  <span className="human-review">
                    <i /> HUMAN REVIEW
                  </span>
                </div>
                {variants.length ? (
                  <div className="draft-content">
                    <div className="variant-tabs">
                      {variants.map((_, index) => (
                        <button
                          key={index}
                          className={activeVariant === index ? "selected" : ""}
                          onClick={() => setActiveVariant(index)}
                        >
                          Option {index + 1}
                        </button>
                      ))}
                    </div>
                    {channel === "Email" && (
                      <div className="subject-line">
                        <b>Subject</b>
                        <input
                          value={variants[activeVariant].subject}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, index) =>
                                index === activeVariant
                                  ? { ...item, subject: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    )}
                    <textarea
                      className="draft-text"
                      value={variants[activeVariant].content}
                      onChange={(event) =>
                        setVariants((current) =>
                          current.map((item, index) =>
                            index === activeVariant
                              ? { ...item, content: event.target.value }
                              : item,
                          ),
                        )
                      }
                      aria-label="Edit generated message"
                    />
                    <div className="draft-footer">
                      <span>
                        {variants[activeVariant].content.length} characters
                      </span>
                      <span>Review before saving</span>
                    </div>
                    <div className="draft-actions">
                      <div>
                        <button
                          className="button button-secondary"
                          onClick={() => void generate()}
                        >
                          <ArrowLeft size={14} />
                          Regenerate
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => void saveMessage(false)}
                        >
                          Save draft
                        </button>
                      </div>
                      <button
                        className="button button-primary"
                        onClick={() => void saveMessage(true)}
                      >
                        <Send size={14} />
                        Mark as sent
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="draft-placeholder">
                    <span>
                      <Sparkles size={20} />
                    </span>
                    <b>Your next conversation starts here</b>
                    <p>
                      Choose a lead and goal to create three tailored options
                      for review.
                    </p>
                  </div>
                )}
              </article>
            </section>
          )}

          {page === "analytics" && (
            <>
              <section className="metrics-grid">
                {statsCard(
                  "Open rate",
                  `${openRate}%`,
                  "Opened or replied",
                  <Activity size={15} />,
                  "green",
                )}
                {statsCard(
                  "Reply rate",
                  `${replyRate}%`,
                  "Replies per sent message",
                  <MessageCircle size={15} />,
                  "coral",
                )}
                {statsCard(
                  "Sent messages",
                  sentMessages.length,
                  "Email and SMS",
                  <Send size={15} />,
                  "yellow",
                )}
                {statsCard(
                  "Tracked replies",
                  replied,
                  "From your lead list",
                  <UsersRound size={15} />,
                  "teal",
                )}
              </section>
              <section className="analytics-grid">
                <article className="panel">
                  {panelTitle(
                    "Campaign engagement",
                    "Opens and replies by campaign",
                  )}
                  <div className="analytics-bars">
                    {workspace.campaigns.map((campaign) => {
                      const messages = sentMessages.filter(
                        (message) => message.campaignId === campaign.id,
                      );
                      const engaged = messages.filter((message) =>
                        ["Opened", "Clicked", "Replied"].includes(
                          message.status,
                        ),
                      ).length;
                      const rate = messages.length
                        ? Math.round((engaged / messages.length) * 100)
                        : 0;
                      return (
                        <div className="bar-row" key={campaign.id}>
                          <span>{campaign.name}</span>
                          <div className="bar-track">
                            <i style={{ width: `${Math.max(rate, 2)}%` }} />
                          </div>
                          <b>{rate}%</b>
                        </div>
                      );
                    })}
                    {!workspace.campaigns.length && (
                      <div className="empty-state">
                        Create a campaign to view performance.
                      </div>
                    )}
                  </div>
                </article>
                <article className="panel">
                  {panelTitle("Channel mix", "Sent messages by channel")}
                  <ChannelMix messages={sentMessages} />
                </article>
              </section>
              <section className="insight-strip">
                <Sparkles size={16} />
                <div>
                  <b>What the data suggests</b>
                  <p>
                    {workspace.campaigns.length
                      ? "Compare the audiences and message framing of campaigns with stronger engagement. Small, relevant tests can improve the next send."
                      : "Start tracking sends and replies to surface recommendations for your next campaign."}
                  </p>
                </div>
              </section>
              <section className="panel">
                {panelTitle(
                  "Recent message activity",
                  "Keep a clear record of every touchpoint",
                )}
                {renderActivityTable(workspace.messages)}
              </section>
            </>
          )}
        </div>
        <footer className="app-footer">
          <span>
            SignalDesk <i>·</i> AI-assisted outreach, with a human in the loop
          </span>
          <span>
            {API_BASE && connected
              ? "Shared PostgreSQL workspace"
              : "Demo data stays in this browser"}
          </span>
        </footer>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  {modal === "lead"
                    ? "LEAD RECORD"
                    : modal === "campaign"
                      ? "NEW WORKFLOW"
                      : "RESPONSE TRACKING"}
                </span>
                <h2>
                  {modal === "lead"
                    ? editingLead
                      ? "Edit a lead"
                      : "Add a lead"
                    : modal === "campaign"
                      ? "Create campaign"
                      : `Log a reply${replyLead ? ` · ${replyLead.firstName}` : ""}`}
                </h2>
              </div>
              <button
                className="modal-close"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={16} />
              </button>
            </div>
            {modal === "lead" && (
              <form onSubmit={submitLead}>
                <div className="form-grid">
                  <label>
                    First name
                    <input
                      name="firstName"
                      required
                      defaultValue={editingLead?.firstName || ""}
                    />
                  </label>
                  <label>
                    Last name
                    <input
                      name="lastName"
                      defaultValue={editingLead?.lastName || ""}
                    />
                  </label>
                  <label>
                    Company
                    <input
                      name="company"
                      required
                      defaultValue={editingLead?.company || ""}
                    />
                  </label>
                  <label>
                    Role
                    <input name="role" defaultValue={editingLead?.role || ""} />
                  </label>
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      defaultValue={editingLead?.email || ""}
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={editingLead?.phone || ""}
                    />
                  </label>
                  <label className="form-wide">
                    Context notes
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={editingLead?.notes || ""}
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button className="button button-primary">
                    <Check size={14} />
                    {editingLead ? "Save changes" : "Add lead"}
                  </button>
                </div>
              </form>
            )}
            {modal === "campaign" && (
              <form onSubmit={submitCampaign}>
                <div className="form-grid">
                  <label className="form-wide">
                    Campaign name
                    <input
                      name="name"
                      required
                      placeholder="Q4 pipeline follow-up"
                    />
                  </label>
                  <label>
                    Channel
                    <select name="channel">
                      <option>Email</option>
                      <option>SMS</option>
                    </select>
                  </label>
                  <label>
                    Audience
                    <select name="audience">
                      <option>All active leads</option>
                      <option>New prospects</option>
                      <option>Follow-up queue</option>
                    </select>
                  </label>
                  <label className="form-wide">
                    Campaign goal
                    <input name="goal" placeholder="Book a discovery call" />
                  </label>
                  <label className="form-wide">
                    Schedule start (optional)
                    <input type="datetime-local" name="scheduledAt" />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button className="button button-primary">
                    <Plus size={14} />
                    Create campaign
                  </button>
                </div>
              </form>
            )}
            {modal === "reply" && (
              <form onSubmit={submitReply}>
                <p className="modal-intro">
                  Add {replyLead?.firstName}’s reply. A concise summary and next
                  step will be suggested.
                </p>
                <label>
                  Reply text
                  <textarea
                    name="reply"
                    rows={5}
                    required
                    placeholder="Paste or summarize the message you received…"
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button className="button button-primary">
                    <Sparkles size={14} />
                    Summarize reply
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function EngagementChart({
  analytics,
  messages,
}: {
  analytics: Record<string, unknown> | null;
  messages: Message[];
}) {
  const events = Array.isArray(analytics?.daily_engagement)
    ? (analytics.daily_engagement as {
        date: string;
        opens: number;
        replies: number;
      }[])
    : [];
  const days = events.length
    ? events.slice(-12)
    : messages
        .slice(-12)
        .map((message) => ({
          date: message.sentAt || "",
          opens: ["Opened", "Replied"].includes(message.status) ? 1 : 0,
          replies: message.status === "Replied" ? 1 : 0,
        }));
  const max = Math.max(3, ...days.flatMap((day) => [day.opens, day.replies]));
  const path = (key: "opens" | "replies") =>
    days
      .map(
        (day, index) =>
          `${index ? "L" : "M"}${40 + (days.length < 2 ? 0 : (index * 650) / (days.length - 1))} ${165 - (day[key] / max) * 135}`,
      )
      .join(" ");
  const coords = path("replies");
  return (
    <>
      <div className="chart-legend">
        <span>
          <i />
          Replies
        </span>
        <span>
          <i />
          Opens
        </span>
      </div>
      <svg
        className="line-chart"
        viewBox="0 0 700 190"
        role="img"
        aria-label="Replies and opens from tracked message activity"
      >
        <line x1="40" y1="30" x2="690" y2="30" />
        <line x1="40" y1="75" x2="690" y2="75" />
        <line x1="40" y1="120" x2="690" y2="120" />
        <line x1="40" y1="165" x2="690" y2="165" />
        <path className="chart-area" d={`${coords} L690 165 L40 165 Z`} />
        <path className="reply-line" d={coords} />
        <path className="open-line" d={path("opens")} />
      </svg>
      <div className="chart-labels">
        <span>{days[0]?.date ? dateLabel(days[0].date) : "No activity"}</span>
        <span>{days.at(-1)?.date ? dateLabel(days.at(-1)!.date) : ""}</span>
      </div>
    </>
  );
}

function ChannelMix({ messages }: { messages: Message[] }) {
  const email = messages.filter(
    (message) => message.channel === "Email",
  ).length;
  const sms = messages.filter((message) => message.channel === "SMS").length;
  const total = email + sms;
  const emailShare = total ? Math.round((email / total) * 100) : 0;
  const smsShare = total ? 100 - emailShare : 0;
  return (
    <div className="channel-split">
      <div
        className="donut"
        style={{
          background: `conic-gradient(#39785a 0 ${emailShare}%, #e27754 ${emailShare}% 100%)`,
        }}
      >
        <span>
          <b>{total}</b>
          <small>messages</small>
        </span>
      </div>
      <div className="channel-legend">
        <div>
          <span>
            <i />
            Email
          </span>
          <b>{emailShare}%</b>
        </div>
        <div>
          <span>
            <i />
            SMS
          </span>
          <b>{smsShare}%</b>
        </div>
      </div>
    </div>
  );
}

export default App;
