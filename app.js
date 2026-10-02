const STORAGE_KEY = 'signaldesk-demo-v1';
const today = new Date().toISOString().slice(0, 10);
const seedData = {
  leads: [
    { id: 'l-1', firstName: 'Avery', lastName: 'Chen', company: 'Meridian Health', role: 'VP of Marketing', email: 'avery.chen@meridianhealth.co', phone: '+1 415 555 0184', notes: 'Expanding into two new markets this quarter. Interested in better patient retention.', status: 'Replied', createdAt: today, response: 'Can you send over pricing and a couple of healthcare case studies?' },
    { id: 'l-2', firstName: 'Marcus', lastName: 'Reed', company: 'Fieldwork', role: 'Founder', email: 'marcus@fieldwork.io', phone: '+1 415 555 0162', notes: 'Small product studio. Hiring first growth marketer.', status: 'Sent', createdAt: today },
    { id: 'l-3', firstName: 'Priya', lastName: 'Nair', company: 'Northstar Finance', role: 'Head of Growth', email: 'priya@northstarfin.com', phone: '+1 212 555 0145', notes: 'Focused on reducing customer acquisition costs.', status: 'Opened', createdAt: today },
    { id: 'l-4', firstName: 'Theo', lastName: 'Williams', company: 'Juniper & Co.', role: 'Managing Director', email: 'theo@juniperandco.com', phone: '+1 312 555 0128', notes: 'Boutique ecommerce brand. Seasonal campaign planning underway.', status: 'New', createdAt: today },
    { id: 'l-5', firstName: 'Sofia', lastName: 'Martinez', company: 'Brightpath Learning', role: 'Director of Partnerships', email: 'sofia@brightpathlearning.org', phone: '+1 617 555 0107', notes: 'Exploring new partnerships before the next enrollment cycle.', status: 'Replied', createdAt: today, response: 'This sounds relevant. Could we schedule a quick call next week?' },
    { id: 'l-6', firstName: 'Noah', lastName: 'Bennett', company: 'Kindred Goods', role: 'COO', email: 'noah@kindredgoods.com', phone: '+1 503 555 0171', notes: 'Growing direct-to-consumer revenue; team is lean.', status: 'Sent', createdAt: today },
    { id: 'l-7', firstName: 'Elena', lastName: 'Petrov', company: 'Atlas Works', role: 'Revenue Operations Lead', email: 'elena@atlasworks.com', phone: '+1 646 555 0118', notes: 'Consolidating sales tools and improving pipeline visibility.', status: 'New', createdAt: today },
    { id: 'l-8', firstName: 'Jamie', lastName: 'Okafor', company: 'Clover Health Studio', role: 'Growth Marketing Manager', email: 'jamie@cloverstudio.health', phone: '+1 510 555 0193', notes: 'Prioritizing engagement across a growing member base.', status: 'Opened', createdAt: today }
  ],
  campaigns: [
    { id: 'c-1', name: 'Q3 Growth Leaders', channel: 'Email', audience: 'New prospects', goal: 'Book a discovery call', status: 'Active', createdAt: today },
    { id: 'c-2', name: 'Customer Story Follow-up', channel: 'Email', audience: 'Follow-up queue', goal: 'Share a relevant customer story', status: 'Active', createdAt: today },
    { id: 'c-3', name: 'Founder Intro — SMS', channel: 'SMS', audience: 'New prospects', goal: 'Start a conversation', status: 'Paused', createdAt: today }
  ],
  messages: [
    { id: 'm-1', leadId: 'l-1', campaignId: 'c-1', channel: 'Email', subject: 'A thought for Meridian Health’s next growth chapter', content: 'Hi Avery, I noticed Meridian Health is expanding into new markets. We help growing healthcare teams create more relevant conversations with the people they serve. Would it be useful to compare notes on patient retention?\n\nBest,\nSam', status: 'Replied', aiGenerated: true, sentAt: today },
    { id: 'm-2', leadId: 'l-2', campaignId: 'c-1', channel: 'Email', subject: 'A growth idea for Fieldwork', content: 'Hi Marcus, as Fieldwork grows its team, building a repeatable growth motion can get complicated. We help small teams make outreach feel personal without adding busywork. Open to a short conversation next week?', status: 'Sent', aiGenerated: true, sentAt: today },
    { id: 'm-3', leadId: 'l-3', campaignId: 'c-2', channel: 'Email', subject: 'Lowering acquisition costs at Northstar', content: 'Hi Priya, I saw that Northstar Finance is focused on acquisition efficiency. We have a short customer story about improving conversion without increasing spend. Would you like me to send it over?', status: 'Opened', aiGenerated: true, sentAt: today },
    { id: 'm-4', leadId: 'l-5', campaignId: 'c-1', channel: 'Email', subject: 'Partnerships at Brightpath Learning', content: 'Hi Sofia, with Brightpath planning for the next enrollment cycle, I thought it could be timely to connect. We help teams build thoughtful partner outreach and keep the follow-up human. Would a quick call next week be useful?', status: 'Replied', aiGenerated: true, sentAt: today },
    { id: 'm-5', leadId: 'l-6', campaignId: 'c-3', channel: 'SMS', subject: '', content: 'Hi Noah, quick idea for Kindred Goods: make follow-up more personal without adding work for your lean team. Worth a 10-minute chat?', status: 'Sent', aiGenerated: true, sentAt: today },
    { id: 'm-6', leadId: 'l-8', campaignId: 'c-2', channel: 'Email', subject: 'Member engagement at Clover Health Studio', content: 'Hi Jamie, I saw Clover Health Studio is investing in member engagement. We help growth teams make every outreach touchpoint feel relevant. Could I share a couple of ideas?', status: 'Opened', aiGenerated: true, sentAt: today}
  ]
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.leads) && Array.isArray(saved.campaigns) && Array.isArray(saved.messages)) return saved;
  } catch (error) {
    console.warn('Could not read demo data; loading sample workspace.', error);
  }
  return structuredClone(seedData);
}

