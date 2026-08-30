"use client";
import "./style.css";
import "./sell.css";
import "./agents-manage.css";
import "./links.css";
import "./banners.css";
import "./whatsapp-links.css";
import {
  Activity,
  BadgeIndianRupee,
  BarChart3,
  Bot,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  ImagePlus,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  MessageSquareText,
  MessageCircle,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, clearToken, getToken, login, setToken, type Account } from "../api-client";

const orders = [
  {
    id: "#180000",
    user: "Rahul K.",
    agent: "GlobalTradeBizInc",
    method: "ATM QR",
    inr: "₹80,000",
    usdt: "774.82 USDT",
    status: "Active",
  },
  {
    id: "#179842",
    user: "Aman S.",
    agent: "India Cash Desk",
    method: "YONO Cash",
    inr: "₹25,000",
    usdt: "242.13 USDT",
    status: "Cancelled",
  },
  {
    id: "#179801",
    user: "Sahil M.",
    agent: "GlobalTradeBizInc",
    method: "ATM QR",
    inr: "₹1,20,000",
    usdt: "1,162.79 USDT",
    status: "Completed",
  },
];
type SellPost = {
  id: number;
  message: string;
  price: string;
  link: string;
  imageKey: string;
  createdAt: number;
};
type HeroBanner = { id: number; imageKey: string; createdAt: number };
export default function AdminControl() {
  const [logged, setLogged] = useState(false),
    [adminEmail, setAdminEmail] = useState(""),
    [adminPassword, setAdminPassword] = useState(""),
    [loginError, setLoginError] = useState(""),
    [loginBusy, setLoginBusy] = useState(false),
    [show, setShow] = useState(false),
    [tab, setTab] = useState("Dashboard"),
    [range, setRange] = useState("30 Days"),
    [query, setQuery] = useState(""),
    [manageAgent, setManageAgent] = useState(false),
    [agentBlocked, setAgentBlocked] = useState(false),
    [supportLink, setSupportLink] = useState(
      "https://t.me/IndiaUSDTDealSupport",
    ),
    [updatesLink, setUpdatesLink] = useState("https://t.me/IndiaUSDTDeal"),
    [buyTutorialLink, setBuyTutorialLink] = useState(""),
    [sellTutorialLink, setSellTutorialLink] = useState(""),
    [whatsappLink, setWhatsappLink] = useState(""),
    [linksSaved, setLinksSaved] = useState(false),
    [linksError, setLinksError] = useState("");
  useEffect(() => {
    const token = getToken("admin");
    if (!token) return;
    api<Account>("/me", {}, token)
      .then((account) => account.role === "admin" && setLogged(true))
      .catch(() => clearToken("admin"));
  }, []);
  const [agentData, setAgentData] = useState({
    name: "GlobalTradeBizInc",
    trades: "266",
    success: "99.72",
    avatar: "",
    rate: "103.25",
  });
  const [realAgents, setRealAgents] = useState<Account[]>([]);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [agentError, setAgentError] = useState("");
  const loadAgents = () => api<Account[]>("/admin/agents", {}, getToken("admin"))
    .then(setRealAgents)
    .catch((error) => setAgentError(error instanceof Error ? error.message : "Could not load agents"));
  useEffect(() => {
    if (logged && tab === "Agents") loadAgents();
  }, [logged, tab]);
  const createAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    setAgentError("");
    try {
      await api<Account>("/admin/agents", {
        method: "POST",
        body: JSON.stringify({ displayName: newAgentName, email: newAgentEmail, password: newAgentPassword }),
      }, getToken("admin"));
      setNewAgentName(""); setNewAgentEmail(""); setNewAgentPassword("");
      await loadAgents();
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : "Could not create agent");
    }
  };
  const setAgentBlock = async (agent: Account) => {
    try {
      await api(`/admin/agents/${agent.id}/block`, {
        method: "POST",
        body: JSON.stringify({ blocked: !agent.blocked }),
      }, getToken("admin"));
      await loadAgents();
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : "Could not update agent");
    }
  };
  const [sellPosts, setSellPosts] = useState<SellPost[]>([]),
    [sellMessage, setSellMessage] = useState(""),
    [sellPrice, setSellPrice] = useState(""),
    [sellLink, setSellLink] = useState(""),
    [sellImage, setSellImage] = useState<File | null>(null),
    [sellSaving, setSellSaving] = useState(false),
    [sellError, setSellError] = useState("");
  const [banners, setBanners] = useState<HeroBanner[]>([]),
    [bannerImage, setBannerImage] = useState<File | null>(null),
    [bannerSaving, setBannerSaving] = useState(false),
    [bannerError, setBannerError] = useState("");
  useEffect(() => {
    try {
      const p = JSON.parse(
        localStorage.getItem("indiausdt-agent-profile") || "{}",
      );
      setAgentData((v) => ({
        ...v,
        ...p,
        rate: localStorage.getItem("indiausdt-agent-rate") || v.rate,
      }));
      setAgentBlocked(
        localStorage.getItem("indiausdt-agent-blocked") === "true",
      );
      const links = JSON.parse(
        localStorage.getItem("indiausdt-public-links") || "{}",
      );
      if (links.support) setSupportLink(links.support);
      if (links.updates) setUpdatesLink(links.updates);
      if (links.buyTutorial) setBuyTutorialLink(links.buyTutorial);
      if (links.sellTutorial) setSellTutorialLink(links.sellTutorial);
    } catch {}
  }, [tab]);
  useEffect(() => {
    if (tab !== "Links") return;
    fetch("/api/whatsapp-support")
      .then((response) => response.json())
      .then((data) => setWhatsappLink(data.link || ""))
      .catch(() => setLinksError("Could not load WhatsApp support link."));
  }, [tab]);
  useEffect(() => {
    if (tab !== "Sell USDT") return;
    fetch("/api/sell-posts")
      .then((r) => r.json())
      .then(setSellPosts)
      .catch(() => setSellError("Could not load selling posts."));
  }, [tab]);
  useEffect(() => {
    if (tab !== "Banners") return;
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch(() => setBannerError("Could not load banners."));
  }, [tab]);
  const publishSellPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellImage) return setSellError("Please choose a post picture.");
    setSellSaving(true);
    setSellError("");
    const data = new FormData();
    data.set("image", sellImage);
    data.set("message", sellMessage);
    data.set("price", sellPrice);
    data.set("link", sellLink);
    try {
      const response = await fetch("/api/sell-posts", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not publish post.");
      setSellPosts((v) => [result, ...v]);
      setSellMessage("");
      setSellPrice("");
      setSellLink("");
      setSellImage(null);
      const input = document.getElementById(
        "sell-post-image",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      setSellError(
        error instanceof Error ? error.message : "Could not publish post.",
      );
    } finally {
      setSellSaving(false);
    }
  };
  const deleteSellPost = async (id: number) => {
    if (!window.confirm("Delete this selling post?")) return;
    const response = await fetch(`/api/sell-posts?id=${id}`, {
      method: "DELETE",
    });
    if (response.ok) setSellPosts((v) => v.filter((post) => post.id !== id));
    else setSellError("Could not delete this post.");
  };
  const publishBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage) return setBannerError("Please choose a banner image.");
    if (banners.length >= 3)
      return setBannerError("Maximum 3 banners are allowed.");
    setBannerSaving(true);
    setBannerError("");
    const data = new FormData();
    data.set("image", bannerImage);
    try {
      const response = await fetch("/api/banners", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not publish banner.");
      setBanners((v) => [...v, result]);
      setBannerImage(null);
      const input = document.getElementById(
        "hero-banner-image",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      setBannerError(
        error instanceof Error ? error.message : "Could not publish banner.",
      );
    } finally {
      setBannerSaving(false);
    }
  };
  const deleteBanner = async (id: number) => {
    if (!window.confirm("Delete this homepage banner?")) return;
    const response = await fetch(`/api/banners?id=${id}`, { method: "DELETE" });
    if (response.ok) setBanners((v) => v.filter((item) => item.id !== id));
    else setBannerError("Could not delete this banner.");
  };
  if (!logged)
    return (
      <main className="adminLogin">
        <section>
          <img src="/brand.png" alt="India USDT Deal" />
          <span>RESTRICTED ACCESS</span>
          <h1>Admin Control Center</h1>
          <p>Authorized platform administrators only</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginBusy(true);
              setLoginError("");
              try {
                const result = await login(adminEmail, adminPassword);
                if (result.account.role !== "admin") throw new Error("Admin access required");
                setToken("admin", result.token);
                setLogged(true);
              } catch (error) {
                setLoginError(error instanceof Error ? error.message : "Login failed");
              } finally {
                setLoginBusy(false);
              }
            }}
          >
            <label>
              Admin ID
              <div>
                <ShieldCheck />
                <input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@indiausdtdeal.com" />
              </div>
            </label>
            <label>
              Password
              <div>
                <LockKeyhole />
                <input
                  required
                  minLength={8}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  type={show ? "text" : "password"}
                  placeholder="Enter secure password"
                />
                <button type="button" onClick={() => setShow((v) => !v)}>
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>
            {loginError && <p className="agentError">{loginError}</p>}
            <button disabled={loginBusy}>{loginBusy ? "Checking…" : "Continue securely"}</button>
          </form>
          <small>
            <LockKeyhole /> This private route is not visible to users or
            agents.
          </small>
        </section>
      </main>
    );
  const nav = [
    [LayoutDashboard, "Dashboard"],
    [WalletCards, "Sell USDT"],
    [Bot, "Agents"],
    [MessageSquareText, "Chats"],
    [ImagePlus, "Banners"],
    [Link2, "Links"],
    [Activity, "Activity"],
  ] as const;
  return (
    <main className="adminShell">
      <aside>
        <header>
          <img src="/brand.png" />
          <div>
            <b>India USDT Deal</b>
            <span>ADMIN CONTROL</span>
          </div>
        </header>
        <nav>
          {nav.map(([Icon, name]) => (
            <button
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              <Icon />
              <span>{name}</span>
              {name === "Chats" && <i>4</i>}
            </button>
          ))}
        </nav>
        <footer>
          <span>DK</span>
          <div>
            <b>Super Admin</b>
            <small>Full access</small>
          </div>
          <button onClick={() => setLogged(false)}>↗</button>
        </footer>
      </aside>
      <section className="adminMain">
        <header>
          <div>
            <h1>{tab}</h1>
            <p>Platform overview and control</p>
          </div>
          <button className="adminAvatar">DK</button>
        </header>
        <div className="adminBody">
          {tab === "Dashboard" && (
            <>
              <section className="adminWelcome">
                <div>
                  <small>PLATFORM PERFORMANCE</small>
                  <h2>₹13.27 Lakh traded</h2>
                  <p>12,845.70 USDT total buy volume</p>
                </div>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                >
                  <option>Today</option>
                  <option>7 Days</option>
                  <option>30 Days</option>
                  <option>Custom Date</option>
                </select>
              </section>
              <section className="adminMetrics">
                <article>
                  <span>
                    <WalletCards />
                  </span>
                  <p>Total Buy</p>
                  <b>
                    12,845.70 <small>USDT</small>
                  </b>
                  <em>+12.4% this month</em>
                </article>
                <article>
                  <span>
                    <BadgeIndianRupee />
                  </span>
                  <p>Total INR</p>
                  <b>₹13,26,819</b>
                  <em>Across all agents</em>
                </article>
                <article>
                  <span>
                    <ClipboardList />
                  </span>
                  <p>Total Orders</p>
                  <b>348</b>
                  <em>321 completed</em>
                </article>
                <article>
                  <span>
                    <Users />
                  </span>
                  <p>Active Users</p>
                  <b>184</b>
                  <em>28 new this month</em>
                </article>
              </section>
              <section className="adminGrid">
                <article className="volumeCard">
                  <header>
                    <div>
                      <b>Buy Volume</b>
                      <small>Last 7 days · USDT</small>
                    </div>
                    <BarChart3 />
                  </header>
                  <div className="bars">
                    {[42, 58, 46, 73, 63, 88, 96].map((h, i) => (
                      <span key={i} style={{ height: h + "%" }}>
                        <i>{[620, 842, 708, 1040, 914, 1260, 1418][i]}</i>
                      </span>
                    ))}
                  </div>
                  <footer>
                    {["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      ),
                    )}
                  </footer>
                </article>
                <article className="statusCard">
                  <b>Order Status</b>
                  <div className="donut">
                    <span>
                      348<small>Orders</small>
                    </span>
                  </div>
                  <p>
                    <span>
                      <i className="green" />
                      Completed <b>321</b>
                    </span>
                    <span>
                      <i className="orange" />
                      Active <b>19</b>
                    </span>
                    <span>
                      <i className="red" />
                      Cancelled <b>8</b>
                    </span>
                  </p>
                </article>
              </section>
              <section className="adminTable">
                <header>
                  <div>
                    <b>Recent Orders</b>
                    <small>Latest platform activity</small>
                  </div>
                  <button onClick={() => setTab("Orders")}>
                    View all <ChevronRight />
                  </button>
                </header>
                <OrderRows rows={orders} />
              </section>
            </>
          )}
          {tab === "Orders" && (
            <>
              <PageTitle
                title="All Orders"
                text="Monitor and manage every platform order"
              />
              <SearchBox value={query} set={setQuery} />
              <section className="adminTable">
                <OrderRows
                  rows={orders.filter((o) =>
                    (o.user + o.id + o.agent)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )}
                />
              </section>
            </>
          )}
          {tab === "Agents" && (
            <>
              <PageTitle
                title="Agents"
                text="Manage verified P2P agents and performance"
              />
              <form onSubmit={createAgent} className="sellPostComposer">
                <header><div><b>Create verified agent</b><small>The agent will use this email and password in the hidden Agent Portal.</small></div></header>
                <label>Display name<input required value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="Agent business name" /></label>
                <label>Email<input required type="email" value={newAgentEmail} onChange={(e) => setNewAgentEmail(e.target.value)} placeholder="agent@example.com" /></label>
                <label>Temporary password<input required minLength={8} type="password" value={newAgentPassword} onChange={(e) => setNewAgentPassword(e.target.value)} placeholder="Minimum 8 characters" /></label>
                {agentError && <p className="agentError">{agentError}</p>}
                <button>Create agent</button>
              </form>
              <section className="peopleGrid">
                {realAgents.map((agent) => (
                  <article key={agent.id} className={agent.blocked ? "blockedAgent" : ""}>
                    <span>{agent.avatarUrl ? <img src={agent.avatarUrl} /> : (agent.displayName || "AG").slice(0,2).toUpperCase()}<i /></span>
                    <b>{agent.displayName}</b>
                    <small>{agent.blocked ? "Agent blocked" : "Verified agent"}</small>
                    <div><p>{agent.completedTrades || 0}<small>Completed trades</small></p><p>{Number(agent.successRate || 0).toFixed(2)}%<small>Success rate</small></p></div>
                    <button onClick={() => setAgentBlock(agent)}>{agent.blocked ? "Unblock agent" : "Block agent"}</button>
                  </article>
                ))}
              </section>
              <section className="peopleGrid">
                {[
                  [
                    agentData.name,
                    "8,920 USDT",
                    `${agentData.trades} trades`,
                    agentData.rate,
                    agentData.avatar,
                  ],
                  ["India Cash Desk", "3,412 USDT", "94 trades", "103.10", ""],
                  ["SecurePay Agent", "513 USDT", "18 trades", "102.95", ""],
                ].map((a, i) => (
                  <article
                    key={a[0]}
                    className={i === 0 && agentBlocked ? "blockedAgent" : ""}
                  >
                    <span>
                      {a[4] ? (
                        <img src={a[4]} />
                      ) : (
                        a[0].slice(0, 2).toUpperCase()
                      )}
                      <i />
                    </span>
                    <b>{a[0]}</b>
                    <small>
                      {i === 0 && agentBlocked
                        ? "Agent ID Blocked"
                        : "Verified agent"}
                    </small>
                    <div>
                      <p>
                        ₹{a[3]}
                        <small>Current rate / USDT</small>
                      </p>
                      <p>
                        {a[2]}
                        <small>Completed</small>
                      </p>
                    </div>
                    <button onClick={() => i === 0 && setManageAgent(true)}>
                      {i === 0 ? "Manage agent" : "View agent"}
                    </button>
                  </article>
                ))}
              </section>
              {manageAgent && (
                <div className="manageOverlay">
                  <section>
                    <button
                      className="manageClose"
                      onClick={() => setManageAgent(false)}
                    >
                      ×
                    </button>
                    <span className="manageAvatar">
                      {agentData.avatar ? (
                        <img src={agentData.avatar} />
                      ) : (
                        agentData.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <h2>{agentData.name}</h2>
                    <p>Agent ID: AGENT001</p>
                    <div>
                      <span>
                        Current rate <b>₹{agentData.rate} / USDT</b>
                      </span>
                      <span>
                        Completed <b>{agentData.trades} trades</b>
                      </span>
                    </div>
                    <button
                      className={agentBlocked ? "unblockAgent" : "blockAgent"}
                      onClick={() => {
                        const next = !agentBlocked;
                        localStorage.setItem(
                          "indiausdt-agent-blocked",
                          String(next),
                        );
                        setAgentBlocked(next);
                        setManageAgent(false);
                      }}
                    >
                      {agentBlocked ? "Unblock Agent" : "Block Agent"}
                    </button>
                    <small>
                      {agentBlocked
                        ? "Unblocking restores login access. Orders must be republished by the agent."
                        : "Blocking immediately signs out the agent and removes all their orders from the User Dashboard."}
                    </small>
                  </section>
                </div>
              )}
            </>
          )}
          {tab === "Sell USDT" && (
            <>
              <PageTitle
                title="Sell USDT Posts"
                text="Publish picture posts that users see in the Sell USDT section"
              />
              <section className="sellPostManager">
                <form className="sellPostComposer" onSubmit={publishSellPost}>
                  <header>
                    <span>
                      <ImagePlus />
                    </span>
                    <div>
                      <b>Create selling post</b>
                      <small>
                        Add a picture, price, message and destination link.
                      </small>
                    </div>
                  </header>
                  <label className="sellImagePicker">
                    <input
                      id="sell-post-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSellImage(e.target.files?.[0] || null)
                      }
                    />
                    <ImagePlus />
                    <span>
                      <b>
                        {sellImage ? sellImage.name : "Choose post picture"}
                      </b>
                      <small>JPG, PNG or WEBP · Maximum 4 MB</small>
                    </span>
                  </label>
                  <label>
                    Price shown to users
                    <div className="sellPriceInput">
                      <span>₹</span>
                      <input
                        required
                        inputMode="decimal"
                        value={sellPrice}
                        onChange={(e) =>
                          setSellPrice(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                        placeholder="103.25"
                      />
                      <b>/ USDT</b>
                    </div>
                  </label>
                  <label>
                    Post message
                    <textarea
                      required
                      rows={5}
                      value={sellMessage}
                      onChange={(e) => setSellMessage(e.target.value)}
                      placeholder="Write complete selling instructions or announcement…"
                    />
                  </label>
                  <label>
                    Action link
                    <input
                      required
                      type="url"
                      value={sellLink}
                      onChange={(e) => setSellLink(e.target.value)}
                      placeholder="https://t.me/your-link"
                    />
                  </label>
                  {sellError && <p className="sellPostError">{sellError}</p>}
                  <button disabled={sellSaving}>
                    {sellSaving ? "Publishing…" : "Publish selling post"}
                  </button>
                </form>
                <section className="publishedSellPosts">
                  <header>
                    <div>
                      <b>Published posts</b>
                      <small>
                        {sellPosts.length} active{" "}
                        {sellPosts.length === 1 ? "post" : "posts"}
                      </small>
                    </div>
                  </header>
                  {sellPosts.length ? (
                    sellPosts.map((post) => (
                      <article key={post.id}>
                        <img
                          src={`/api/sell-posts/image?key=${encodeURIComponent(post.imageKey)}`}
                          alt="Selling post"
                        />
                        <div>
                          <b>₹{post.price} / USDT</b>
                          <p>{post.message}</p>
                          <a href={post.link} target="_blank" rel="noreferrer">
                            Open link
                          </a>
                        </div>
                        <button
                          onClick={() => deleteSellPost(post.id)}
                          aria-label="Delete post"
                        >
                          <Trash2 />
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="noSellPosts">
                      <ImagePlus />
                      <b>No selling posts yet</b>
                      <span>Your published posts will appear here.</span>
                    </div>
                  )}
                </section>
              </section>
            </>
          )}
          {tab === "Users" && (
            <>
              <PageTitle
                title="Users"
                text="Customer accounts, order history and access"
              />
              <SearchBox value={query} set={setQuery} />
              <section className="userList">
                {[
                  ["RK", "Rahul K.", "12 orders", "₹2,84,000"],
                  ["AS", "Aman S.", "5 orders", "₹72,500"],
                  ["SM", "Sahil M.", "9 orders", "₹1,92,000"],
                ].map((u) => (
                  <article key={u[1]}>
                    <span>{u[0]}</span>
                    <p>
                      <b>{u[1]}</b>
                      <small>
                        {u[2]} · {u[3]}
                      </small>
                    </p>
                    <em>Active</em>
                    <button>•••</button>
                  </article>
                ))}
              </section>
            </>
          )}
          {tab === "Chats" && (
            <>
              <PageTitle
                title="Live Conversations"
                text="Review order conversations across all agents"
              />
              <section className="userList">
                {[
                  [
                    "RK",
                    "Rahul K. ↔ GlobalTradeBizInc",
                    "Please send the QR code.",
                    "2",
                  ],
                  [
                    "AS",
                    "Aman S. ↔ India Cash Desk",
                    "Order cancelled by user",
                    "",
                  ],
                  [
                    "SM",
                    "Sahil M. ↔ GlobalTradeBizInc",
                    "Payment completed",
                    "1",
                  ],
                ].map((c) => (
                  <article key={c[1]}>
                    <span>{c[0]}</span>
                    <p>
                      <b>{c[1]}</b>
                      <small>{c[2]}</small>
                    </p>
                    {c[3] && <i>{c[3]}</i>}
                    <button>
                      <ChevronRight />
                    </button>
                  </article>
                ))}
              </section>
            </>
          )}
          {tab === "Banners" && (
            <>
              <PageTitle
                title="Homepage Banners"
                text="Upload up to 3 banners for the automatic dashboard slider"
              />
              <section className="bannerManager">
                <form onSubmit={publishBanner} className="bannerComposer">
                  <header>
                    <span>
                      <ImagePlus />
                    </span>
                    <div>
                      <b>Add dashboard banner</b>
                      <small>
                        The slider changes automatically every 2 seconds.
                      </small>
                    </div>
                    <em>{banners.length}/3</em>
                  </header>
                  <label>
                    <input
                      id="hero-banner-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setBannerImage(e.target.files?.[0] || null)
                      }
                    />
                    <ImagePlus />
                    <span>
                      <b>
                        {bannerImage ? bannerImage.name : "Choose banner image"}
                      </b>
                      <small>JPG, PNG or WEBP · Maximum 5 MB</small>
                    </span>
                  </label>
                  {bannerError && <p>{bannerError}</p>}
                  <button disabled={bannerSaving || banners.length >= 3}>
                    {bannerSaving
                      ? "Publishing…"
                      : banners.length >= 3
                        ? "3 banners published"
                        : "Publish banner"}
                  </button>
                </form>
                <section className="bannerGallery">
                  <header>
                    <b>Published banners</b>
                    <small>
                      {banners.length
                        ? "Shown in this order on the User Dashboard"
                        : "No banners published yet"}
                    </small>
                  </header>
                  {banners.length ? (
                    <div>
                      {banners.map((banner, index) => (
                        <article key={banner.id}>
                          <img
                            src={`/api/banners/image?key=${encodeURIComponent(banner.imageKey)}`}
                            alt={`Homepage banner ${index + 1}`}
                          />
                          <span>{index + 1}</span>
                          <button
                            onClick={() => deleteBanner(banner.id)}
                            aria-label="Delete banner"
                          >
                            <Trash2 />
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <aside>
                      <ImagePlus />
                      <b>Your green market banner stays active</b>
                      <small>
                        Upload an image when you want to start the slider.
                      </small>
                    </aside>
                  )}
                </section>
              </section>
            </>
          )}
          {tab === "Links" && (
            <>
              <PageTitle
                title="Dashboard Links"
                text="Manage support, channel and tutorial links shown to users"
              />
              <section className="linksManager">
                <header>
                  <span>
                    <Link2 />
                  </span>
                  <div>
                    <b>Public dashboard links</b>
                    <small>
                      Changes will appear in the User Profile and order Help
                      panel.
                    </small>
                  </div>
                </header>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLinksError("");
                    localStorage.setItem(
                      "indiausdt-public-links",
                      JSON.stringify({
                        support: supportLink,
                        updates: updatesLink,
                        buyTutorial: buyTutorialLink,
                        sellTutorial: sellTutorialLink,
                      }),
                    );
                    try {
                      const response = await fetch("/api/whatsapp-support", {
                        method: "PUT",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ link: whatsappLink }),
                      });
                      const result = await response.json();
                      if (!response.ok)
                        throw new Error(
                          result.error ||
                            "Could not save WhatsApp support link.",
                        );
                      setWhatsappLink(result.link);
                      setLinksSaved(true);
                      window.setTimeout(() => setLinksSaved(false), 2200);
                    } catch (error) {
                      setLinksError(
                        error instanceof Error
                          ? error.message
                          : "Could not save WhatsApp support link.",
                      );
                    }
                  }}
                >
                  <label>
                    USDT Buy Tutorial link
                    <div>
                      <span>▶</span>
                      <input
                        type="url"
                        value={buyTutorialLink}
                        onChange={(e) => setBuyTutorialLink(e.target.value)}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <small>Opens when a user taps USDT Buy Tutorial.</small>
                  </label>
                  <label>
                    USDT Sell Tutorial link
                    <div>
                      <span>▶</span>
                      <input
                        type="url"
                        value={sellTutorialLink}
                        onChange={(e) => setSellTutorialLink(e.target.value)}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <small>Opens when a user taps USDT Sell Tutorial.</small>
                  </label>
                  <label>
                    WhatsApp Support
                    <div>
                      <span>
                        <MessageCircle />
                      </span>
                      <input
                        required
                        value={whatsappLink}
                        onChange={(e) => setWhatsappLink(e.target.value)}
                        placeholder="9876543210 or https://wa.me/919876543210"
                      />
                    </div>
                    <small>
                      Opens when a user taps the floating WhatsApp icon.
                    </small>
                  </label>
                  <label>
                    Help & Support link
                    <div>
                      <span>?</span>
                      <input
                        required
                        type="url"
                        value={supportLink}
                        onChange={(e) => setSupportLink(e.target.value)}
                        placeholder="https://t.me/your_support"
                      />
                    </div>
                    <small>Opened when a user taps Help & Support.</small>
                  </label>
                  <label>
                    Updates Channel link
                    <div>
                      <span>↗</span>
                      <input
                        required
                        type="url"
                        value={updatesLink}
                        onChange={(e) => setUpdatesLink(e.target.value)}
                        placeholder="https://t.me/your_channel"
                      />
                    </div>
                    <small>Shown in the User Profile section.</small>
                  </label>
                  <aside>
                    <ShieldCheck />
                    <p>
                      <b>Safe link management</b>
                      <span>
                        Only use your official tutorial, Telegram or support
                        URLs.
                      </span>
                    </p>
                  </aside>
                  <button>Save & publish links</button>
                  {linksError && <p className="linksError">{linksError}</p>}
                  {linksSaved && (
                    <p className="linksSuccess">
                      ✓ Links updated on User Dashboard
                    </p>
                  )}
                </form>
              </section>
            </>
          )}
          {tab === "Activity" && (
            <>
              <PageTitle
                title="Activity & Retention"
                text="Security actions and automatic data cleanup"
              />
              <section className="retentionAdmin">
                <ShieldCheck />
                <div>
                  <b>15-day retention is active</b>
                  <p>
                    Closed order conversations and related user transaction data
                    are scheduled for automatic deletion after 15 days.
                  </p>
                </div>
              </section>
              <section className="activityList">
                {[
                  "Admin restored order #180000",
                  "Agent blocked user Rahul K.",
                  "Order #179842 cancelled",
                  "Agent profile updated",
                  "Expired conversation data deleted",
                ].map((x, i) => (
                  <article key={x}>
                    <span>{i + 1}</span>
                    <p>
                      <b>{x}</b>
                      <small>{i < 2 ? "Just now" : "Today · 2:40 PM"}</small>
                    </p>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
function PageTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="adminPageTitle">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
function SearchBox({
  value,
  set,
}: {
  value: string;
  set: (v: string) => void;
}) {
  return (
    <label className="adminSearch">
      <Search />
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder="Search by name, agent or order ID"
      />
    </label>
  );
}
function OrderRows({ rows }: { rows: typeof orders }) {
  return (
    <div className="orderRows">
      {rows.map((o) => (
        <article key={o.id}>
          <span className={o.status.toLowerCase()}>{o.status}</span>
          <p>
            <b>{o.user}</b>
            <small>
              {o.id} · {o.method}
            </small>
          </p>
          <p>
            <b>{o.inr}</b>
            <small>{o.usdt}</small>
          </p>
          <p>
            <b>{o.agent}</b>
            <small>Agent</small>
          </p>
          <button>•••</button>
        </article>
      ))}
    </div>
  );
}
