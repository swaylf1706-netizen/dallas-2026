import React, { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, provider } from "./firebase";
import {
  Plane,
  Hotel,
  Car,
  Ticket,
  Utensils,
  ShoppingBag,
  Users,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Trophy,
  Wallet,
  Moon,
  Sun,
  Save,
  CheckCircle2,
  Bell,
  CalendarDays,
  Pencil,
} from "lucide-react";

const TRIP_START = new Date("2026-07-29T00:00:00");
const TRIP_END = new Date("2026-08-04T23:59:59");

const currency = (value) =>
  (Number(value) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const num = (value) => Number(value) || 0;
const uid = () => crypto.randomUUID();

const starter = {
  people: [],
  flights: [],
  stay: [],
  cars: [],
  activities: [],
  food: [],
  shopping: [],
  finalPicks: {
    flights: "",
    stay: "",
    cars: "",
    activities: "",
    food: "",
    shopping: "",
  },
  expenses: [],
  presence: {},
  notifications: [],
};

const tabs = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "stay", label: "Stay", icon: Hotel },
  { id: "cars", label: "Car Rental", icon: Car },
  { id: "activities", label: "Activities", icon: Ticket },
  { id: "food", label: "Food", icon: Utensils },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "final", label: "Final Picks", icon: Trophy },
  { id: "budget", label: "Budget", icon: Wallet },
];

const labels = {
  flights: "Flights",
  stay: "Stay",
  cars: "Car Rental",
  activities: "Activities",
  food: "Food",
  shopping: "Shopping",
  final: "Final Picks",
  budget: "Budget Tracker",
};

const boardCategories = ["flights", "stay", "cars", "activities", "food", "shopping"];

const hasPersonPrice = {
  flights: true,
  stay: false,
  cars: false,
  activities: true,
  food: true,
  shopping: true,
};

const blankOption = (user) => ({
  id: uid(),
  title: "",
  submittedBy: user?.displayName || "",
  link: "",
  pricePP: "",
  groupTotal: "",
  notes: "",
  votes: {},
  comments: [],
  saved: false,
  createdByUid: user?.uid || "guest",
  createdByName: user?.displayName || user?.email || "Guest",
  createdByPhoto: user?.photoURL || "",
  createdAt: Date.now(),
});

function normalizeOption(item) {
  return {
    votes: {},
    comments: [],
    saved: Boolean(item.saved),
    createdByPhoto: item.createdByPhoto || "",
    ...item,
  };
}