let data = loadData();
let route = location.hash.slice(1) || 'overview';
let composer = { leadId: data.leads[0]?.id || '', campaignId: data.campaigns[0]?.id || '', channel: 'Email', tone: 'Professional', goal: '' };
let draft = null;
let replyLeadId = null;
let searchQuery = '';
let leadFilter = 'All statuses';

const pageContent = document.getElementById('page-content');
const routeTitles = { overview: 'Overview', leads: 'Leads', campaigns: 'Campaigns', composer: 'AI composer', analytics: 'Analytics' };

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  document.getElementById('lead-nav-count').textContent = String(data.leads.length).padStart(2, '0');
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
function initials(lead) { return `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}`.toUpperCase(); }
function leadName(lead) { return [lead?.firstName, lead?.lastName].filter(Boolean).join(' ') || 'Unknown lead'; }
function getLead(id) { return data.leads.find((lead) => lead.id === id); }
function getCampaign(id) { return data.campaigns.find((campaign) => campaign.id === id); }
function sentMessages() { return data.messages.filter((message) => message.status !== 'Draft'); }
function rate(numerator, denominator) { return denominator ? `${Math.round((numerator / denominator) * 100)}%` : '0%'; }
function displayDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
}
function statusClass(status) {
  return ({ Replied: 'status-replied', Sent: 'status-sent', Draft: 'status-draft', New: 'status-new', Opened: 'status-open' })[status] || 'status-new';
}
function statusBadge(status) { return `<span class="status ${statusClass(status)}">${escapeHtml(status)}</span>`; }
function toast(message) {
  let region = document.querySelector('.toast-region');
  if (!region) { region = document.createElement('div'); region.className = 'toast-region'; region.setAttribute('aria-live', 'polite'); document.body.append(region); }
  const item = document.createElement('div');
  item.className = 'toast'; item.textContent = message; region.append(item);
  setTimeout(() => item.remove(), 3000);
}
function pageHeading(eyebrow, title, subtitle, actions = '') {
  return `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function longDate() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
}
function button(label, action, kind = 'secondary', icon = '') {
  return `<button class="button button-${kind}" type="button" data-action="${action}">${icon ? `<span class="button-icon">${icon}</span>` : ''}${label}</button>`;
}
function getStats() {
  const sent = sentMessages();
  const replied = sent.filter((message) => message.status === 'Replied').length;
  const openOrReplied = sent.filter((message) => ['Opened', 'Replied'].includes(message.status)).length;
  return { sent: sent.length, replied, opened: openOrReplied, replyRate: rate(replied, sent.length), openRate: rate(openOrReplied, sent.length), active: data.campaigns.filter((campaign) => campaign.status === 'Active').length };
}
function metricCard(label, value, note, icon, change = '') {
  return `<article class="panel metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon}</span></div><div class="metric-value">${value}${change ? `<span class="metric-change">${change}</span>` : ''}</div><div class="metric-note">${note}</div></article>`;
}
function renderChart() {
  return `<div class="chart-area"><div class="chart-legend"><span class="legend-item"><i class="legend-dot"></i>Replies</span><span class="legend-item"><i class="legend-dot coral"></i>Opens</span></div><svg class="line-chart" viewBox="0 0 700 190" role="img" aria-label="Campaign replies and opens trend"><defs><linearGradient id="areaGreen" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6a9e7d" stop-opacity=".2"/><stop offset="1" stop-color="#6a9e7d" stop-opacity="0"/></linearGradient></defs><line class="chart-grid-line" x1="40" y1="30" x2="690" y2="30"/><line class="chart-grid-line" x1="40" y1="75" x2="690" y2="75"/><line class="chart-grid-line" x1="40" y1="120" x2="690" y2="120"/><line class="chart-grid-line" x1="40" y1="165" x2="690" y2="165"/><text class="chart-axis" x="7" y="34">30</text><text class="chart-axis" x="7" y="79">20</text><text class="chart-axis" x="7" y="124">10</text><text class="chart-axis" x="13" y="169">0</text><path class="chart-fill" d="M40 143 C78 138 94 122 133 127 S187 103 226 110 S278 83 319 96 S373 76 412 82 S465 62 505 74 S557 42 597 55 S651 32 690 39 L690 165 L40 165 Z"/><path class="chart-line" d="M40 143 C78 138 94 122 133 127 S187 103 226 110 S278 83 319 96 S373 76 412 82 S465 62 505 74 S557 42 597 55 S651 32 690 39"/><path class="chart-line secondary" d="M40 152 C76 146 99 141 133 144 S190 122 226 132 S280 109 319 118 S370 96 412 105 S464 92 505 98 S560 73 597 85 S651 63 690 70"/></svg></div><div class="chart-labels"><span>Sep 02</span><span>Sep 09</span><span>Sep 16</span><span>Sep 23</span><span>Sep 30</span></div>`;
}
function leadRows(leads) {
  if (!leads.length) return `<tr><td colspan="6"><div class="empty-state"><strong>No leads found</strong>Try a different search or add a lead to get started.</div></td></tr>`;
  return leads.map((lead) => `<tr><td><div class="person-cell"><span class="person-avatar">${escapeHtml(initials(lead))}</span><span>${escapeHtml(leadName(lead))}<small>${escapeHtml(lead.email || 'No email added')}</small></span></div></td><td class="company-cell">${escapeHtml(lead.company)}</td><td>${escapeHtml(lead.role || '—')}</td><td>${statusBadge(lead.status || 'New')}</td><td>${displayDate(lead.createdAt)}</td><td>${lead.response ? `<button class="row-action" data-action="view-reply" data-id="${escapeHtml(lead.id)}">View reply</button>` : `<button class="row-action" data-action="reply" data-id="${escapeHtml(lead.id)}">Log reply</button>`}</td></tr>`).join('');
}
function leadTable(leads, { tools = true } = {}) {
  return `<div class="table-panel panel">${tools ? `<div class="table-toolbar"><label class="search-field"><span>⌕</span><input id="lead-search" type="search" placeholder="Search leads or companies" value="${escapeHtml(searchQuery)}"></label><div class="table-tools"><select class="filter-select" id="lead-filter"><option${leadFilter === 'All statuses' ? ' selected' : ''}>All statuses</option>${['New', 'Sent', 'Opened', 'Replied'].map((status) => `<option${leadFilter === status ? ' selected' : ''}>${status}</option>`).join('')}</select></div></div>` : ''}<div class="table-wrap"><table><thead><tr><th>CONTACT</th><th>COMPANY</th><th>ROLE</th><th>STATUS</th><th>ADDED</th><th>ACTION</th></tr></thead><tbody>${leadRows(leads)}</tbody></table></div><div class="table-footer"><span>Showing ${leads.length} of ${data.leads.length} leads</span><span>Sorted by recent activity</span></div></div>`;
}
function getFilteredLeads() {
  const query = searchQuery.trim().toLowerCase();
  return data.leads.filter((lead) => {
    const matchesSearch = !query || [lead.firstName, lead.lastName, lead.company, lead.email, lead.role].some((value) => value?.toLowerCase().includes(query));
    return matchesSearch && (leadFilter === 'All statuses' || lead.status === leadFilter);
  });
}
function renderOverview() {
  const stats = getStats();
  const recent = [...data.leads].sort((a, b) => (b.response ? 1 : 0) - (a.response ? 1 : 0)).slice(0, 5);
  const replies = data.leads.filter((lead) => lead.response);
  const followupLead = replies[0] || data.leads.find((lead) => lead.status === 'Opened') || data.leads[0];
  const inactive = data.leads.filter((lead) => lead.status === 'New').length;
  return `${pageHeading(longDate(), 'Good morning, Sam', 'Here’s what’s happening across your outreach today.', `${button('Import leads', 'import', 'secondary', '＋')}${button('Create campaign', 'new-campaign', 'primary', '↗')}`)}<section class="metrics-grid">${metricCard('Total leads', data.leads.length.toLocaleString(), 'Across all segments', '◎', '+12.5%')}${metricCard('Messages sent', stats.sent.toLocaleString(), 'Across active campaigns', '↗', '+8.2%')}${metricCard('Reply rate', stats.replyRate, `${stats.replied} replies from ${stats.sent} sends`, '↩', '+2.4%')}${metricCard('Active campaigns', stats.active, `${data.campaigns.length} total campaigns`, '▤', '')}</section><section class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><h2>Engagement over time</h2><p>Replies and opens across your campaigns</p></div><select class="range-select" aria-label="Chart time range"><option>Last 30 days</option><option>Last 7 days</option></select></div>${renderChart()}</article><article class="panel recommend-panel"><div class="panel-heading"><div><h2>Recommended next steps</h2><p>Based on recent engagement</p></div><span class="nav-new">AI INSIGHTS</span></div><div class="recommendation"><span class="recommendation-icon">↗</span><div><strong>Follow up with ${escapeHtml(followupLead ? leadName(followupLead) : 'your warm leads')}</strong><p>${followupLead?.response ? 'They replied with a question. A timely, specific response could move this forward.' : 'Opened your message recently. A thoughtful follow-up could restart the conversation.'}</p><a href="#leads" class="text-link" data-route="leads">Review lead <span>→</span></a></div></div><div class="recommendation"><span class="recommendation-icon">◌</span><div><strong>${inactive} new leads need a first touch</strong><p>Personalized outreach can help you start conversations while context is fresh.</p><a href="#composer" class="text-link" data-route="composer">Open AI composer <span>→</span></a></div></div><div class="recommendation"><span class="recommendation-icon">⌁</span><div><strong>Keep an eye on reply quality</strong><p>${stats.replyRate} of tracked messages have a reply. Review responses and tailor your next ask.</p></div></div></article></section><section class="panel table-panel"><div class="panel-heading"><div><h2>Recent lead activity</h2><p>Your highest-priority conversations</p></div><a class="text-link" href="#leads" data-route="leads">All leads <span>→</span></a></div><div class="table-wrap"><table><thead><tr><th>CONTACT</th><th>COMPANY</th><th>ROLE</th><th>STATUS</th><th>ADDED</th><th>ACTION</th></tr></thead><tbody>${leadRows(recent)}</tbody></table></div></section>`;
}
function renderLeads() {
  return `${pageHeading('RELATIONSHIPS', 'Leads', 'Keep every prospect’s context close and make follow-up feel personal.', `<button class="button button-secondary" type="button" data-action="csv-template">↓ CSV template</button>${button('Upload CSV', 'import', 'secondary', '↑')}${button('Add lead', 'new-lead', 'primary', '＋')}`)}<div class="insight-strip"><span class="insight-icon">✳</span><div><strong>Prioritize the conversation, not the spreadsheet.</strong><p>${data.leads.filter((lead) => lead.response).length} leads have replied and are ready for a thoughtful next step.</p></div></div>${leadTable(getFilteredLeads())}`;
}
function campaignRow(campaign) {
  const sent = data.messages.filter((message) => message.campaignId === campaign.id && message.status !== 'Draft');
  const replies = sent.filter((message) => message.status === 'Replied').length;
  const engagement = sent.length ? Math.round((sent.filter((message) => ['Opened', 'Replied'].includes(message.status)).length / sent.length) * 100) : 0;
  return `<div class="campaign-row"><div><div class="campaign-name">${escapeHtml(campaign.name)}</div><div class="campaign-meta">Created ${displayDate(campaign.createdAt)} · ${escapeHtml(campaign.audience || 'Custom audience')}</div></div><div class="campaign-channel"><span class="channel-icon">${campaign.channel === 'SMS' ? '▣' : '✉'}</span>${escapeHtml(campaign.channel)}</div><div class="campaign-stat">${sent.length}<small>sent</small></div><div><div class="progress-track"><span style="width:${engagement}%"></span></div><div class="progress-caption">${engagement}% engagement · ${replies} replies</div></div><div>${statusBadge(campaign.status === 'Active' ? 'Sent' : 'New')}</div></div>`;
}
function renderCampaigns() {
  return `${pageHeading('OUTREACH PROGRAMS', 'Campaigns', 'Coordinate thoughtful outreach and learn what earns a response.', button('Create campaign', 'new-campaign', 'primary', '＋'))}<div class="metrics-grid">${metricCard('Total campaigns', data.campaigns.length, 'Across email and SMS', '▤')}${metricCard('In progress', data.campaigns.filter((campaign) => campaign.status === 'Active').length, 'Currently running', '↗')}${metricCard('Messages sent', getStats().sent, 'Across all campaigns', '✉')}${metricCard('Average reply rate', getStats().replyRate, 'Based on tracked sends', '↩')}</div><section class="panel"><div class="panel-heading"><div><h2>All campaigns</h2><p>Performance updates as you track outreach and replies</p></div><select class="range-select" aria-label="Campaign filter"><option>All campaigns</option><option>Active</option><option>Paused</option></select></div><div class="campaign-list">${data.campaigns.length ? data.campaigns.map(campaignRow).join('') : '<div class="empty-state"><strong>No campaigns yet</strong>Create your first campaign to organize outreach.</div>'}</div></section><section class="panel table-panel" style="margin-top:15px"><div class="panel-heading"><div><h2>Message activity</h2><p>Recent drafts, sends, opens, and replies</p></div></div><div class="table-wrap"><table><thead><tr><th>CONTACT</th><th>CAMPAIGN</th><th>CHANNEL</th><th>STATUS</th><th>DATE</th><th>ACTION</th></tr></thead><tbody>${messageRows(data.messages.slice().reverse().slice(0, 6))}</tbody></table></div></section>`;
}
function messageRows(messages) {
  if (!messages.length) return '<tr><td colspan="6"><div class="empty-state"><strong>No message activity</strong>Generate a draft in the AI composer to get started.</div></td></tr>';
  return messages.map((message) => {
    const lead = getLead(message.leadId);
    const campaign = getCampaign(message.campaignId);
    return `<tr><td><div class="person-cell"><span class="person-avatar">${escapeHtml(lead ? initials(lead) : '??')}</span><span>${escapeHtml(lead ? leadName(lead) : 'Deleted lead')}<small>${escapeHtml(lead?.company || '')}</small></span></div></td><td class="company-cell">${escapeHtml(campaign?.name || 'One-off message')}</td><td>${escapeHtml(message.channel)}</td><td>${statusBadge(message.status)}</td><td>${displayDate(message.sentAt || today)}</td><td>${lead?.response ? `<button class="row-action" data-action="view-reply" data-id="${escapeHtml(lead.id)}">View reply</button>` : message.status === 'Draft' ? `<button class="row-action" data-action="mark-sent" data-id="${escapeHtml(message.id)}">Mark sent</button>` : lead ? `<button class="row-action" data-action="reply" data-id="${escapeHtml(lead.id)}">Log reply</button>` : '—'}</td></tr>`;
  }).join('');
}
function renderComposer() {
  const leadOptions = data.leads.map((lead) => `<option value="${escapeHtml(lead.id)}"${composer.leadId === lead.id ? ' selected' : ''}>${escapeHtml(leadName(lead))} · ${escapeHtml(lead.company)}</option>`).join('');
  const campaignOptions = `<option value="">No campaign</option>${data.campaigns.map((campaign) => `<option value="${escapeHtml(campaign.id)}"${composer.campaignId === campaign.id ? ' selected' : ''}>${escapeHtml(campaign.name)}</option>`).join('')}`;
  const draftView = draft ? `<div class="variants">${draft.variants.map((variant, index) => `<button class="variant-chip${draft.selected === index ? ' active' : ''}" type="button" data-action="variant" data-index="${index}">Option ${index + 1}</button>`).join('')}</div>${draft.channel === 'Email' ? `<p class="draft-subject"><strong>Subject</strong>${escapeHtml(draft.variants[draft.selected].subject)}</p>` : ''}<textarea class="draft-text" id="draft-text" aria-label="Edit generated message">${escapeHtml(draft.variants[draft.selected].content)}</textarea><div class="draft-meta"><span>${draft.variants[draft.selected].content.length} characters</span><span>Review before sending</span></div><div class="draft-actions"><div class="draft-action-group">${button('Regenerate', 'generate', 'secondary', '↻')}${button('Save draft', 'save-draft', 'secondary')}</div>${button('Mark as sent', 'send-message', 'primary', '↗')}</div>` : `<div class="draft-placeholder"><div><span class="placeholder-icon">✳</span><h3>Your next conversation starts here</h3><p>Choose a lead and goal. The composer will create three tailored options for you to review.</p></div></div>`;
  return `${pageHeading('HUMAN-REVIEWED AI', 'AI outreach composer', 'Turn useful context into a relevant first message. You stay in control before anything is sent.', '')}<div class="composer-layout"><section class="panel composer-controls"><h2>Message brief</h2><div class="field-stack"><label>Lead<select id="composer-lead">${leadOptions || '<option value="">Add a lead first</option>'}</select><span class="field-hint">Personalization uses the profile and notes you provide.</span></label><label>Campaign<select id="composer-campaign">${campaignOptions}</select></label><div><label>Channel</label><div class="segmented" id="channel-picker"><button type="button" data-channel="Email" class="${composer.channel === 'Email' ? 'selected' : ''}">Email</button><button type="button" data-channel="SMS" class="${composer.channel === 'SMS' ? 'selected' : ''}">SMS</button></div></div><div><label>Tone</label><div class="tone-options">${['Professional', 'Friendly', 'Consultative', 'Direct'].map((tone) => `<button class="tone-option${composer.tone === tone ? ' selected' : ''}" type="button" data-tone="${tone}">${tone}</button>`).join('')}</div></div><label>Campaign goal<input id="composer-goal" value="${escapeHtml(composer.goal)}" placeholder="e.g. Book a discovery call"></label></div><button class="button button-primary composer-generate" type="button" data-action="generate"><span class="button-icon">✳</span>Generate 3 options</button><p class="generation-note">Demo generation · no external AI service connected</p></section><section class="panel draft-panel"><div class="draft-panel-head"><h2>Draft preview</h2><span class="draft-label"><i></i> HUMAN REVIEW</span></div><div class="draft-content">${draftView}</div></section></div>`;
}
function renderAnalytics() {
  const stats = getStats();
  const campaigns = data.campaigns.map((campaign) => {
    const messages = data.messages.filter((message) => message.campaignId === campaign.id && message.status !== 'Draft');
    const engaged = messages.filter((message) => ['Opened', 'Replied'].includes(message.status)).length;
    return { name: campaign.name, rate: messages.length ? Math.round((engaged / messages.length) * 100) : 0, sent: messages.length };
  }).sort((a, b) => b.rate - a.rate);
  const bars = campaigns.length ? campaigns.slice(0, 4).map((campaign) => `<div class="bar-row"><span title="${escapeHtml(campaign.name)}">${escapeHtml(campaign.name.length > 16 ? `${campaign.name.slice(0, 14)}…` : campaign.name)}</span><div class="bar-track"><span style="width:${Math.max(campaign.rate, 3)}%"></span></div><span class="bar-value">${campaign.rate}%</span></div>`).join('') : '<div class="empty-state">Create a campaign to see performance here.</div>';
  const emailCount = data.messages.filter((message) => message.channel === 'Email' && message.status !== 'Draft').length;
  const smsCount = data.messages.filter((message) => message.channel === 'SMS' && message.status !== 'Draft').length;
  const total = emailCount + smsCount;
  const emailShare = total ? Math.round(emailCount / total * 100) : 0;
  const smsShare = total ? Math.round(smsCount / total * 100) : 0;
  const otherShare = 100 - emailShare - smsShare;
  return `${pageHeading('MEASURE WHAT MATTERS', 'Analytics', 'Engagement signals to help you improve the next campaign.', `<select class="range-select" aria-label="Analytics date range"><option>Last 30 days</option><option>Last 7 days</option><option>All time</option></select>`)}<section class="metrics-grid">${metricCard('Open rate', stats.openRate, 'Opened or replied', '◉')}${metricCard('Reply rate', stats.replyRate, 'Replies per sent message', '↩')}${metricCard('Sent messages', stats.sent, 'Email and SMS', '↗')}${metricCard('Tracked replies', stats.replied, 'From your lead list', '◎')}</section><section class="analytics-grid"><article class="panel"><div class="panel-heading"><div><h2>Campaign engagement</h2><p>Opens and replies by campaign</p></div></div><div class="analytics-bars">${bars}</div></article><article class="panel"><div class="panel-heading"><div><h2>Channel mix</h2><p>Sent messages by channel</p></div></div><div class="channel-split"><div class="donut" style="background:conic-gradient(#39785a 0 ${emailShare}%, #e27754 ${emailShare}% ${emailShare + smsShare}%, #e9c56c ${emailShare + smsShare}% 100%)"><span class="donut-label"><strong>${total}</strong><small>messages</small></span></div><div class="channel-legend"><div class="legend-item"><span><i class="legend-dot"></i>Email</span><strong>${emailShare}%</strong></div><div class="legend-item"><span><i class="legend-dot sms"></i>SMS</span><strong>${smsShare}%</strong></div><div class="legend-item"><span><i class="legend-dot other"></i>Other</span><strong>${otherShare}%</strong></div></div></div></article></section><div class="insight-strip"><span class="insight-icon">✳</span><div><strong>What the data suggests</strong><p>${campaigns[0]?.rate > 0 ? `${escapeHtml(campaigns[0].name)} currently leads on engagement at ${campaigns[0].rate}%. Compare its audience and message framing with lower-performing campaigns.` : 'Start tracking sends and replies to surface practical recommendations for your next campaign.'}</p></div></div><section class="panel table-panel"><div class="panel-heading"><div><h2>Recent message activity</h2><p>Keep a clear record of every touchpoint</p></div></div><div class="table-wrap"><table><thead><tr><th>CONTACT</th><th>CAMPAIGN</th><th>CHANNEL</th><th>STATUS</th><th>DATE</th><th>ACTION</th></tr></thead><tbody>${messageRows(data.messages.slice().reverse().slice(0, 7))}</tbody></table></div></section>`;
}
function render() {
  const title = routeTitles[route] ? route : 'overview';
  route = title;
  document.getElementById('page-crumb').textContent = routeTitles[route];
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.route === route));
  const templates = { overview: renderOverview, leads: renderLeads, campaigns: renderCampaigns, composer: renderComposer, analytics: renderAnalytics };
  pageContent.innerHTML = `<div class="page-enter">${templates[route]()}</div>`;
}
function setRoute(nextRoute) {
  route = routeTitles[nextRoute] ? nextRoute : 'overview';
  if (location.hash !== `#${route}`) history.replaceState(null, '', `#${route}`);
  render();
  pageContent.focus({ preventScroll: true });
  document.getElementById('sidebar').classList.remove('mobile-open');
}
function generateCopy(lead, tone, channel, goal, variant) {
  const first = lead.firstName || 'there';
  const company = lead.company || 'your team';
  const notes = (lead.notes || '').toLowerCase();
  let context = 'making customer outreach more relevant without adding manual work';
  if (notes.includes('retention') || notes.includes('member')) context = 'building stronger customer relationships and retention';
  else if (notes.includes('acquisition') || notes.includes('growth')) context = 'turning growth goals into more effective customer conversations';
  else if (notes.includes('partner')) context = 'building thoughtful partnerships ahead of your next growth phase';
  else if (notes.includes('pipeline') || notes.includes('sales')) context = 'creating a clearer, more consistent path from first touch to pipeline';
  const ask = goal || 'compare notes on your current priorities';
  const close = tone === 'Friendly' ? 'Would you be open to a quick chat?' : tone === 'Consultative' ? 'Would a short conversation be useful to explore whether this fits your priorities?' : tone === 'Direct' ? 'Is a 15-minute call next week worth putting on the calendar?' : 'Would a brief conversation next week be worthwhile?';
  const variants = [
    { subject: `${company}: a thought on ${context.split(' ').slice(0, 3).join(' ')}`, content: `Hi ${first},\n\nI noticed ${company} is focused on ${context}. We help teams turn that kind of priority into thoughtful, measurable outreach, without losing the human touch.\n\n${ask.charAt(0).toUpperCase()}${ask.slice(1)}? ${close}\n\nBest,\nSam` },
    { subject: `A practical idea for ${company}`, content: `Hi ${first},\n\n${company} caught my attention because of your work around ${context}. Teams in a similar position use SignalDesk to make their outreach more personal and learn what actually earns a response.\n\nIf ${ask} is on your radar, I can share a couple of ideas tailored to ${company}. ${close}\n\nBest,\nSam` },
    { subject: `Quick question, ${first}`, content: `Hi ${first},\n\nHow is ${company} approaching ${context} right now? I work with teams looking to make that process more focused, and thought there might be a useful conversation here.\n\n${ask.charAt(0).toUpperCase()}${ask.slice(1)}. ${close}\n\nBest,\nSam` }
  ];
  if (tone === 'Friendly') variants.forEach((item) => { item.content = item.content.replace('Hi ', 'Hey ').replace('Best,', 'Thanks,'); });
  if (tone === 'Direct') variants.forEach((item) => { item.content = item.content.replace('I noticed ', '').replace(' caught my attention because of your work around ', ' is focused on '); });
  if (channel === 'SMS') return [
    { subject: '', content: `Hi ${first}, I noticed ${company} is focused on ${context}. We help make outreach more personal without extra busywork. ${close}` },
    { subject: '', content: `Hey ${first}, quick thought for ${company}: better outreach can support ${context}. Open to a short chat about ${ask}?` },
    { subject: '', content: `${first}, curious how ${company} is approaching ${context}. I have a practical idea if improving this is a priority. Worth a conversation?` }
  ];
  return variants;
}
function selectedDraftText() {
  const editor = document.getElementById('draft-text');
  return editor ? editor.value.trim() : draft?.variants[draft.selected]?.content || '';
}
function saveMessage(status) {
  if (!draft) { toast('Generate a message before saving.'); return; }
  const content = selectedDraftText();
  if (!content) { toast('Add message text before saving.'); return; }
  data.messages.unshift({ id: `m-${Date.now()}`, leadId: composer.leadId, campaignId: composer.campaignId, channel: composer.channel, subject: draft.variants[draft.selected].subject, content, status, aiGenerated: true, sentAt: status === 'Draft' ? null : today });
  persist();
  toast(status === 'Draft' ? 'Draft saved to your message history.' : 'Message marked as sent. Demo mode does not deliver messages.');
  if (status !== 'Draft') {
    const lead = getLead(composer.leadId);
    if (lead && lead.status === 'New') lead.status = 'Sent';
    persist();
  }
  render();
}
function summarizeReply(text) {
  const lower = text.toLowerCase();
  if (/price|pricing|cost|budget|quote/.test(lower)) return { summary: 'The lead asked about pricing or budget.', action: 'Send a concise pricing overview and connect the investment to a relevant business outcome.' };
  if (/meeting|call|schedule|available|calendar|next week/.test(lower)) return { summary: 'The lead is open to scheduling a conversation.', action: 'Offer two specific times and include a short agenda so the next step is easy.' };
  if (/case stud|example|reference|customer story/.test(lower)) return { summary: 'The lead wants proof points or a relevant customer example.', action: 'Share the closest matching case study and highlight the result most relevant to their role.' };
  if (/not now|later|next quarter|busy|timing/.test(lower)) return { summary: 'The lead signaled that timing may be a concern.', action: 'Acknowledge their timing and schedule a considerate follow-up for a date they suggested.' };
  if (/no thanks|not interested|unsubscribe|remove me/.test(lower)) return { summary: 'The lead declined further outreach.', action: 'Respect the request and suppress further campaign messages.' };
  return { summary: 'The lead responded; the intent needs a quick human review.', action: 'Read the full reply, acknowledge their specific point, and suggest one clear next step.' };
}
function openReply(leadId) {
  const lead = getLead(leadId);
  if (!lead) return;
  replyLeadId = leadId;
  document.getElementById('reply-lead-name').textContent = `Add ${leadName(lead)}’s response. The suggested summary will be generated locally for this demo.`;
  document.getElementById('reply-modal').showModal();
}
function addLead(fields) {
  const lead = { id: `l-${Date.now()}`, firstName: fields.firstName.trim(), lastName: fields.lastName.trim(), company: fields.company.trim(), role: fields.role.trim(), email: fields.email.trim(), phone: fields.phone.trim(), notes: fields.notes.trim(), status: 'New', createdAt: today };
  data.leads.unshift(lead); persist(); toast(`${leadName(lead)} added to your leads.`); setRoute('leads');
}
function addCampaign(fields) {
  const campaign = { id: `c-${Date.now()}`, name: fields.name.trim(), channel: fields.channel, audience: fields.audience, goal: fields.goal.trim(), status: 'Active', createdAt: today };
  data.campaigns.unshift(campaign); composer.campaignId = campaign.id; persist(); toast('Campaign created.'); setRoute('campaigns');
}
function parseCsv(text) {
  const rows = [];
  let row = []; let field = ''; let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { field += '"'; index++; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index++;
      row.push(field.trim()); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += character;
  }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows.shift().map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const aliases = { firstname: ['firstname', 'first'], lastname: ['lastname', 'last'], company: ['company', 'companyname', 'organization'], role: ['role', 'title', 'jobtitle'], email: ['email', 'emailaddress'], phone: ['phone', 'phonenumber'], notes: ['notes', 'context', 'description'] };
  const indexFor = (key) => headers.findIndex((header) => aliases[key].includes(header));
  const firstIndex = indexFor('firstname'); const lastIndex = indexFor('lastname'); const companyIndex = indexFor('company');
  if (firstIndex < 0 || companyIndex < 0) throw new Error('CSV needs at least first name and company columns.');
  return rows.map((values) => ({ firstName: values[firstIndex] || '', lastName: lastIndex >= 0 ? values[lastIndex] || '' : '', company: values[companyIndex] || '', role: indexFor('role') >= 0 ? values[indexFor('role')] || '' : '', email: indexFor('email') >= 0 ? values[indexFor('email')] || '' : '', phone: indexFor('phone') >= 0 ? values[indexFor('phone')] || '' : '', notes: indexFor('notes') >= 0 ? values[indexFor('notes')] || '' : '' })).filter((lead) => lead.firstName && lead.company);
}

