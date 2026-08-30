"use client";
import "./user-images.css";
import "./user-profile.css";
import "./user-profile-v2.css";
import "./sell-placeholder.css";
import "./sell-posts.css";
import "./supported-banks.css";
import "./yono-bank.css";
import "./profile-icon-upgrade.css";
import "./clean-production.css";
import "./user-profile-v3.css";
import "./profile-links-pro.css";
import "./profile-menu.css";
import "./profile-stability.css";
import "./profile-sheet-fix.css";
import "./mobile-validation.css";
import "./avatar-picker.css";
import "./user-profile-fix.css";
import "./user-chat-help.css";
import "./user-chat-help-fix.css";
import "./header-clean.css";
import "./service-hours.css";
import "./service-hours-v2.css";
import "./hero-carousel.css";
import "./whatsapp-support.css";
import "./whatsapp-icon-fix.css";
import "./whatsapp-drag.css";
import "./offer-order-fix.css";
import "./chat-whatsapp-v2.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  CirclePlay,
  ClipboardList,
  MessageSquareText,
  MoreVertical,
  Pencil,
  ScanFace,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
type Offer = {
  name: string;
  initials: string;
  avatar?: string;
  rate: number;
  min: number;
  max: number;
  available: string;
  methods: string[];
  time: string;
  trades: number;
  success: string;
};
type SellPost = {
  id: number;
  message: string;
  price: string;
  link: string;
  imageKey: string;
  createdAt: number;
};
type HeroBanner = { id: number; imageKey: string; createdAt: number };
const buyOffers: Offer[] = [];
const sellOffers: Offer[] = [];
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const supportedBanks = [
  ["SBI", "SBI", "#2568a8"],
  ["Bank of Baroda", "BOB", "#f26a21"],
  ["Union Bank of India", "UBI", "#cf2437"],
  ["Indian Bank", "IB", "#1a68aa"],
  ["Central Bank of India", "CBI", "#2462a6"],
  ["Bank of India", "BOI", "#1e4594"],
  ["Canara Bank", "CB", "#00a6a6"],
  ["Punjab National Bank", "PNB", "#a61f2d"],
  ["Yes Bank", "YES", "#143b8f"],
  ["ICICI Bank", "ICI", "#ef7b22"],
  ["IndusInd Bank", "IIB", "#8b1f36"],
  ["Utkarsh Small Finance Bank", "USF", "#e36d23"],
  ["Indian Overseas Bank", "IOB", "#2c5faa"],
  ["HSBC", "HSB", "#db2028"],
  ["Federal Bank", "FB", "#305da8"],
  ["Ujjivan SFB", "USF", "#7f2b8d"],
  ["Equitas SFB", "ESF", "#eb6b25"],
  ["Suryoday SFB", "SSF", "#ee7c21"],
  ["Fincare SFB", "FSF", "#6a2f91"],
  ["Karur Vysya Bank", "KVB", "#2460a8"],
  ["UCO Bank", "UCO", "#1674b8"],
  ["Punjab & Sind Bank", "PSB", "#d22638"],
] as const;
const AvatarFace = ({ value }: { value: string }) => {
  const index = Number(value.replace("avatar:", ""));
  if (!value.startsWith("avatar:") || !Number.isInteger(index))
    return <UserRound />;
  return (
    <img
      className="avatarSprite"
      src={"/avatars/avatar-" + index + ".png"}
      alt="Selected avatar"
    />
  );
};
export default function Home() {
  const [agentProfile, setAgentProfile] = useState({
      name: "Agent",
      trades: "0",
      success: "0",
      avatar: "",
    }),
    [agentBlocked, setAgentBlocked] = useState(false),
    [publishedOffers, setPublishedOffers] = useState<Offer[]>([]);
  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem("indiausdt-agent-profile");
        if (saved) {
          const profile = JSON.parse(saved);
          if (String(profile.avatar || "").startsWith("blob:"))
            profile.avatar = "";
          setAgentProfile(profile);
        }
        const blocked =
          localStorage.getItem("indiausdt-agent-blocked") === "true";
        setAgentBlocked(blocked);
        const raw = JSON.parse(
          localStorage.getItem("indiausdt-agent-published-orders") || "[]",
        );
        setPublishedOffers(blocked ? [] : raw);
      } catch {
        setPublishedOffers([]);
      }
    };
    sync();
    const timer = window.setInterval(sync, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [side, setSide] = useState<"buy" | "sell">("buy"),
    [amount, setAmount] = useState(""),
    [payment, setPayment] = useState("All payments"),
    [selected, setSelected] = useState<Offer | null>(null),
    [orderAmount, setOrderAmount] = useState(""),
    [toast, setToast] = useState(""),
    [nav, setNav] = useState("P2P");
  const [userName, setUserName] = useState(""),
    [userId, setUserId] = useState(""),
    [userPhoto, setUserPhoto] = useState(""),
    [publicLinks, setPublicLinks] = useState({
      support: "https://t.me/IndiaUSDTDealSupport",
      updates: "https://t.me/IndiaUSDTDeal",
      buyTutorial: "",
      sellTutorial: "",
    });
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [showSupportedBanks, setShowSupportedBanks] = useState(false),
    [showYonoBank, setShowYonoBank] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [sellPosts, setSellPosts] = useState<SellPost[]>([]),
    [sellPostsLoading, setSellPostsLoading] = useState(true);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [heroBannerIndex, setHeroBannerIndex] = useState(0);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [supportPosition, setSupportPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const supportDrag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("indiausdt-user-profile") || "{}",
      );
      setUserName(saved.name || "");
      setUserId(saved.userId || "");
      setUserPhoto(saved.photo || "");
    } catch {}
    const syncLinks = () => {
      try {
        const links = JSON.parse(
          localStorage.getItem("indiausdt-public-links") || "{}",
        );
        setPublicLinks((v) => ({ ...v, ...links }));
      } catch {}
    };
    syncLinks();
    const timer = window.setInterval(syncLinks, 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const load = () =>
      fetch("/api/sell-posts")
        .then((r) => r.json())
        .then((data) => {
          setSellPosts(Array.isArray(data) ? data : []);
          setSellPostsLoading(false);
        })
        .catch(() => setSellPostsLoading(false));
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const load = () =>
      fetch("/api/banners")
        .then((r) => r.json())
        .then((data) => setHeroBanners(Array.isArray(data) ? data : []))
        .catch(() => {});
    load();
    const refresh = window.setInterval(load, 15000);
    return () => window.clearInterval(refresh);
  }, []);
  useEffect(() => {
    const load = () =>
      fetch("/api/whatsapp-support")
        .then((response) => response.json())
        .then((data) => setWhatsappLink(data.link || ""))
        .catch(() => {});
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("indiausdt-whatsapp-position") || "null",
      );
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y))
        setSupportPosition(saved);
    } catch {}
  }, []);
  useEffect(() => {
    setHeroBannerIndex(0);
    if (heroBanners.length < 2) return;
    const slider = window.setInterval(
      () => setHeroBannerIndex((index) => (index + 1) % heroBanners.length),
      2000,
    );
    return () => window.clearInterval(slider);
  }, [heroBanners.length]);
  const offers = useMemo(() => {
    const source = side === "buy" ? publishedOffers : sellOffers,
      value = Number(amount);
    return source.filter(
      (o) =>
        (!value || (value >= o.min && value <= o.max)) &&
        (payment === "All payments" || o.methods.includes(payment)),
    );
  }, [side, amount, payment, publishedOffers]);
  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2200);
  };
  const beginSupportDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    supportDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      x: rect.left,
      y: rect.top,
      moved: false,
    };
  };
  const moveSupportButton = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = supportDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX,
      dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
    const shellWidth = Math.min(440, window.innerWidth);
    const shellLeft = Math.max(0, (window.innerWidth - shellWidth) / 2);
    drag.x = Math.min(
      shellLeft + shellWidth - 56,
      Math.max(shellLeft + 8, drag.originX + dx),
    );
    drag.y = Math.min(window.innerHeight - 86, Math.max(8, drag.originY + dy));
    setSupportPosition({ x: drag.x, y: drag.y });
  };
  const finishSupportDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = supportDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    supportDrag.current = null;
    if (drag.moved) {
      localStorage.setItem(
        "indiausdt-whatsapp-position",
        JSON.stringify({ x: drag.x, y: drag.y }),
      );
      return;
    }
    whatsappLink
      ? window.open(whatsappLink, "_blank", "noopener,noreferrer")
      : notify("WhatsApp Support link has not been added yet");
  };
  const [activeOrder, setActiveOrder] = useState<{
    agent: Offer;
    amount: number;
    usdt: string;
    side: "buy" | "sell";
    paymentMethod: string;
    status: "active" | "cancelled";
  } | null>(null);
  const [messages, setMessages] = useState<
    {
      from: "agent" | "user";
      text?: string;
      image?: string;
      time: string;
      status?: "sent" | "delivered" | "seen";
    }[]
  >([]);
  const [messageText, setMessageText] = useState("");
  const messagesRef = useRef<HTMLElement | null>(null);
  const [showOrderMenu, setShowOrderMenu] = useState(false),
    [showHelp, setShowHelp] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => {
    if (!chatOpen) return;
    const viewport = window.visualViewport;
    const updateChatViewport = () => {
      const keyboardOffset = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      document.documentElement.style.setProperty(
        "--chat-keyboard-offset",
        `${keyboardOffset}px`,
      );
      window.requestAnimationFrame(() => {
        const list = messagesRef.current;
        if (list) list.scrollTop = list.scrollHeight;
      });
    };
    updateChatViewport();
    viewport?.addEventListener("resize", updateChatViewport);
    viewport?.addEventListener("scroll", updateChatViewport);
    window.addEventListener("resize", updateChatViewport);
    return () => {
      viewport?.removeEventListener("resize", updateChatViewport);
      viewport?.removeEventListener("scroll", updateChatViewport);
      window.removeEventListener("resize", updateChatViewport);
      document.documentElement.style.removeProperty("--chat-keyboard-offset");
    };
  }, [chatOpen]);
  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);
  const sendMessage = () => {
    const text = messageText.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((v) => [...v, { from: "user", text, time, status: "sent" }]);
    setMessageText("");
  };
  const profileMenu = (
    <section className="profileMenuScreen">
      <header>
        <h1>Profile</h1>
        <p>Your account, learning and support centre</p>
      </header>
      <section className="profileIdentity">
        <div className="profileMenuAvatar">
          <AvatarFace value={userPhoto} />
        </div>
        <div>
          <strong>{userName || "Add your name"}</strong>
          <span>{userId ? "+91 " + userId : "Complete your profile"}</span>
        </div>
        <button
          onClick={() => {
            setPhoneError("");
            setProfileEditorOpen(true);
          }}
          aria-label="Edit profile"
        >
          <Pencil />
        </button>
      </section>
      <section className="profileMenuGroup">
        <a
          href={publicLinks.buyTutorial || "#"}
          target={publicLinks.buyTutorial ? "_blank" : undefined}
          rel="noreferrer"
          onClick={(e) => {
            if (!publicLinks.buyTutorial) {
              e.preventDefault();
              notify("USDT Buy Tutorial link has not been added yet");
            }
          }}
        >
          <span className="menuIcon uploadedIcon buyTutorialLogo">
            <img src="/profile-icons/usdt-buy.jpg" alt="USDT Buy" />
            <i>
              <CirclePlay />
            </i>
          </span>
          <p>
            <b>USDT Buy Tutorial</b>
            <small>Learn how to buy USDT safely</small>
          </p>
          <ChevronRight />
        </a>
        <a
          href={publicLinks.sellTutorial || "#"}
          target={publicLinks.sellTutorial ? "_blank" : undefined}
          rel="noreferrer"
          onClick={(e) => {
            if (!publicLinks.sellTutorial) {
              e.preventDefault();
              notify("USDT Sell Tutorial link has not been added yet");
            }
          }}
        >
          <span className="menuIcon uploadedIcon buyTutorialLogo sellTutorialLogo">
            <img src="/profile-icons/usdt-sell.jpg" alt="USDT Sell" />
            <i>
              <CirclePlay />
            </i>
          </span>
          <p>
            <b>USDT Sell Tutorial</b>
            <small>Learn how to sell USDT safely</small>
          </p>
          <ChevronRight />
        </a>
      </section>
      <section className="profileMenuGroup bankSupportGroup">
        <button onClick={() => setShowSupportedBanks(true)}>
          <span className="menuIcon uploadedIcon atmQrLogo">
            <img src="/profile-icons/atm-qr.jpg" alt="ATM QR" />
          </span>
          <p>
            <b>ATM QR – Supported Banks</b>
            <small>View banks supporting ATM QR withdrawal</small>
          </p>
          <ChevronRight />
        </button>
        <button onClick={() => setShowYonoBank(true)}>
          <span className="menuIcon uploadedIcon yonoCashLogo">
            <img src="/profile-icons/yono-cash.png" alt="YONO Cash" />
          </span>
          <p>
            <b>YONO Cash – Supported Bank</b>
            <small>View bank supporting YONO Cash withdrawal</small>
          </p>
          <ChevronRight />
        </button>
      </section>
      <section className="profileMenuGroup">
        <a href={publicLinks.support} target="_blank" rel="noreferrer">
          <span className="menuIcon uploadedIcon helpLogo">
            <img src="/profile-icons/help-support.jpg" alt="Help and Support" />
          </span>
          <p>
            <b>Help & Support</b>
            <small>Chat with our support team on Telegram</small>
          </p>
          <ChevronRight />
        </a>
        <a href={publicLinks.updates} target="_blank" rel="noreferrer">
          <span className="menuIcon uploadedIcon channelLogo">
            <img
              src="/profile-icons/updates-channel.jpg"
              alt="Updates Channel"
            />
          </span>
          <p>
            <b>Updates Channel</b>
            <small>Follow announcements on Telegram</small>
          </p>
          <ChevronRight />
        </a>
      </section>
      <p className="profileMenuSecurity">
        <ShieldCheck /> Your information is protected and kept private.
      </p>
      {showSupportedBanks && (
        <div
          className="bankListOverlay"
          onClick={() => setShowSupportedBanks(false)}
        >
          <section onClick={(e) => e.stopPropagation()}>
            <div className="sheetHandle" />
            <header>
              <div>
                <small>ATM QR</small>
                <h2>Supported Banks</h2>
                <p>Choose your bank before using ATM QR withdrawal.</p>
              </div>
              <button
                onClick={() => setShowSupportedBanks(false)}
                aria-label="Close supported banks"
              >
                ×
              </button>
            </header>
            <div className="bankCount">
              <ShieldCheck />
              <span>
                <b>{supportedBanks.length} supported banks</b>
                <small>Availability may depend on your bank and ATM.</small>
              </span>
            </div>
            <div className="supportedBankGrid">
              {supportedBanks.map(([name, code, color]) => (
                <article key={name}>
                  <span
                    style={{
                      background: `${color}16`,
                      color,
                      borderColor: `${color}35`,
                    }}
                  >
                    {code}
                  </span>
                  <b>{name}</b>
                  <i>Supported</i>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
      {showYonoBank && (
        <div
          className="bankListOverlay yonoBankOverlay"
          onClick={() => setShowYonoBank(false)}
        >
          <section onClick={(e) => e.stopPropagation()}>
            <div className="sheetHandle" />
            <header>
              <div>
                <small>YONO CASH</small>
                <h2>Supported Bank</h2>
                <p>YONO Cash withdrawal is currently supported through SBI.</p>
              </div>
              <button
                onClick={() => setShowYonoBank(false)}
                aria-label="Close YONO Cash supported bank"
              >
                ×
              </button>
            </header>
            <div className="bankCount">
              <ShieldCheck />
              <span>
                <b>1 supported bank</b>
                <small>
                  Use an eligible SBI account with YONO Cash enabled.
                </small>
              </span>
            </div>
            <div className="yonoSingleBank">
              <article>
                <span>SBI</span>
                <div>
                  <small>YONO CASH PARTNER</small>
                  <b>State Bank of India</b>
                  <i>Supported</i>
                </div>
              </article>
              <p>
                Availability may depend on your SBI account, YONO service and
                the selected ATM.
              </p>
            </div>
          </section>
        </div>
      )}
      {profileEditorOpen && (
        <div
          className="profileEditSheet"
          onClick={() => setProfileEditorOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!userPhoto.startsWith("avatar:")) {
                notify("Please choose an avatar.");
                return;
              }
              if (!/^\d{10}$/.test(userId)) {
                setPhoneError("Please enter a valid 10-digit mobile number.");
                return;
              }
              setPhoneError("");
              localStorage.setItem(
                "indiausdt-user-profile",
                JSON.stringify({ name: userName, userId, photo: userPhoto }),
              );
              setProfileEditorOpen(false);
              notify("Profile saved successfully");
            }}
          >
            <div className="sheetHandle" />
            <h2>Edit Profile</h2>
            <p>Choose an avatar and update your details.</p>
            <div className="avatarPicker">
              <b>Choose your avatar</b>
              <div>
                {Array.from({ length: 20 }, (_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={userPhoto === `avatar:${i}` ? "selected" : ""}
                    onClick={() => setUserPhoto(`avatar:${i}`)}
                    aria-label={`Choose avatar ${i + 1}`}
                  >
                    <AvatarFace value={`avatar:${i}`} />
                  </button>
                ))}
              </div>
            </div>
            <label>
              Display name
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
              />
            </label>
            <label>
              Mobile Number
              <div className={"mobileInput " + (phoneError ? "invalid" : "")}>
                <span>+91</span>
                <input
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setPhoneError("");
                  }}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                />
              </div>
              {phoneError && <small className="fieldError">{phoneError}</small>}
            </label>
            <button type="submit">Save changes</button>
          </form>
        </div>
      )}
    </section>
  );
  return (
    <main className="stage">
      <section
        className="phoneShell"
        aria-label="IndiaUSDTdeal P2P marketplace"
      >
        {nav === "Chat" && chatOpen ? (
          <section className="chatScreen">
            <header className="chatTop">
              <button
                onClick={() => setChatOpen(false)}
                aria-label="Back to Chats"
              >
                <ArrowLeft />
              </button>
              <span className="chatAvatar">
                {activeOrder?.agent.avatar ? (
                  <img
                    src={activeOrder.agent.avatar}
                    alt={`${activeOrder.agent.name} profile`}
                  />
                ) : (
                  activeOrder?.agent.initials || "ID"
                )}
                <i />
              </span>
              <div>
                <strong>
                  {activeOrder?.agent.name || "IndiaUSDT Support"}
                </strong>
                <small>
                  {activeOrder ? "Online · Verified agent" : "No active order"}
                </small>
              </div>
              <button
                aria-label="More options"
                onClick={() => setShowOrderMenu((v) => !v)}
              >
                <MoreVertical />
              </button>
              {showOrderMenu && activeOrder && (
                <div className="orderMenu userChatMenu">
                  <button
                    onClick={() => {
                      setShowHelp(true);
                      setShowOrderMenu(false);
                    }}
                  >
                    <span>?</span>
                    <div>
                      <b>Help & Support</b>
                      <small>Get help with this order</small>
                    </div>
                  </button>
                  <button
                    className="cancelMenuAction"
                    onClick={() => {
                      setActiveOrder({ ...activeOrder, status: "cancelled" });
                      setMessages((v) => [
                        ...v,
                        {
                          from: "agent",
                          text: "This order has been cancelled.",
                          time: "Now",
                        },
                      ]);
                      setShowOrderMenu(false);
                    }}
                  >
                    <span>×</span>
                    <div>
                      <b>Cancel order</b>
                      <small>End this transaction</small>
                    </div>
                  </button>
                </div>
              )}
            </header>
            {activeOrder ? (
              <>
                <section className={`orderBanner ${activeOrder.status}`}>
                  <div className="orderStatus">
                    <span>
                      <ShieldCheck />{" "}
                      {activeOrder.status === "active"
                        ? "Order in progress"
                        : "Order cancelled"}{" "}
                      · {activeOrder.paymentMethod}
                    </span>
                    <b>#{Math.floor(100000 + (activeOrder.amount % 899999))}</b>
                  </div>
                  <div className="orderNumbers">
                    <div>
                      <small>
                        {activeOrder.side === "buy" ? "You pay" : "You receive"}
                      </small>
                      <strong>₹{money(activeOrder.amount)}</strong>
                    </div>
                    <div>
                      <small>USDT</small>
                      <strong>{activeOrder.usdt}</strong>
                    </div>
                    <div>
                      <small>Rate</small>
                      <strong>₹{activeOrder.agent.rate.toFixed(2)}</strong>
                    </div>
                  </div>
                </section>
                <section className="messages" ref={messagesRef}>
                  <div className="dayLabel">Today</div>
                  {messages.map((m, i) => (
                    <div key={i} className={`message ${m.from}`}>
                      {m.image && <img src={m.image} alt="Shared attachment" />}
                      {m.text && <p>{m.text}</p>}
                      <small>
                        {m.time}
                        {m.from === "user" && (
                          <span
                            className={`deliveryStatus ${m.status || "sent"}`}
                            aria-label={m.status || "sent"}
                          >
                            {(m.status || "sent") === "sent" ? "✓" : "✓✓"}
                          </span>
                        )}
                      </small>
                    </div>
                  ))}
                </section>
                {activeOrder.status === "active" ? (
                  <form
                    className="messageComposer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                  >
                    <label className="attach" aria-label="Share image">
                      ＋
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setMessages((v) => [
                            ...v,
                            {
                              from: "user",
                              image: URL.createObjectURL(file),
                              time: "Now",
                              status: "sent",
                            },
                          ]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onFocus={() => {
                        window.setTimeout(() => {
                          const list = messagesRef.current;
                          if (list) list.scrollTop = list.scrollHeight;
                        }, 180);
                      }}
                      placeholder="Message your agent…"
                    />
                    <button className="send" aria-label="Send message">
                      <Send />
                    </button>
                  </form>
                ) : (
                  <div className="cancelledBar">This order is cancelled</div>
                )}
              </>
            ) : (
              <div className="noChat">
                <MessageSquareText />
                <h2>No active chat</h2>
                <p>Start a P2P order to chat directly with an agent.</p>
                <button onClick={() => setNav("P2P")}>Browse offers</button>
              </div>
            )}
          </section>
        ) : nav === "Chat" ? (
          <section className="chatListScreen">
            <header>
              <h1>Chats</h1>
              <p>Your conversations with verified agents</p>
            </header>
            {activeOrder && (
              <button
                className="chatListItem"
                onClick={() => setChatOpen(true)}
              >
                <span className="chatListAvatar">
                  {activeOrder.agent.initials}
                  <i />
                </span>
                <div>
                  <strong>{activeOrder.agent.name}</strong>
                  <p>{messages.at(-1)?.text || "Image attachment"}</p>
                  <small>
                    Order #{Math.floor(100000 + (activeOrder.amount % 899999))}{" "}
                    · {activeOrder.paymentMethod}
                  </small>
                </div>
                <aside>
                  <time>Now</time>
                  <b>{messages.filter((m) => m.from === "agent").length}</b>
                </aside>
              </button>
            )}
            <button
              className="chatListItem demoChat"
              onClick={() =>
                notify("This is a previous completed conversation")
              }
            >
              <span className="chatListAvatar">IA</span>
              <div>
                <strong>IndiaUSDT Agent A</strong>
                <p>Your order was completed successfully.</p>
                <small>Previous order · UPI</small>
              </div>
              <aside>
                <time>Yesterday</time>
              </aside>
            </button>
            <button
              className="chatListItem demoChat"
              onClick={() =>
                notify("This is a previous completed conversation")
              }
            >
              <span className="chatListAvatar">PK</span>
              <div>
                <strong>PRIYANKA_KUMARI1</strong>
                <p>Thank you for trading with us.</p>
                <small>Previous order · YONO Cash</small>
              </div>
              <aside>
                <time>20 Aug</time>
              </aside>
            </button>
          </section>
        ) : nav === "Orders" ? (
          <section className="ordersScreen">
            <header>
              <h1>My Orders</h1>
              <p>Track all your P2P trades</p>
            </header>
            {activeOrder ? (
              <button
                className="orderListCard"
                onClick={() => {
                  setNav("Chat");
                  setChatOpen(true);
                }}
              >
                <div>
                  <span className={activeOrder.status}>
                    {activeOrder.status === "active"
                      ? "In progress"
                      : "Cancelled"}
                  </span>
                  <b>{activeOrder.side.toUpperCase()} USDT</b>
                  <small>
                    {activeOrder.agent.name} · {activeOrder.paymentMethod}
                  </small>
                </div>
                <div>
                  <strong>₹{money(activeOrder.amount)}</strong>
                  <small>{activeOrder.usdt} USDT</small>
                </div>
              </button>
            ) : (
              <div className="noOrders">
                <ClipboardList />
                <b>No orders yet</b>
                <span>Your P2P orders will appear here.</span>
              </div>
            )}
          </section>
        ) : nav === "Profile" ? (
          profileMenu
        ) : (
          <>
            <header className="topbar">
              <div className="brandGroup">
                <span className="logoFrame">
                  <img
                    src="/brand-small.webp"
                    alt="India USDT Deal"
                    className="logo"
                  />
                </span>
                <div>
                  <strong>
                    India <span>USDT</span> Deal
                  </strong>
                  <small>
                    <i /> P2P Marketplace
                  </small>
                </div>
              </div>
            </header>
            <section
              className={`hero ${heroBanners.length ? "heroCarousel" : ""}`}
            >
              {heroBanners.length ? (
                <>
                  {heroBanners.map((banner, index) => (
                    <img
                      key={banner.id}
                      className={index === heroBannerIndex ? "active" : ""}
                      src={`/api/banners/image?key=${encodeURIComponent(banner.imageKey)}`}
                      alt={`India USDT Deal banner ${index + 1}`}
                    />
                  ))}
                  {heroBanners.length > 1 && (
                    <span className="heroDots" aria-hidden="true">
                      {heroBanners.map((banner, index) => (
                        <i
                          key={banner.id}
                          className={index === heroBannerIndex ? "active" : ""}
                        />
                      ))}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <small>USDT / INR</small>
                    <h1>₹103.25</h1>
                    <p>
                      <span>▲ 0.42%</span> today
                    </p>
                  </div>
                  <div className="spark" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6, 7].map((x) => (
                      <span key={x} />
                    ))}
                  </div>
                </>
              )}
            </section>
            <div className="tradeTabs">
              <button
                className={side === "buy" ? "active buyActive" : ""}
                onClick={() => setSide("buy")}
              >
                Buy USDT
              </button>
              <button
                className={side === "sell" ? "active sellActive" : ""}
                onClick={() => setSide("sell")}
              >
                Sell USDT
              </button>
            </div>
            {side === "buy" ? (
              <>
                <section className="controls">
                  <label className="amountBox">
                    <span>₹</span>
                    <input
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      inputMode="numeric"
                      placeholder="Enter INR amount"
                    />
                  </label>
                  <select
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    aria-label="Payment method"
                  >
                    <option>All payments</option>
                    <option>ATM QR</option>
                    <option>UPI</option>
                    <option>YONO Cash</option>
                  </select>
                </section>
                <div className="resultHeader">
                  <strong>Verified merchants</strong>
                  <span>{offers.length} offers</span>
                </div>
                <section className="offerList">
                  {offers.map((o) => (
                    <article className="offer" key={o.name}>
                      <div className="merchantRow">
                        <div className="merchant">
                          <span className="avatar">
                            {o.name === "GlobalTradeBizInc" &&
                            agentProfile.avatar ? (
                              <img src={agentProfile.avatar} />
                            ) : (
                              o.initials
                            )}
                            <i />
                          </span>
                          <div>
                            <strong>
                              {o.name === "GlobalTradeBizInc"
                                ? agentProfile.name
                                : o.name}
                            </strong>
                            <small>
                              {o.name === "GlobalTradeBizInc"
                                ? agentProfile.trades
                                : o.trades}{" "}
                              trades ·{" "}
                              {o.name === "GlobalTradeBizInc"
                                ? `${agentProfile.success}%`
                                : o.success}{" "}
                              completion
                            </small>
                          </div>
                        </div>
                        <span className="verified">✓ Verified</span>
                      </div>
                      <div className="offerBody">
                        <div>
                          <small>Price</small>
                          <h2>
                            ₹{o.rate.toFixed(2)} <em>/ USDT</em>
                          </h2>
                          <p>
                            Available <b>{o.available} USDT</b>
                          </p>
                          <p>
                            Limit{" "}
                            <b>
                              ₹{money(o.min)} – ₹{money(o.max)}
                            </b>
                          </p>
                        </div>
                        <button
                          className={
                            side === "buy"
                              ? "action buyButton"
                              : "action sellButton"
                          }
                          onClick={() => {
                            setSelected(
                              o.name === "GlobalTradeBizInc"
                                ? {
                                    ...o,
                                    name: agentProfile.name,
                                    avatar: agentProfile.avatar,
                                    trades: Number(agentProfile.trades),
                                    success: `${agentProfile.success}%`,
                                  }
                                : o,
                            );
                            setOrderAmount(amount);
                          }}
                        >
                          {side === "buy" ? "Buy" : "Sell"}
                        </button>
                      </div>
                      <div className="offerFoot">
                        <div>
                          {o.methods.map((m) => (
                            <span key={m}>{m}</span>
                          ))}
                        </div>
                        <small>◷ {o.time}</small>
                      </div>
                    </article>
                  ))}
                  {!offers.length && (
                    <div className="empty cleanEmpty">
                      <b>No active agent orders</b>
                      <span>
                        Orders published by verified agents will appear here.
                      </span>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <section className="userSellFeed">
                <header>
                  <div>
                    <small>SELL USDT</small>
                    <h2>Selling updates</h2>
                    <p>
                      Choose a sponsored option and follow the instructions.
                    </p>
                  </div>
                  <span>
                    {sellPosts.length}{" "}
                    {sellPosts.length === 1 ? "post" : "posts"}
                  </span>
                </header>
                {sellPostsLoading ? (
                  <div className="sellFeedEmpty">
                    <span className="sellLoader" />
                    <b>Loading selling posts…</b>
                  </div>
                ) : sellPosts.length ? (
                  sellPosts.map((post) => (
                    <article key={post.id}>
                      <img
                        src={`/api/sell-posts/image?key=${encodeURIComponent(post.imageKey)}`}
                        alt="USDT selling update"
                      />
                      <div className="sellPostContent">
                        <div>
                          <small>SELL PRICE</small>
                          <strong>
                            ₹{post.price} <em>/ USDT</em>
                          </strong>
                        </div>
                        <p>{post.message}</p>
                        <a href={post.link} target="_blank" rel="noreferrer">
                          Continue to sell <ChevronRight />
                        </a>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="sellFeedEmpty">
                    <BookOpen />
                    <b>No selling posts available</b>
                    <span>New selling updates will appear here.</span>
                  </div>
                )}
              </section>
            )}
          </>
        )}
        <button
          type="button"
          className="whatsappSupport"
          style={
            supportPosition
              ? {
                  left: supportPosition.x,
                  top: supportPosition.y,
                  right: "auto",
                  bottom: "auto",
                }
              : undefined
          }
          onPointerDown={beginSupportDrag}
          onPointerMove={moveSupportButton}
          onPointerUp={finishSupportDrag}
          onPointerCancel={() => {
            supportDrag.current = null;
          }}
          aria-label="Contact WhatsApp Support. Drag to reposition."
        >
          <img
            className="whatsappImage"
            src="/whatsapp-support.png"
            alt=""
            aria-hidden="true"
          />
          <i />
        </button>
        {!chatOpen && !selected && (
          <nav className="bottomNav" aria-label="Primary navigation">
            <button
              className={nav === "P2P" ? "selected" : ""}
              onClick={() => setNav("P2P")}
            >
              <ScanFace />
              <span>P2P</span>
            </button>
            <button
              className={nav === "Orders" ? "selected" : ""}
              onClick={() => setNav("Orders")}
            >
              <ClipboardList />
              <span>Orders</span>
            </button>
            <button
              className={nav === "Chat" ? "selected" : ""}
              onClick={() => {
                setNav("Chat");
                setChatOpen(false);
              }}
            >
              <span className="iconWrap">
                <MessageSquareText />
                {activeOrder && (
                  <b>{messages.filter((m) => m.from === "agent").length}</b>
                )}
              </span>
              <span>Chat</span>
            </button>
            <button
              className={nav === "Profile" ? "selected" : ""}
              onClick={() => setNav("Profile")}
            >
              <UserRound />
              <span>Profile</span>
            </button>
          </nav>
        )}
      </section>
      {selected && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section className="orderSheet" role="dialog" aria-modal="true">
            <div className="grabber" />
            <div className="sheetHead">
              <div>
                <small>{side === "buy" ? "Buying from" : "Selling to"}</small>
                <h2>{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="rateLine">
              <span>Rate</span>
              <b>₹{selected.rate.toFixed(2)} / USDT</b>
            </div>
            <label className="orderInput">
              <span>I want to {side}</span>
              <div>
                <input
                  autoFocus
                  value={orderAmount}
                  onChange={(e) =>
                    setOrderAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="0"
                />
                <b>INR</b>
              </div>
              <small>
                Limit ₹{money(selected.min)} – ₹{money(selected.max)}
              </small>
            </label>
            <div className="receive">
              <span>You receive</span>
              <b>
                {orderAmount
                  ? (Number(orderAmount) / selected.rate).toFixed(2)
                  : "0.00"}{" "}
                USDT
              </b>
            </div>
            <button
              className="continue"
              onClick={() => {
                const n = Number(orderAmount);
                if (n < selected.min || n > selected.max)
                  return notify(
                    `Enter ₹${money(selected.min)} – ₹${money(selected.max)}`,
                  );
                const usdt = (n / selected.rate).toFixed(2);
                const paymentMethod =
                  payment === "All payments" ? selected.methods[0] : payment;
                setActiveOrder({
                  agent: selected,
                  amount: n,
                  usdt,
                  side,
                  paymentMethod,
                  status: "active",
                });
                setMessages([]);
                setSelected(null);
                setNav("Chat");
                setChatOpen(true);
              }}
            >
              Continue
            </button>
            <p className="protection">🛡 Trade protected by secure escrow</p>
          </section>
        </div>
      )}
      {showHelp && activeOrder && (
        <div
          className="helpOverlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowHelp(false);
          }}
        >
          <section>
            <button className="helpClose" onClick={() => setShowHelp(false)}>
              ×
            </button>
            <span className="helpIcon">?</span>
            <h2>How can we help?</h2>
            <p>Our support team can review your order and conversation.</p>
            <div>
              <small>ORDER REFERENCE</small>
              <b>#{Math.floor(100000 + (activeOrder.amount % 899999))}</b>
              <span>
                {activeOrder.paymentMethod} · {activeOrder.usdt} USDT
              </span>
            </div>
            <a href={publicLinks.support} target="_blank" rel="noreferrer">
              Chat with Support
            </a>
            <button className="keepChatting" onClick={() => setShowHelp(false)}>
              Continue with agent
            </button>
          </section>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