function getTripCountdownText() {
  const now = new Date();
  if (now < TRIP_START) {
    const days = Math.ceil((TRIP_START.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days until Dallas`;
  }
  if (now >= TRIP_START && now <= TRIP_END) return "Dallas trip is happening now";
  return "Dallas trip ended";
}

function App() {
  const [active, setActive] = useState("flights");
  const [data, setData] = useState(starter);
  const [user, setUser] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [newName, setNewName] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("dallasDark") === "true");
  const [expenseDraft, setExpenseDraft] = useState({ title: "", paidBy: "", amount: "", notes: "" });
  const [showNotifications, setShowNotifications] = useState(true);
  const [lastSeenNotificationTime, setLastSeenNotificationTime] = useState(0);
  const initialCloudLoad = useRef(false);

  const tripDoc = useMemo(() => doc(db, "trips", "dallas-2026"), []);

  const mergeData = (cloudData) => ({
    ...starter,
    ...cloudData,
    people: cloudData.people || [],
    flights: (cloudData.flights || []).map(normalizeOption),
    stay: (cloudData.stay || []).map(normalizeOption),
    cars: (cloudData.cars || []).map(normalizeOption),
    activities: (cloudData.activities || []).map(normalizeOption),
    food: (cloudData.food || []).map(normalizeOption),
    shopping: (cloudData.shopping || []).map(normalizeOption),
    finalPicks: { ...starter.finalPicks, ...(cloudData.finalPicks || {}) },
    expenses: cloudData.expenses || [],
    presence: cloudData.presence || {},
    notifications: cloudData.notifications || [],
  });

  useEffect(() => {
    localStorage.setItem("dallasDark", String(dark));
  }, [dark]);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(tripDoc, async (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        if (cloudData.data) setData(mergeData(cloudData.data));
      } else {
        await setDoc(tripDoc, { data: starter, updatedAt: serverTimestamp() });
      }
      initialCloudLoad.current = true;
      setCloudReady(true);
    });

    return unsubscribe;
  }, [tripDoc]);

  useEffect(() => {
    if (!cloudReady || !user || !initialCloudLoad.current) return;

    const saveTimer = setTimeout(() => {
      setDoc(
        tripDoc,
        {
          data,
          updatedAt: serverTimestamp(),
          updatedBy: {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
          },
        },
        { merge: true }
      );
    }, 900);

    return () => clearTimeout(saveTimer);
  }, [data, user, cloudReady, tripDoc]);

  const notify = (message) => {
    setData((prev) => ({
      ...prev,
      notifications: [
        { id: uid(), message, name: user?.displayName || "Someone", createdAt: Date.now() },
        ...(prev.notifications || []),
      ].slice(0, 8),
    }));
  };

  const handleLogin = async () => {
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setLastSeenNotificationTime(Date.now());
  };

  const clearNotifications = () => {
    setData((prev) => ({ ...prev, notifications: [] }));
    setLastSeenNotificationTime(Date.now());
  };

  const confirmedPeople = data.people.filter((person) => person.going).length;
  const headcount = Math.max(1, confirmedPeople);
  const currentItems = boardCategories.includes(active) ? data[active] || [] : [];
  const onlineUsers = Object.values(data.presence || {}).filter((person) => Date.now() - num(person.lastSeen) < 90000);
  const unreadNotifications = (data.notifications || []).filter((note) => num(note.createdAt) > lastSeenNotificationTime).length;

  const updatePresence = () => {
    if (!user) return;
    setData((prev) => ({
      ...prev,
      presence: {
        ...(prev.presence || {}),
        [user.uid]: {
          uid: user.uid,
          name: user.displayName || user.email,
          photoURL: user.photoURL || "",
          lastSeen: Date.now(),
        },
      },
    }));
  };

  useEffect(() => {
    if (!user || !cloudReady) return;
    updatePresence();
    const interval = setInterval(updatePresence, 120000);
    return () => clearInterval(interval);
  }, [user, cloudReady]);

  const addPerson = () => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    setData((prev) => {
      const alreadyExists = prev.people.some((person) => person.name.toLowerCase() === cleanName.toLowerCase());
      if (alreadyExists) return prev;

      return {
        ...prev,
        people: [...prev.people, { id: uid(), name: cleanName, going: true, paid: 0 }],
        notifications: [
          { id: uid(), message: `added ${cleanName} to the going list`, name: user?.displayName || "Someone", createdAt: Date.now() },
          ...(prev.notifications || []),
        ].slice(0, 8),
      };
    });

    setNewName("");
  };

  const togglePerson = (id) => {
    setData((prev) => ({
      ...prev,
      people: prev.people.map((person) =>
        person.id === id ? { ...person, going: !person.going } : person
      ),
    }));
  };

  const removePerson = (id) => {
    const person = data.people.find((p) => p.id === id);
    setData((prev) => ({ ...prev, people: prev.people.filter((person) => person.id !== id) }));
    if (person) notify(`removed ${person.name} from the going list`);
  };

  const addOption = () => {
    setData((prev) => ({ ...prev, [active]: [...prev[active], blankOption(user)] }));
    notify(`added a ${labels[active]} suggestion`);
  };

  const updateOption = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      [active]: prev[active].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const saveOption = (id) => {
    const item = currentItems.find((x) => x.id === id);
    setData((prev) => ({
      ...prev,
      [active]: prev[active].map((item) => (item.id === id ? { ...item, saved: true } : item)),
      notifications: [
        { id: uid(), message: `saved ${item?.title || labels[active] + " suggestion"}`, name: user?.displayName || "Someone", createdAt: Date.now() },
        ...(prev.notifications || []),
      ].slice(0, 8),
    }));
  };

  const editSavedOption = (id) => {
    setData((prev) => ({
      ...prev,
      [active]: prev[active].map((item) => (item.id === id ? { ...item, saved: false } : item)),
    }));
  };

  const removeOption = (id) => {
    setData((prev) => ({ ...prev, [active]: prev[active].filter((item) => item.id !== id) }));
    notify(`deleted a ${labels[active]} suggestion`);
  };

  const voteOption = (id, vote) => {
    if (!user) return;
    setData((prev) => ({
      ...prev,
      [active]: prev[active].map((item) => {
        if (item.id !== id) return item;
        const currentVote = item.votes?.[user.uid];
        const nextVotes = { ...(item.votes || {}) };
        if (currentVote === vote) delete nextVotes[user.uid];
        else nextVotes[user.uid] = vote;
        return { ...item, votes: nextVotes };
      }),
    }));
  };

  const addComment = (optionId, category, text) => {
    if (!text.trim()) return;
    setData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === optionId
          ? {
              ...item,
              comments: [
                ...(item.comments || []),
                {
                  id: uid(),
                  text: text.trim(),
                  name: user?.displayName || "Guest",
                  createdAt: Date.now(),
                },
              ],
            }
          : item
      ),
      notifications: [
        { id: uid(), message: `commented on a ${labels[category]} suggestion`, name: user?.displayName || "Someone", createdAt: Date.now() },
        ...(prev.notifications || []),
      ].slice(0, 8),
    }));
  };

  const removeComment = (optionId, category, commentId) => {
    setData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === optionId ? { ...item, comments: (item.comments || []).filter((c) => c.id !== commentId) } : item
      ),
    }));
  };

  const getGroupTotalForCategory = (item, category) => {
    if (num(item.groupTotal) > 0) return num(item.groupTotal);
    if (hasPersonPrice[category]) return num(item.pricePP) * headcount;
    return 0;
  };

  const getPricePPForCategory = (item, category) => {
    if (hasPersonPrice[category] && num(item.pricePP) > 0) return num(item.pricePP);
    if (num(item.groupTotal) > 0) return num(item.groupTotal) / headcount;
    return 0;
  };

  const getVoteScore = (item) => Object.values(item.votes || {}).reduce((sum, vote) => sum + vote, 0);
  const getGroupTotal = (item) => getGroupTotalForCategory(item, active);
  const getPricePP = (item) => getPricePPForCategory(item, active);

  const savedItems = currentItems.filter((item) => item.saved).sort((a, b) => getVoteScore(b) - getVoteScore(a));
  const draftItems = currentItems.filter((item) => !item.saved).sort((a, b) => getVoteScore(b) - getVoteScore(a));
  const activeTotal = currentItems.reduce((sum, item) => sum + getGroupTotal(item), 0);

  const setFinalPick = (category, optionId) => {
    setData((prev) => ({
      ...prev,
      finalPicks: { ...prev.finalPicks, [category]: optionId },
    }));
  };

  const finalRows = boardCategories.map((category) => {
    const selected = (data[category] || []).find((item) => item.id === data.finalPicks?.[category]);
    return {
      category,
      selected,
      groupTotal: selected ? getGroupTotalForCategory(selected, category) : 0,
      pricePP: selected ? getPricePPForCategory(selected, category) : 0,
    };
  });

  const grandTotal = finalRows.reduce((sum, row) => sum + row.groupTotal, 0);
  const grandPP = grandTotal / headcount;

  const addExpense = () => {
    if (!expenseDraft.title.trim() || num(expenseDraft.amount) <= 0) return;
    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { id: uid(), ...expenseDraft, amount: num(expenseDraft.amount), createdAt: Date.now() }],
      notifications: [
        { id: uid(), message: `added an expense: ${expenseDraft.title}`, name: user?.displayName || "Someone", createdAt: Date.now() },
        ...(prev.notifications || []),
      ].slice(0, 8),
    }));
    setExpenseDraft({ title: "", paidBy: "", amount: "", notes: "" });
  };

  const removeExpense = (id) => {
    setData((prev) => ({ ...prev, expenses: prev.expenses.filter((expense) => expense.id !== id) }));
  };

  const totalPaid = data.expenses.reduce((sum, expense) => sum + num(expense.amount), 0);
  const budgetShare = totalPaid / headcount;

  const personBalances = data.people.map((person) => {
    const paid = data.expenses.filter((expense) => expense.paidBy === person.name).reduce((sum, expense) => sum + num(expense.amount), 0);
    const owes = Math.max(0, budgetShare - paid);
    const getsBack = Math.max(0, paid - budgetShare);
    return { ...person, paid, owes, getsBack };
  });

  const creditors = personBalances.filter((person) => person.getsBack > 0.01).map((person) => ({ ...person, remaining: person.getsBack }));
  const debtors = personBalances.filter((person) => person.owes > 0.01).map((person) => ({ ...person, remaining: person.owes }));
  const owedTransactions = [];

  debtors.forEach((debtor) => {
    creditors.forEach((creditor) => {
      if (debtor.remaining <= 0.01 || creditor.remaining <= 0.01) return;
      const amount = Math.min(debtor.remaining, creditor.remaining);
      owedTransactions.push({ from: debtor.name, to: creditor.name, amount });
      debtor.remaining -= amount;
      creditor.remaining -= amount;
    });
  });

  const pageClass = dark
    ? "min-h-screen bg-[radial-gradient(circle_at_top_left,#1e1b4b_0,#020617_42%,#020617_100%)] text-white"
    : "min-h-screen bg-[radial-gradient(circle_at_top_left,#eef2ff_0,#f8fafc_32%,#f8fafc_100%)] text-slate-950";

  const panelClass = dark
    ? "rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    : "rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]";

  const inputClass = dark
    ? "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20"
    : "rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100";

  const showSidebar = active !== "budget";

  return (
    <div className={pageClass}>
      <style>{`
        button, a, input, select { -webkit-tap-highlight-color: transparent; }
        button, a { transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease; }
        button:active, a:active { transform: scale(0.97); }
        .mobile-card-motion { transition: transform 240ms ease, box-shadow 240ms ease, background-color 240ms ease; }
        .mobile-card-motion:active { transform: scale(0.99); }
        @media (hover: hover) { .mobile-card-motion:hover { transform: translateY(-4px); } }
      `}</style>
      <header className={dark ? "sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 shadow-sm backdrop-blur-2xl" : "sticky top-0 z-50 border-b border-white/80 bg-white/75 shadow-sm backdrop-blur-2xl"}>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                <MapPin size={13} /> Group Trip Planner
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <h1 className={dark ? "text-4xl font-black tracking-[-0.04em] text-white md:text-6xl" : "text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-6xl"}>DALLAS 2026</h1>
                <div className="mb-1 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-indigo-300">
                  <CalendarDays size={17} /> {getTripCountdownText()}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!user ? (
                  <button onClick={handleLogin} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-indigo-700">
                    Sign in with Google
                  </button>
                ) : (
                  <div className={dark ? "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-sm" : "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"}>
                    <img src={user.photoURL || "https://ui-avatars.com/api/?name=User"} alt="" className="h-10 w-10 rounded-full" />
                    <div>
                      <p className={dark ? "text-sm font-black text-white" : "text-sm font-black text-slate-950"}>{user.displayName}</p>
                      <p className="text-xs font-semibold text-slate-400">{user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Logout</button>
                  </div>
                )}

                <button onClick={toggleNotifications} className={dark ? "relative rounded-2xl bg-white/10 p-3 text-white" : "relative rounded-2xl bg-indigo-50 p-3 text-indigo-700"} aria-label="Toggle notifications">
                  <Bell size={18} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </button>

                <button onClick={() => setDark((prev) => !prev)} className={dark ? "rounded-2xl bg-white/10 p-3 text-white" : "rounded-2xl bg-slate-950 p-3 text-white"}>
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>

            <div className={dark ? "rounded-[1.75rem] border border-white/10 bg-white/10 p-4" : "rounded-[1.75rem] border border-indigo-100 bg-white p-4 shadow-[0_18px_60px_rgba(79,70,229,0.12)]"}>
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-slate-950 p-3 text-white"><Users size={22} /></div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-500">Confirmed People</p>
                  <p className={dark ? "text-3xl font-black text-white" : "text-3xl font-black text-slate-950"}>{confirmedPeople}</p>
                </div>
              </div>
              <div className="mt-4 flex -space-x-2">
                {onlineUsers.slice(0, 6).map((person) => (
                  <img key={person.uid} src={person.photoURL || `https://ui-avatars.com/api/?name=${person.name}`} alt="" title={person.name} className="h-8 w-8 rounded-full border-2 border-white" />
                ))}
                {onlineUsers.length > 0 && <span className="ml-4 text-xs font-black text-emerald-500">{onlineUsers.length} online</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = active === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActive(tab.id)} className={isActive ? "flex shrink-0 items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl shadow-slate-300" : dark ? "flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-slate-300 hover:text-white" : "flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-500 hover:border-indigo-200 hover:text-indigo-700"}>
                    <Icon size={17} /> {tab.label}
                  </button>
                );
              })}
            </div>
            <select value={active} onChange={(e) => setActive(e.target.value)} className={inputClass}>
              {tabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className={showSidebar ? "mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[360px_1fr] lg:px-8" : "mx-auto max-w-7xl px-4 py-8 lg:px-8"}>
        {showSidebar && (
          <aside className={panelClass}>
            <h2 className="text-2xl font-black">Who’s Going?</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">Add names and confirm who is going.</p>
            <div className="mt-5 flex gap-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPerson()} placeholder="Add name" className={`${inputClass} min-w-0 flex-1`} />
              <button onClick={addPerson} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Add</button>
            </div>
            <div className="mt-5 space-y-3">
              {data.people.map((person) => {
                const balance = personBalances.find((p) => p.id === person.id);
                return (
                  <div key={person.id} className={dark ? "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3" : "flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"}>
                    <div>
                      <p className="font-black">{person.name}</p>
                      <p className={person.going ? "text-xs font-bold text-emerald-600" : "text-xs font-bold text-slate-400"}>{person.going ? "Going" : "Not confirmed"}</p>
                      {balance && <p className="text-xs font-bold text-slate-400">Owes {currency(balance.owes)} · Gets back {currency(balance.getsBack)}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePerson(person.id)} className={person.going ? "rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700" : "rounded-xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-600"}>{person.going ? "Confirmed" : "Confirm"}</button>
                      <button onClick={() => removePerson(person.id)} className="rounded-xl bg-red-50 p-2 text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showNotifications && (
              <div className="mt-7 rounded-3xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-black text-indigo-700">
                    <Bell size={16} /> Recent Updates
                  </div>
                  {(data.notifications || []).length > 0 && (
                    <button onClick={clearNotifications} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-indigo-700 shadow-sm">
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {(data.notifications || []).slice(0, 5).map((note) => (
                    <div key={note.id} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
                      <span className="font-black text-slate-950">{note.name}</span> {note.message}
                    </div>
                  ))}
                  {(data.notifications || []).length === 0 && <p className="text-xs font-bold text-indigo-400">No updates yet.</p>}
                </div>
              </div>
            )}
          </aside>
        )}

        {boardCategories.includes(active) && (
          <section className={panelClass}>
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-black">{labels[active]}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">Draft suggestions first, then save them into premium cards.</p>
              </div>
              <button onClick={addOption} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><Plus size={18} />Add Suggestion</button>
            </div>

            <div className="mb-6 rounded-3xl bg-emerald-50 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-700">{labels[active]} estimated total</p>
              <p className="mt-2 text-4xl font-black text-emerald-700">{currency(activeTotal)}</p>
              <p className="mt-1 text-sm font-bold text-emerald-600">Split by {headcount} confirmed people</p>
            </div>

            <div className="grid gap-8">
              {savedItems.length > 0 && <div className="space-y-5"><div className="flex items-center gap-2"><CheckCircle2 className="text-indigo-500" size={21} /><h3 className="text-xl font-black">Saved Picks</h3></div>{savedItems.map((item, index) => <SavedSuggestionCard key={item.id} item={item} index={index} active={active} labels={labels} user={user} dark={dark} editSavedOption={editSavedOption} removeOption={removeOption} getGroupTotal={getGroupTotal} getPricePP={getPricePP} voteOption={voteOption} getVoteScore={getVoteScore} addComment={addComment} removeComment={removeComment} />)}</div>}
              <div className="space-y-5"><h3 className="text-xl font-black">Draft Suggestions</h3>{draftItems.length === 0 && <div className={dark ? "rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center" : "rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"}><p className="text-lg font-black">No draft suggestions.</p><p className="mt-1 text-sm font-semibold text-slate-400">Click Add Suggestion to add one.</p></div>}{draftItems.map((item, index) => <DraftSuggestionCard key={item.id} item={item} index={index} active={active} labels={labels} hasPersonPrice={hasPersonPrice} inputClass={inputClass} dark={dark} user={user} updateOption={updateOption} saveOption={saveOption} removeOption={removeOption} getGroupTotal={getGroupTotal} getPricePP={getPricePP} voteOption={voteOption} getVoteScore={getVoteScore} addComment={addComment} removeComment={removeComment} />)}</div>
            </div>
          </section>
        )}

        {active === "final" && (
          <section className={`${panelClass} ${showSidebar ? "" : "w-full"}`}>
            <div className="mb-6 flex items-center gap-3"><Trophy className="text-indigo-500" /><h2 className="text-3xl font-black">Final Picks</h2></div>
            <div className="grid gap-4">
              {finalRows.map((row) => (
                <div key={row.category} className={dark ? "grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-4 md:items-center" : "grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-4 md:items-center"}>
                  <p className="font-black">{labels[row.category]}</p>
                  <select value={data.finalPicks?.[row.category] || ""} onChange={(e) => setFinalPick(row.category, e.target.value)} className={inputClass}>
                    <option value="">Select final option</option>
                    {(data[row.category] || []).map((item, index) => <option key={item.id} value={item.id}>Option #{index + 1}: {item.title || "Untitled"}</option>)}
                  </select>
                  <p className="font-black text-emerald-600">Group: {currency(row.groupTotal)}</p>
                  <p className="font-black text-emerald-600">PP: {currency(row.pricePP)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,#4f46e5,#111827_48%,#020617)] p-7 text-white"><p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-100">Grand Total</p><p className="mt-3 text-5xl font-black">{currency(grandTotal)}</p><p className="mt-2 text-xl font-black text-emerald-300">{currency(grandPP)} per person</p></div>
          </section>
        )}

        {active === "budget" && (
          <section className={panelClass}>
            <div className="mb-6 flex items-center gap-3"><Wallet className="text-emerald-500" /><h2 className="text-3xl font-black">Budget Tracker</h2></div>
            <div className="grid gap-4 md:grid-cols-4">
              <input value={expenseDraft.title} onChange={(e) => setExpenseDraft({ ...expenseDraft, title: e.target.value })} placeholder="Expense name" className={inputClass} />
              <select value={expenseDraft.paidBy} onChange={(e) => setExpenseDraft({ ...expenseDraft, paidBy: e.target.value })} className={inputClass}><option value="">Paid by</option>{data.people.map((person) => <option key={person.id} value={person.name}>{person.name}</option>)}</select>
              <input type="number" value={expenseDraft.amount} onChange={(e) => setExpenseDraft({ ...expenseDraft, amount: e.target.value })} placeholder="Amount" className={inputClass} />
              <button onClick={addExpense} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Add Expense</button>
            </div>
            <input value={expenseDraft.notes} onChange={(e) => setExpenseDraft({ ...expenseDraft, notes: e.target.value })} placeholder="Notes" className={`${inputClass} mt-4 w-full`} />
            <div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-3xl bg-emerald-50 p-5"><p className="text-xs font-black uppercase text-emerald-700">Total Paid</p><p className="mt-2 text-3xl font-black text-emerald-700">{currency(totalPaid)}</p></div><div className="rounded-3xl bg-indigo-50 p-5"><p className="text-xs font-black uppercase text-indigo-700">Share Each</p><p className="mt-2 text-3xl font-black text-indigo-700">{currency(budgetShare)}</p></div><div className="rounded-3xl bg-slate-950 p-5 text-white"><p className="text-xs font-black uppercase text-slate-300">Confirmed</p><p className="mt-2 text-3xl font-black">{confirmedPeople}</p></div></div>
            <div className="mt-6 grid gap-4">{data.expenses.map((expense) => <div key={expense.id} className={dark ? "flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5" : "flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5"}><div><p className="font-black">{expense.title}</p><p className="text-sm font-semibold text-slate-400">Paid by {expense.paidBy || "Unknown"} · {expense.notes}</p></div><div className="flex items-center gap-3"><p className="font-black text-emerald-600">{currency(expense.amount)}</p><button onClick={() => removeExpense(expense.id)} className="rounded-xl bg-red-50 p-2 text-red-500"><Trash2 size={16} /></button></div></div>)}</div>
            <div className="mt-8"><h3 className="mb-4 text-2xl font-black">Owed Money Tracker</h3><div className="grid gap-4 md:grid-cols-2">{owedTransactions.length === 0 && <div className="rounded-3xl bg-emerald-50 p-5 text-sm font-black text-emerald-700">No one owes anyone yet.</div>}{owedTransactions.map((tx, index) => <div key={`${tx.from}-${tx.to}-${index}`} className={dark ? "rounded-3xl border border-white/10 bg-white/5 p-5" : "rounded-3xl border border-slate-200 bg-slate-50 p-5"}><p className="text-lg font-black">{tx.from} owes {tx.to}</p><p className="mt-2 text-3xl font-black text-red-500">{currency(tx.amount)}</p></div>)}</div></div>
          </section>
        )}
      </main>
    </div>
  );
}

function DraftSuggestionCard({ item, index, active, labels, hasPersonPrice, inputClass, dark, user, updateOption, saveOption, removeOption, getGroupTotal, getPricePP, voteOption, getVoteScore, addComment, removeComment }) {
  const href = item.link?.startsWith("http") ? item.link : item.link ? `https://${item.link}` : "";
  const userVote = user ? item.votes?.[user.uid] : undefined;

  return (
    <div className={dark ? "mobile-card-motion rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10" : "mobile-card-motion rounded-3xl border border-slate-200 bg-slate-50 p-6 hover:shadow-xl"}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black">Draft Suggestion #{index + 1}</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">Added by {item.createdByName || item.submittedBy || "Unknown"}</p>
          {href && <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">Open link <ExternalLink size={13} /></a>}
        </div>
        <button onClick={() => removeOption(item.id)} className="rounded-2xl bg-red-50 p-3 text-red-500 transition hover:bg-red-100"><Trash2 size={18} /></button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input value={item.title} onChange={(e) => updateOption(item.id, "title", e.target.value)} placeholder={`${labels[active]} name`} className={inputClass} />
        <input value={item.submittedBy} onChange={(e) => updateOption(item.id, "submittedBy", e.target.value)} placeholder="Submitted by" className={inputClass} />
        <input value={item.link} onChange={(e) => updateOption(item.id, "link", e.target.value)} placeholder="Paste link here" className={`${inputClass} md:col-span-2`} />
        {hasPersonPrice[active] && <input type="number" value={item.pricePP} onChange={(e) => updateOption(item.id, "pricePP", e.target.value)} placeholder="Price for 1 person" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-100" />}
        <input type="number" value={item.groupTotal} onChange={(e) => updateOption(item.id, "groupTotal", e.target.value)} placeholder="Group total if known" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-100" />
        <input value={item.notes} onChange={(e) => updateOption(item.id, "notes", e.target.value)} placeholder="Notes" className={`${inputClass} md:col-span-2`} />
      </div>

      <CostRow dark={dark} groupTotal={getGroupTotal(item)} pricePP={getPricePP(item)} />
      <ActionRow item={item} user={user} userVote={userVote} voteOption={voteOption} getVoteScore={getVoteScore} />

      <button onClick={() => saveOption(item.id)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-0.5">
        <Save size={18} /> Save as Premium Card
      </button>

      <CommentBox item={item} category={active} addComment={addComment} removeComment={removeComment} dark={dark} />
    </div>
  );
}

function SavedSuggestionCard({ item, index, active, labels, user, dark, editSavedOption, removeOption, getGroupTotal, getPricePP, voteOption, getVoteScore, addComment, removeComment }) {
  const href = item.link?.startsWith("http") ? item.link : item.link ? `https://${item.link}` : "";
  const userVote = user ? item.votes?.[user.uid] : undefined;

  return (
    <div className="mobile-card-motion group relative overflow-hidden rounded-[2.25rem] border border-indigo-200 bg-[radial-gradient(circle_at_top_left,#eef2ff,#ffffff_42%,#ecfdf5_100%)] p-7 shadow-[0_30px_100px_rgba(79,70,229,0.20)] ring-4 ring-indigo-100 hover:shadow-[0_35px_120px_rgba(79,70,229,0.28)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-emerald-200/60 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
            <CheckCircle2 size={15} /> Saved Pick
          </div>
          <h3 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {item.title || `${labels[active]} Suggestion #${index + 1}`}
          </h3>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Added by {item.createdByName || item.submittedBy || "Unknown"}
          </p>
          {item.notes && <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-700">{item.notes}</p>}
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button onClick={() => editSavedOption(item.id)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-100"><Pencil size={15} /> Edit</button>
          <button onClick={() => removeOption(item.id)} className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black text-red-600 shadow-sm transition hover:bg-red-100"><Trash2 size={15} /> Delete</button>
        </div>
      </div>

      <div className="relative mt-7 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white/85 p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Group Total</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{currency(getGroupTotal(item))}</p>
        </div>
        <div className="rounded-3xl bg-emerald-50/90 p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Per Person</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{currency(getPricePP(item))}</p>
        </div>
        <div className="rounded-3xl bg-indigo-50/90 p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Votes</p>
          <p className="mt-2 text-3xl font-black text-indigo-700">{getVoteScore(item)}</p>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        {href && <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-indigo-700">Open Link <ExternalLink size={16} /></a>}
        <ActionRow item={item} user={user} userVote={userVote} voteOption={voteOption} getVoteScore={getVoteScore} compact />
      </div>

      <CommentBox item={item} category={active} addComment={addComment} removeComment={removeComment} dark={dark} savedCard />
    </div>
  );
}

function CostRow({ dark, groupTotal, pricePP }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className={dark ? "rounded-2xl bg-white/10 p-5" : "rounded-2xl bg-white p-5"}>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Group Total</p>
        <p className="mt-2 text-3xl font-black">{currency(groupTotal)}</p>
      </div>
      <div className="rounded-2xl bg-emerald-50 p-5">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Price Per Person</p>
        <p className="mt-2 text-3xl font-black text-emerald-700">{currency(pricePP)}</p>
      </div>
    </div>
  );
}

function ActionRow({ item, user, userVote, voteOption, getVoteScore, compact = false }) {
  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "mt-5 flex flex-wrap items-center gap-3"}>
      <button onClick={() => voteOption(item.id, 1)} className={userVote === 1 ? "inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white" : "inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"}><ThumbsUp size={16} /> Upvote</button>
      <button onClick={() => voteOption(item.id, -1)} className={userVote === -1 ? "inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white" : "inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600"}><ThumbsDown size={16} /> Downvote</button>
      {!compact && <span className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Score: {getVoteScore(item)}</span>}
    </div>
  );
}

function CommentBox({ item, category, addComment, removeComment, dark, savedCard = false }) {
  const [text, setText] = useState("");
  return (
    <div className={savedCard ? "relative mt-5 rounded-3xl border border-indigo-100 bg-white/70 p-4 backdrop-blur" : "relative mt-5 rounded-3xl border border-slate-200/60 bg-white/40 p-4 backdrop-blur"}>
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800"><MessageCircle size={16} /> Comments</div>
      <div className="space-y-2">
        {(item.comments || []).map((comment) => (
          <div key={comment.id} className={dark && !savedCard ? "flex items-start justify-between rounded-2xl bg-white/5 px-4 py-3" : "flex items-start justify-between rounded-2xl bg-white px-4 py-3"}>
            <div><p className="text-xs font-black text-indigo-500">{comment.name}</p><p className="text-sm font-semibold text-slate-700">{comment.text}</p></div>
            <button onClick={() => removeComment(item.id, category, comment.id)} className="text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add comment" className={dark && !savedCard ? "min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none" : "min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"} /><button onClick={() => { addComment(item.id, category, text); setText(""); }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Post</button></div>
    </div>
  );
}

export default App;