function onClick(event) {
  const routeLink = event.target.closest('[data-route]');
  if (routeLink) { event.preventDefault(); setRoute(routeLink.dataset.route); return; }
  const routeNav = event.target.closest('.nav-link');
  if (routeNav) { event.preventDefault(); setRoute(routeNav.dataset.route); return; }
  const channel = event.target.closest('[data-channel]');
  if (channel) { composer.channel = channel.dataset.channel; draft = null; render(); return; }
  const tone = event.target.closest('[data-tone]');
  if (tone) { composer.tone = tone.dataset.tone; draft = null; render(); return; }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === 'new-lead') document.getElementById('lead-modal').showModal();
  else if (action === 'new-campaign') document.getElementById('campaign-modal').showModal();
  else if (action === 'import') document.getElementById('csv-input').click();
  else if (action === 'csv-template') {
    const content = 'first_name,last_name,company,role,email,phone,notes\nJordan,Lee,Acme Co.,Marketing Director,jordan@acme.co,+1 555 0100,Interested in improving customer retention';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'signaldesk-leads-template.csv'; link.click(); URL.revokeObjectURL(url);
  }
  else if (action === 'generate') {
    composer.leadId = document.getElementById('composer-lead')?.value || composer.leadId;
    composer.campaignId = document.getElementById('composer-campaign')?.value || '';
    composer.goal = document.getElementById('composer-goal')?.value || '';
    const lead = getLead(composer.leadId);
    if (!lead) { toast('Add or select a lead before generating a message.'); return; }
    draft = { channel: composer.channel, variants: generateCopy(lead, composer.tone, composer.channel, composer.goal, 0), selected: 0 };
    render(); toast('Three tailored options are ready for your review.');
  } else if (action === 'variant') { if (draft) { draft.selected = Number(actionButton.dataset.index); render(); } }
  else if (action === 'save-draft') saveMessage('Draft');
  else if (action === 'send-message') saveMessage('Sent');
  else if (action === 'reply') openReply(actionButton.dataset.id);
  else if (action === 'view-reply') {
    const lead = getLead(actionButton.dataset.id);
    if (lead?.response) { const insight = lead.responseSummary || summarizeReply(lead.response); toast(`${insight.summary} Next: ${insight.action}`); }
  } else if (action === 'mark-sent') {
    const message = data.messages.find((item) => item.id === actionButton.dataset.id);
    if (message) { message.status = 'Sent'; message.sentAt = today; const lead = getLead(message.leadId); if (lead?.status === 'New') lead.status = 'Sent'; persist(); render(); toast('Message marked as sent. Demo mode does not deliver messages.'); }
  }
}

document.addEventListener('click', onClick);
window.addEventListener('hashchange', () => { route = location.hash.slice(1) || 'overview'; render(); });
document.getElementById('mobile-menu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('mobile-open'));
pageContent.addEventListener('input', (event) => {
  if (event.target.id === 'lead-search') { searchQuery = event.target.value; const cursor = event.target.selectionStart; render(); const updated = document.getElementById('lead-search'); updated?.focus(); updated?.setSelectionRange(cursor, cursor); }
  if (event.target.id === 'draft-text' && draft) draft.variants[draft.selected].content = event.target.value;
  if (event.target.id === 'composer-goal') composer.goal = event.target.value;
});
pageContent.addEventListener('change', (event) => {
  if (event.target.id === 'lead-filter') { leadFilter = event.target.value; render(); }
  if (event.target.id === 'composer-lead') { composer.leadId = event.target.value; draft = null; render(); }
  if (event.target.id === 'composer-campaign') composer.campaignId = event.target.value;
});
document.getElementById('lead-form').addEventListener('submit', (event) => { event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget)); if (!event.currentTarget.reportValidity()) return; document.getElementById('lead-modal').close(); event.currentTarget.reset(); addLead(fields); });
document.getElementById('campaign-form').addEventListener('submit', (event) => { event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget)); if (!event.currentTarget.reportValidity()) return; document.getElementById('campaign-modal').close(); event.currentTarget.reset(); addCampaign(fields); });
document.getElementById('reply-form').addEventListener('submit', (event) => {
  event.preventDefault(); const reply = new FormData(event.currentTarget).get('reply').trim(); if (!reply || !replyLeadId) return;
  const lead = getLead(replyLeadId); const insight = summarizeReply(reply);
  lead.response = reply; lead.responseSummary = insight; lead.status = /no thanks|not interested|unsubscribe|remove me/i.test(reply) ? 'Replied' : 'Replied';
  const message = data.messages.find((item) => item.leadId === lead.id && item.status !== 'Draft'); if (message) message.status = 'Replied';
  persist(); document.getElementById('reply-modal').close(); event.currentTarget.reset(); setRoute(route); toast(`${insight.summary} Suggested next step: ${insight.action}`);
});
document.getElementById('csv-input').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const imported = parseCsv(await file.text());
    if (!imported.length) throw new Error('No valid leads found. Check the CSV headers and rows.');
    const existing = new Set(data.leads.map((lead) => lead.email?.toLowerCase()).filter(Boolean));
    const unique = imported.filter((lead) => !lead.email || !existing.has(lead.email.toLowerCase())).map((lead) => ({ ...lead, id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status: 'New', createdAt: today }));
    data.leads.unshift(...unique); persist(); setRoute('leads'); toast(`Imported ${unique.length} lead${unique.length === 1 ? '' : 's'}${unique.length < imported.length ? ` · skipped ${imported.length - unique.length} duplicate email${imported.length - unique.length === 1 ? '' : 's'}` : ''}.`);
  } catch (error) { toast(error.message || 'Could not read that CSV file.'); }
  event.target.value = '';
});

persist();
render();
