import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
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
  Bot,
  X,
  Send,
  Search,
  Palette,
  MousePointer2,
  SlidersHorizontal,
  Sparkles,
  Menu,
  Home,
  Settings,
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


const defaultSpreadsheet = {
  columns: [
    { id: "person", title: "Person", type: "person" },
    { id: "status", title: "Status", type: "status" },
    { id: "owed6", title: "Amount Owed at 6 People", type: "moneyText" },
    { id: "owed7", title: "Amount Owed at 7 People", type: "moneyText" },
    { id: "refund7", title: "Refund if 7 People", type: "moneyText" },
    { id: "owed8", title: "Amount Owed at 8 People", type: "moneyText" },
    { id: "refund8", title: "Refund if 8 People", type: "moneyText" },
    { id: "paid", title: "Paid?", type: "paid" },
    { id: "notes", title: "Notes", type: "text" },
  ],
  rows: [
    { id: uid(), cells: { person: "Miseal", status: "Confirmed", owed6: "$577.00", owed7: "$494.57", refund7: "$82.43", owed8: "$432.75", refund8: "$144.25", paid: "No", notes: "" } },
    { id: uid(), cells: { person: "Uael", status: "Confirmed", owed6: "$577.00", owed7: "$494.57", refund7: "$82.43", owed8: "$432.75", refund8: "$144.25", paid: "No", notes: "" } },
    { id: uid(), cells: { person: "Natnael", status: "Confirmed", owed6: "$577.00", owed7: "$494.57", refund7: "$82.43", owed8: "$432.75", refund8: "$144.25", paid: "No", notes: "" } },
    { id: uid(), cells: { person: "Waseem", status: "Confirmed", owed6: "$577.00", owed7: "$494.57", refund7: "$82.43", owed8: "$432.75", refund8: "$144.25", paid: "No", notes: "" } },
    { id: uid(), cells: { person: "Nathan", status: "Confirmed", owed6: "$577.00", owed7: "$494.57", refund7: "$82.43", owed8: "$432.75", refund8: "$144.25", paid: "Paid car rental", notes: "Paid car rental" } },
    { id: uid(), cells: { person: "Samrawi", status: "Confirmed", owed6: "$577.00", owed7: "$494.57", refund7: "$82.43", owed8: "$432.75", refund8: "$144.25", paid: "No", notes: "" } },
    { id: uid(), cells: { person: "Emi", status: "Waiting", owed6: "TBD", owed7: "$494.57", refund7: "—", owed8: "$432.75", refund8: "—", paid: "No", notes: "Waiting to confirm" } },
    { id: uid(), cells: { person: "Kris", status: "Waiting", owed6: "TBD", owed7: "$494.57", refund7: "—", owed8: "$432.75", refund8: "—", paid: "No", notes: "Waiting to confirm" } },
  ],
  notes: `Trip Summary:\nAirbnb: $2,315.00\nCar rental: $1,147.00\nTotal shared cost: $3,462.00\n\nPayment Splits:\nIf 6 people total: $577.00 each\nIf 7 people total: $494.57 each\nIf 8 people total: $432.75 each\n\nRefund Plan:\nIf 1 more person joins, original 6 each get back $82.43.\nIf 2 more people join, original 6 each get back $144.25.\nIf Emi joins first and pays $494.57, then Kris joins later, Emi gets back $61.82.\n\nBest Method:\nTrack everything in this spreadsheet. Do not send refunds until Emi and Kris fully confirm. Whoever is holding the trip money should distribute refunds after the final headcount is locked. This avoids confusing back-and-forth payments.`,
  updatedAt: Date.now(),
};

const spreadsheetTemplates = {
  payment: {
    name: "Dallas Payment Split",
    columns: defaultSpreadsheet.columns,
    rows: defaultSpreadsheet.rows,
    notes: defaultSpreadsheet.notes,
  },
  trip: {
    name: "Trip Planning",
    columns: [
      { id: "item", title: "Item", type: "text" },
      { id: "price", title: "Price", type: "money" },
      { id: "link", title: "Link", type: "link" },
      { id: "status", title: "Status", type: "status" },
      { id: "notes", title: "Notes", type: "text" },
    ],
  },
  food: {
    name: "Food Tracker",
    columns: [
      { id: "restaurant", title: "Restaurant", type: "text" },
      { id: "area", title: "Area", type: "text" },
      { id: "price", title: "Price", type: "money" },
      { id: "rating", title: "Rating", type: "text" },
      { id: "notes", title: "Notes", type: "text" },
    ],
  },
  activities: {
    name: "Activity Tracker",
    columns: [
      { id: "activity", title: "Activity", type: "text" },
      { id: "cost", title: "Cost", type: "money" },
      { id: "date", title: "Date", type: "date" },
      { id: "status", title: "Status", type: "status" },
      { id: "link", title: "Link", type: "link" },
    ],
  },
};

const statusOptions = ["Confirmed", "Waiting", "Maybe", "Not Going", "Planning", "Booked", "Done", "Rejected", "Idea"];
const paidOptions = ["No", "Yes", "Partial", "Paid car rental", "Paid Airbnb", "Paid full", "Waiting"];

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
  settlements: [],
  presence: {},
  notifications: [],
  spreadsheet: defaultSpreadsheet,
};

const tabs = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "stay", label: "Stay", icon: Hotel },
  { id: "cars", label: "Car Rental", icon: Car },
  { id: "activities", label: "Activities", icon: Ticket },
  { id: "food", label: "Food", icon: Utensils },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "final", label: "Final Picks", icon: Trophy },
  { id: "budget", label: "Spreadsheet", icon: Wallet },
];

const labels = {
  flights: "Flights",
  stay: "Stay",
  cars: "Car Rental",
  activities: "Activities",
  food: "Food",
  shopping: "Shopping",
  final: "Final Picks",
  budget: "Trip Spreadsheet",
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
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudReady, setCloudReady] = useState(false);
  const [newName, setNewName] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("dallasDark") === "true");
  const [expenseDraft, setExpenseDraft] = useState({
    title: "",
    paidBy: "",
    amount: "",
    notes: "",
    splitMode: "equal",
    includedPeople: [],
    manualSplits: {},
  });
  const [processingPaymentKey, setProcessingPaymentKey] = useState("");
  const [showNotifications, setShowNotifications] = useState(true);
  const [lastSeenNotificationTime, setLastSeenNotificationTime] = useState(0);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      content: "Hey, I’m Dallas Assistant. Ask me about the trip plan, spreadsheet, final picks, or ideas for the itinerary.",
    },
  ]);
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [isSpreadsheetEditing, setIsSpreadsheetEditing] = useState(false);
  const [spreadsheetDraft, setSpreadsheetDraft] = useState(null);
  const [expandedSpreadsheetCards, setExpandedSpreadsheetCards] = useState({});
  const [spreadsheetViewMode, setSpreadsheetViewMode] = useState("compact");
  const [themePreset, setThemePreset] = useState(() => localStorage.getItem("dallasTheme") || "regular");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [zoomPickerOpen, setZoomPickerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const lastCursorWrite = useRef(0);
  const initialCloudLoad = useRef(false);
  const latestLocalWrite = useRef(0);

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
    expenses: (cloudData.expenses || []).map((expense) => ({
      splitMode: expense.splitMode || "equal",
      includedPeople: expense.includedPeople || [],
      manualSplits: expense.manualSplits || {},
      ...expense,
    })),
    settlements: cloudData.settlements || [],
    presence: cloudData.presence || {},
    notifications: cloudData.notifications || [],
    spreadsheet: {
      ...defaultSpreadsheet,
      ...(cloudData.spreadsheet || {}),
      columns: cloudData.spreadsheet?.columns?.length ? cloudData.spreadsheet.columns : defaultSpreadsheet.columns,
      rows: cloudData.spreadsheet?.rows || defaultSpreadsheet.rows,
      notes: cloudData.spreadsheet?.notes ?? defaultSpreadsheet.notes,
    },
  });

  useEffect(() => {
    localStorage.setItem("dallasDark", String(dark));
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("dallasTheme", themePreset);
  }, [themePreset]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(tripDoc, async (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;

      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        const cloudWriteTime = num(cloudData.clientUpdatedAt);
        const justWroteLocally = Date.now() - latestLocalWrite.current < 2500;

        if (!initialCloudLoad.current && cloudData.data) {
          setData(mergeData(cloudData.data));
        } else if (cloudData.data && cloudWriteTime > latestLocalWrite.current && !justWroteLocally) {
          setData(mergeData(cloudData.data));
        }
      } else {
        const writeTime = Date.now();
        latestLocalWrite.current = writeTime;
        await setDoc(tripDoc, {
          data: starter,
          clientUpdatedAt: writeTime,
          updatedAt: serverTimestamp(),
        });
      }

      initialCloudLoad.current = true;
      setCloudReady(true);
    });

    return unsubscribe;
  }, [tripDoc]);

  const writeData = async (nextData) => {
    const writeTime = Date.now();
    latestLocalWrite.current = writeTime;
    setData(nextData);

    if (!cloudReady) return;

    await setDoc(
      tripDoc,
      {
        data: nextData,
        clientUpdatedAt: writeTime,
        updatedAt: serverTimestamp(),
        updatedBy: user
          ? {
              uid: user.uid,
              name: user.displayName,
              email: user.email,
            }
          : null,
      },
      { merge: true }
    );
  };

  const updateData = (updater) => {
    setData((prev) => {
      const nextData = updater(prev);
      const writeTime = Date.now();
      latestLocalWrite.current = writeTime;

      if (cloudReady) {
        setDoc(
          tripDoc,
          {
            data: nextData,
            clientUpdatedAt: writeTime,
            updatedAt: serverTimestamp(),
            updatedBy: user
              ? {
                  uid: user.uid,
                  name: user.displayName,
                  email: user.email,
                }
              : null,
          },
          { merge: true }
        );
      }

      return nextData;
    });
  };

  const notify = (message) => {
    updateData((prev) => ({
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

  const askDallasAssistant = async () => {
    const message = assistantInput.trim();
    if (!message || assistantLoading) return;

    setAssistantMessages((prev) => [...prev, { role: "user", content: message }]);
    setAssistantInput("");
    setAssistantLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          tripData: {
            people: data.people,
            flights: data.flights,
            stay: data.stay,
            cars: data.cars,
            activities: data.activities,
            food: data.food,
            shopping: data.shopping,
            finalPicks: data.finalPicks,
            spreadsheet: data.spreadsheet,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gemini request failed.");
      }

      setAssistantMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
    } catch (error) {
      setAssistantMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setLastSeenNotificationTime(Date.now());
  };

  const clearNotifications = () => {
    updateData((prev) => ({ ...prev, notifications: [] }));
    setLastSeenNotificationTime(Date.now());
  };

  const confirmedPeople = data.people.filter((person) => person.going).length;
  const headcount = Math.max(1, confirmedPeople);
  const currentItems = boardCategories.includes(active) ? data[active] || [] : [];
  const onlineUsers = Object.values(data.presence || {}).filter((person) => Date.now() - num(person.lastSeen) < 90000);
  const unreadNotifications = (data.notifications || []).filter((note) => num(note.createdAt) > lastSeenNotificationTime).length;

  const updatePresence = () => {
    if (!user) return;
    updateData((prev) => ({
      ...prev,
      presence: {
        ...(prev.presence || {}),
        [user.uid]: {
          ...(prev.presence?.[user.uid] || {}),
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

  useEffect(() => {
    if (!user || !cloudReady) return;

    const handleMouseMove = (event) => {
      const now = Date.now();
      if (now - lastCursorWrite.current < 1800) return;
      lastCursorWrite.current = now;

      updateData((prev) => ({
        ...prev,
        presence: {
          ...(prev.presence || {}),
          [user.uid]: {
            ...(prev.presence?.[user.uid] || {}),
            uid: user.uid,
            name: user.displayName || user.email,
            photoURL: user.photoURL || "",
            lastSeen: now,
            cursor: {
              x: Math.round(event.clientX),
              y: Math.round(event.clientY),
            },
          },
        },
      }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [user, cloudReady]);

  const addPerson = () => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    updateData((prev) => {
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
    updateData((prev) => ({
      ...prev,
      people: prev.people.map((person) =>
        person.id === id ? { ...person, going: !person.going } : person
      ),
    }));
  };

  const removePerson = (id) => {
    const person = data.people.find((p) => p.id === id);
    updateData((prev) => ({ ...prev, people: prev.people.filter((person) => person.id !== id) }));
    if (person) notify(`removed ${person.name} from the going list`);
  };

  const addOption = () => {
    updateData((prev) => ({ ...prev, [active]: [...prev[active], blankOption(user)] }));
    notify(`added a ${labels[active]} suggestion`);
  };

  const updateOption = (id, field, value) => {
    updateData((prev) => ({
      ...prev,
      [active]: prev[active].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const saveOption = (id) => {
    const item = currentItems.find((x) => x.id === id);
    updateData((prev) => ({
      ...prev,
      [active]: prev[active].map((item) => (item.id === id ? { ...item, saved: true } : item)),
      notifications: [
        { id: uid(), message: `saved ${item?.title || labels[active] + " suggestion"}`, name: user?.displayName || "Someone", createdAt: Date.now() },
        ...(prev.notifications || []),
      ].slice(0, 8),
    }));
  };

  const editSavedOption = (id) => {
    updateData((prev) => ({
      ...prev,
      [active]: prev[active].map((item) => (item.id === id ? { ...item, saved: false } : item)),
    }));
  };

  const removeOption = (id) => {
    updateData((prev) => ({ ...prev, [active]: prev[active].filter((item) => item.id !== id) }));
    notify(`deleted a ${labels[active]} suggestion`);
  };

  const voteOption = (id, vote) => {
    if (!user) return;
    updateData((prev) => ({
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
    updateData((prev) => ({
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
    updateData((prev) => ({
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
    updateData((prev) => ({
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
    const includedPeople = expenseDraft.includedPeople.length
      ? expenseDraft.includedPeople
      : data.people.filter((person) => person.going).map((person) => person.name);

    const manualTotal = includedPeople.reduce(
      (sum, name) => sum + num(expenseDraft.manualSplits?.[name]),
      0
    );

    const finalAmount = expenseDraft.splitMode === "manual" ? manualTotal : num(expenseDraft.amount);

    if (!expenseDraft.title.trim() || finalAmount <= 0 || !expenseDraft.paidBy || includedPeople.length === 0) return;

    updateData((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        {
          id: uid(),
          ...expenseDraft,
          includedPeople,
          amount: finalAmount,
          createdAt: Date.now(),
        },
      ],
      notifications: [
        { id: uid(), message: `added an expense: ${expenseDraft.title}`, name: user?.displayName || "Someone", createdAt: Date.now() },
        ...(prev.notifications || []),
      ].slice(0, 8),
    }));

    setExpenseDraft({
      title: "",
      paidBy: "",
      amount: "",
      notes: "",
      splitMode: "equal",
      includedPeople: [],
      manualSplits: {},
    });
  };

  const removeExpense = (id) => {
    updateData((prev) => ({ ...prev, expenses: prev.expenses.filter((expense) => expense.id !== id) }));
  };

  const toggleExpensePerson = (name) => {
    setExpenseDraft((prev) => {
      const included = prev.includedPeople.includes(name);
      return {
        ...prev,
        includedPeople: included
          ? prev.includedPeople.filter((personName) => personName !== name)
          : [...prev.includedPeople, name],
      };
    });
  };

  const updateManualSplit = (name, value) => {
    setExpenseDraft((prev) => ({
      ...prev,
      manualSplits: {
        ...(prev.manualSplits || {}),
        [name]: value,
      },
    }));
  };

  const getPaymentKey = (tx) => `${tx.from}-${tx.to}-${Math.round(num(tx.amount) * 100)}`;

  const markTransactionPaid = async (tx) => {
    if (!user) return;

    const paymentKey = getPaymentKey(tx);
    if (processingPaymentKey === paymentKey) return;

    setProcessingPaymentKey(paymentKey);

    const settlement = {
      id: uid(),
      paymentKey,
      from: tx.from,
      to: tx.to,
      amount: Math.round(num(tx.amount) * 100) / 100,
      createdAt: Date.now(),
      markedBy: user?.displayName || "Someone",
    };

    const nextData = {
      ...data,
      settlements: [...(data.settlements || []), settlement],
      notifications: [
        { id: uid(), message: `marked ${tx.from}'s payment to ${tx.to} as paid`, name: user?.displayName || "Someone", createdAt: Date.now() },
        ...(data.notifications || []),
      ].slice(0, 8),
    };

    writeData(nextData);

    try {
      await setDoc(
        tripDoc,
        {
          data: nextData,
          updatedAt: serverTimestamp(),
          updatedBy: {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
          },
        },
        { merge: true }
      );
    } finally {
      setProcessingPaymentKey("");
    }
  };

  const undoSettlement = (id) => {
    updateData((prev) => ({
      ...prev,
      settlements: (prev.settlements || []).filter((settlement) => settlement.id !== id),
    }));
  };

  const totalPaid = data.expenses.reduce((sum, expense) => sum + num(expense.amount), 0);

  const paidByPerson = {};
  const shareByPerson = {};

  data.people.forEach((person) => {
    paidByPerson[person.name] = 0;
    shareByPerson[person.name] = 0;
  });

  data.expenses.forEach((expense) => {
    const includedPeople = expense.includedPeople?.length
      ? expense.includedPeople
      : data.people.filter((person) => person.going).map((person) => person.name);

    paidByPerson[expense.paidBy] = (paidByPerson[expense.paidBy] || 0) + num(expense.amount);

    if (expense.splitMode === "manual") {
      includedPeople.forEach((name) => {
        shareByPerson[name] = (shareByPerson[name] || 0) + num(expense.manualSplits?.[name]);
      });
    } else {
      const share = includedPeople.length ? num(expense.amount) / includedPeople.length : 0;
      includedPeople.forEach((name) => {
        shareByPerson[name] = (shareByPerson[name] || 0) + share;
      });
    }
  });

  const settledByPerson = {};
  const receivedByPerson = {};

  (data.settlements || []).forEach((settlement) => {
    settledByPerson[settlement.from] = (settledByPerson[settlement.from] || 0) + num(settlement.amount);
    receivedByPerson[settlement.to] = (receivedByPerson[settlement.to] || 0) + num(settlement.amount);
  });

  const personBalances = data.people.map((person) => {
    const paid = paidByPerson[person.name] || 0;
    const share = shareByPerson[person.name] || 0;
    const settlementPaid = settledByPerson[person.name] || 0;
    const settlementReceived = receivedByPerson[person.name] || 0;
    const net = paid - share - settlementReceived + settlementPaid;
    const owes = Math.max(0, -net);
    const getsBack = Math.max(0, net);
    return { ...person, paid, share, settlementPaid, settlementReceived, owes, getsBack };
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

  const savedSpreadsheet = data.spreadsheet || defaultSpreadsheet;
  const spreadsheet = isSpreadsheetEditing && spreadsheetDraft ? spreadsheetDraft : savedSpreadsheet;
  const spreadsheetColumns = spreadsheet.columns?.length ? spreadsheet.columns : defaultSpreadsheet.columns;
  const spreadsheetRows = spreadsheet.rows || [];
  const spreadsheetMoneyTotal = spreadsheetRows.reduce((sum, row) => {
    return sum + spreadsheetColumns.reduce((colSum, column) => {
      if (!["money", "moneyText"].includes(column.type)) return colSum;
      return colSum + num(String(row.cells?.[column.id] || "").replace(/[^0-9.-]/g, ""));
    }, 0);
  }, 0);
  const spreadsheetStatusColumn = spreadsheetColumns.find((column) => column.id === "status" || column.type === "status");
  const spreadsheetPaidColumn = spreadsheetColumns.find((column) => column.id === "paid" || column.type === "paid");
  const spreadsheetConfirmedCount = spreadsheetStatusColumn
    ? spreadsheetRows.filter((row) => String(row.cells?.[spreadsheetStatusColumn.id] || "").toLowerCase() === "confirmed").length
    : 0;
  const spreadsheetWaitingCount = spreadsheetStatusColumn
    ? spreadsheetRows.filter((row) => String(row.cells?.[spreadsheetStatusColumn.id] || "").toLowerCase() === "waiting").length
    : 0;
  const spreadsheetPaidCount = spreadsheetPaidColumn
    ? spreadsheetRows.filter((row) => String(row.cells?.[spreadsheetPaidColumn.id] || "").toLowerCase() !== "no").length
    : 0;

  const spreadsheetTableSize = {
    normal: {
      head: "min-w-[180px] border-l border-white/10 px-3 py-3 text-left align-top",
      rowNumber: "border-t border-slate-100 px-3 py-3 text-sm font-black text-slate-400",
      cell: "border-l border-t border-slate-100 px-3 py-3 align-top",
      input: "w-full min-w-[170px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100",
      display: "min-w-[170px] rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700",
      select: "w-full min-w-[170px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100",
      linkWrap: "flex min-w-[220px] items-center gap-2",
      linkInput: "min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100",
    },
    compact: {
      head: "min-w-[135px] border-l border-white/10 px-2 py-2 text-left align-top",
      rowNumber: "border-t border-slate-100 px-2 py-2 text-xs font-black text-slate-400",
      cell: "border-l border-t border-slate-100 px-2 py-2 align-top",
      input: "w-full min-w-[125px] rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100",
      display: "min-w-[125px] rounded-xl bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700",
      select: "w-full min-w-[125px] rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100",
      linkWrap: "flex min-w-[160px] items-center gap-1.5",
      linkInput: "min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-100",
    },
    tiny: {
      head: "min-w-[34px] border-l border-white/10 px-0.5 py-0.5 text-left align-top text-[7px] leading-none",
      rowNumber: "border-t border-slate-100 px-0.5 py-0.5 text-[7px] font-black text-slate-400",
      cell: "border-l border-t border-slate-100 px-0.5 py-0.5 align-top",
      input: "w-full min-w-[32px] rounded border border-slate-200 bg-slate-50 px-0.5 py-0.5 text-[7px] font-semibold leading-none text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-100",
      display: "min-w-[32px] rounded bg-slate-50 px-0.5 py-0.5 text-[7px] font-bold leading-none text-slate-700",
      select: "w-full min-w-[32px] rounded border border-slate-200 bg-slate-50 px-0.5 py-0.5 text-[7px] font-black leading-none text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-100",
      linkWrap: "flex min-w-[42px] items-center gap-0.5",
      linkInput: "min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-0.5 py-0.5 text-[7px] font-semibold leading-none outline-none focus:ring-1 focus:ring-indigo-100",
    },
  }[spreadsheetViewMode] || {};

  const requireEditUser = () => {
    if (user) return true;
    handleLogin();
    return false;
  };

  const updateSpreadsheet = (updater) => {
    if (!requireEditUser()) return;

    if (isSpreadsheetEditing) {
      setSpreadsheetDraft((prevDraft) => {
        const currentSheet = prevDraft || savedSpreadsheet || defaultSpreadsheet;
        return {
          ...currentSheet,
          ...updater(currentSheet),
          updatedAt: Date.now(),
        };
      });
      return;
    }

    updateData((prev) => {
      const currentSheet = prev.spreadsheet || defaultSpreadsheet;
      return {
        ...prev,
        spreadsheet: {
          ...currentSheet,
          ...updater(currentSheet),
          updatedAt: Date.now(),
        },
      };
    });
  };

  const startEditingSpreadsheet = () => {
    if (!requireEditUser()) return;
    setSpreadsheetDraft(JSON.parse(JSON.stringify(savedSpreadsheet || defaultSpreadsheet)));
    setIsSpreadsheetEditing(true);
  };

  const saveSpreadsheetChanges = () => {
    if (!requireEditUser()) return;
    if (!spreadsheetDraft) {
      setIsSpreadsheetEditing(false);
      return;
    }
    updateData((prev) => ({
      ...prev,
      spreadsheet: {
        ...spreadsheetDraft,
        updatedAt: Date.now(),
      },
    }));
    setIsSpreadsheetEditing(false);
    setSpreadsheetDraft(null);
  };

  const cancelSpreadsheetChanges = () => {
    setSpreadsheetDraft(null);
    setIsSpreadsheetEditing(false);
  };

  const addSpreadsheetRow = () => {
    updateSpreadsheet((sheet) => ({
      rows: [
        ...(sheet.rows || []),
        {
          id: uid(),
          cells: Object.fromEntries((sheet.columns || defaultSpreadsheet.columns).map((column) => [
              column.id,
              column.type === "status" ? "Waiting" : column.type === "paid" ? "No" : "",
            ])),
        },
      ],
    }));
  };

  const deleteSpreadsheetRow = (rowId) => {
    updateSpreadsheet((sheet) => ({
      rows: (sheet.rows || []).filter((row) => row.id !== rowId),
    }));
  };

  const addSpreadsheetColumn = () => {
    const title = window.prompt("Column title?", "New Column");
    if (!title?.trim()) return;
    const type = window.prompt("Column type? text, money, link, status, date", "text") || "text";
    const safeType = ["text", "money", "moneyText", "link", "status", "paid", "person", "date"].includes(type.toLowerCase()) ? type.toLowerCase() : "text";
    const columnId = `col_${uid().slice(0, 8)}`;

    updateSpreadsheet((sheet) => ({
      columns: [...(sheet.columns || []), { id: columnId, title: title.trim(), type: safeType }],
      rows: (sheet.rows || []).map((row) => ({
        ...row,
        cells: { ...(row.cells || {}), [columnId]: safeType === "status" ? "Waiting" : safeType === "paid" ? "No" : "" },
      })),
    }));
  };

  const renameSpreadsheetColumn = (columnId, title) => {
    updateSpreadsheet((sheet) => ({
      columns: (sheet.columns || []).map((column) => (column.id === columnId ? { ...column, title } : column)),
    }));
  };

  const deleteSpreadsheetColumn = (columnId) => {
    updateSpreadsheet((sheet) => ({
      columns: (sheet.columns || []).filter((column) => column.id !== columnId),
      rows: (sheet.rows || []).map((row) => {
        const nextCells = { ...(row.cells || {}) };
        delete nextCells[columnId];
        return { ...row, cells: nextCells };
      }),
    }));
  };

  const updateSpreadsheetCell = (rowId, columnId, value) => {
    updateSpreadsheet((sheet) => ({
      rows: (sheet.rows || []).map((row) =>
        row.id === rowId
          ? { ...row, cells: { ...(row.cells || {}), [columnId]: value } }
          : row
      ),
    }));
  };

  const startEditingSpreadsheetNotes = () => {
    if (!user) {
      handleLogin();
      return;
    }
    setNotesDraft(savedSpreadsheet.notes || "");
    setIsNotesEditing(true);
  };

  const saveSpreadsheetNotes = () => {
    if (!user) {
      handleLogin();
      return;
    }
    updateSpreadsheet(() => ({ notes: notesDraft }));
    setIsNotesEditing(false);
  };

  const cancelSpreadsheetNotes = () => {
    setNotesDraft(savedSpreadsheet.notes || "");
    setIsNotesEditing(false);
  };

  const applySpreadsheetTemplate = (templateKey) => {
    const template = spreadsheetTemplates[templateKey];
    if (!template) return;
    updateSpreadsheet(() => ({
      columns: template.columns,
      rows: template.rows || [
        {
          id: uid(),
          cells: Object.fromEntries(template.columns.map((column) => [column.id, column.type === "status" ? "Idea" : ""])),
        },
      ],
      notes: template.notes ?? "",
    }));
  };

  const exportSpreadsheetCsv = () => {
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      spreadsheetColumns.map((column) => escapeCsv(column.title)).join(","),
      ...spreadsheetRows.map((row) => spreadsheetColumns.map((column) => escapeCsv(row.cells?.[column.id] || "")).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dallas-2026-spreadsheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusPillClass = (status) => {
    if (["Confirmed", "Booked", "Done"].includes(status)) return "bg-emerald-100 text-emerald-700";
    if (["Waiting", "Planning", "Maybe", "Idea"].includes(status)) return "bg-amber-100 text-amber-700";
    if (["Rejected", "Not Going"].includes(status)) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  const getPaidPillClass = (paid) => {
    if (["Yes", "Paid full", "Paid car rental", "Paid Airbnb"].includes(paid)) return "bg-emerald-100 text-emerald-700";
    if (["Partial"].includes(paid)) return "bg-amber-100 text-amber-700";
    if (["No", "Waiting"].includes(paid)) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  const themeStyles = {
    regular: {
      light: "min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_42%,#eef2ff_100%)] text-slate-950",
      dark: "min-h-screen bg-[linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)] text-white",
    },
    sakura: {
      light: "min-h-screen bg-[radial-gradient(circle_at_16%_10%,#ffe4f1_0,#fff7ed_38%,#ffffff_100%)] text-slate-950",
      dark: "min-h-screen bg-[radial-gradient(circle_at_16%_10%,#7f1d1d_0,#4c0519_34%,#020617_100%)] text-white",
    },
    cyber: {
      light: "min-h-screen bg-[radial-gradient(circle_at_10%_10%,#cffafe_0,#fae8ff_38%,#f8fafc_100%)] text-slate-950",
      dark: "min-h-screen bg-[radial-gradient(circle_at_12%_14%,#22d3ee_0,#6d28d9_32%,#020617_68%,#000_100%)] text-white",
    },
    aurora: {
      light: "min-h-screen bg-[radial-gradient(circle_at_10%_20%,#bbf7d0_0,#dbeafe_36%,#fae8ff_72%,#fff_100%)] text-slate-950",
      dark: "min-h-screen bg-[radial-gradient(circle_at_12%_18%,#22c55e_0,#2563eb_28%,#581c87_58%,#020617_100%)] text-white",
    },
    frost: {
      light: "min-h-screen bg-[radial-gradient(circle_at_15%_15%,#e0f2fe_0,#f8fafc_42%,#ffffff_100%)] text-slate-950",
      dark: "min-h-screen bg-[radial-gradient(circle_at_15%_15%,#67e8f9_0,#1e3a8a_32%,#020617_100%)] text-white",
    },
    sunset: {
      light: "min-h-screen bg-[radial-gradient(circle_at_top_left,#ffedd5_0,#fff1f2_38%,#ffffff_100%)] text-slate-950",
      dark: "min-h-screen bg-[radial-gradient(circle_at_top_left,#fb923c_0,#be123c_36%,#020617_100%)] text-white",
    },
    midnight: {
      light: "min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_38%,#eef2ff_100%)] text-slate-950",
      dark: "min-h-screen bg-[radial-gradient(circle_at_top_left,#1e293b_0,#020617_55%,#000_100%)] text-white",
    },
  };

  const themeChoices = [
    ["regular", "Regular", "bg-gradient-to-br from-slate-100 via-white to-indigo-100", "Clean premium default look", "✨"],
    ["sakura", "Sakura", "bg-gradient-to-br from-pink-200 via-rose-300 to-orange-100", "Cherry tree, falling petals, soft glass", "🌸"],
    ["cyber", "Cyberpunk", "bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-blue-950", "Neon city, HUD glow, digital rain", "⚡"],
    ["aurora", "Aurora", "bg-gradient-to-br from-emerald-400 via-sky-500 to-purple-600", "Northern lights, stars, magical waves", "🌌"],
    ["frost", "Frost", "bg-gradient-to-br from-cyan-100 via-sky-200 to-white", "Snow, ice glass, crystal glow", "❄️"],
    ["sunset", "Sunset", "bg-gradient-to-br from-orange-400 via-rose-500 to-purple-700", "Golden hour, cinematic warmth", "🌅"],
    ["midnight", "Midnight", "bg-gradient-to-br from-blue-950 to-slate-950", "Cosmic luxury dark mode", "🌙"],
  ];

  const pageClass = themeStyles[themePreset]?.[dark ? "dark" : "light"] || themeStyles.regular[dark ? "dark" : "light"];

  const panelClass = dark
    ? "rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    : "rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]";

  const inputClass = dark
    ? "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20"
    : "rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100";

  const showSidebar = active !== "budget";

  const commandItems = [
    ...tabs.map((tab) => ({
      id: `tab-${tab.id}`,
      label: `Open ${tab.label}`,
      helper: "Navigation",
      action: () => setActive(tab.id),
    })),
    { id: "toggle-dark", label: dark ? "Switch to Light Mode" : "Switch to Dark Mode", helper: "Theme", action: () => setDark((prev) => !prev) },
    ...themeChoices.map(([themeId, themeLabel]) => ({
      id: `theme-${themeId}`,
      label: `Use ${themeLabel} Theme`,
      helper: "Theme",
      action: () => setThemePreset(themeId),
    })),
    { id: "spreadsheet-edit", label: "Edit Spreadsheet", helper: "Spreadsheet", action: () => { setActive("budget"); startEditingSpreadsheet(); } },
    { id: "spreadsheet-tiny", label: "Tiny Spreadsheet Zoom", helper: "Spreadsheet", action: () => { setActive("budget"); setSpreadsheetViewMode("tiny"); } },
    { id: "assistant", label: "Open Dallas Assistant", helper: "AI", action: () => setAssistantOpen(true) },
  ];

  const filteredCommandItems = commandItems.filter((item) => {
    const search = commandQuery.toLowerCase().trim();
    if (!search) return true;
    return `${item.label} ${item.helper}`.toLowerCase().includes(search);
  });

  const runCommand = (item) => {
    item.action();
    setCommandOpen(false);
    setCommandQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      if (currentY < 40) {
        setMobileHeaderHidden(false);
      } else if (currentY > lastScrollY.current + 12) {
        setMobileHeaderHidden(true);
      } else if (currentY < lastScrollY.current - 12) {
        setMobileHeaderHidden(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (authLoading) {
    return (
      <div className={pageClass}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className={dark ? "w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl" : "w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl"}>
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <h1 className={dark ? "text-3xl font-black text-white" : "text-3xl font-black text-slate-950"}>Loading Dallas 2026</h1>
            <p className="mt-2 text-sm font-bold text-slate-400">Checking app access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <style>{`
        button, a, input, select { -webkit-tap-highlight-color: transparent; }
        button, a { transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease; }
        button:active, a:active { transform: scale(0.97); }
        .mobile-card-motion { transition: transform 240ms ease, box-shadow 240ms ease, background-color 240ms ease; }
        .mobile-card-motion:active { transform: scale(0.99); }
        @media (hover: hover) { .mobile-card-motion:hover { transform: translateY(-4px); } }
        @keyframes pageFadeSlide { from { opacity: 0; transform: translateY(10px) scale(0.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .page-transition { animation: pageFadeSlide 260ms ease both; }
        @keyframes sakuraFall { 0% { transform: translate3d(0,-12vh,0) rotate(0deg); opacity: 0; } 10% { opacity: .95; } 100% { transform: translate3d(var(--drift),112vh,0) rotate(720deg); opacity: 0; } }
        @keyframes sakuraSway { 0%,100% { transform: rotate(-2deg) translateY(0); } 50% { transform: rotate(2deg) translateY(-8px); } }
        @keyframes branchSway { 0%,100% { transform: rotate(var(--r1)); } 50% { transform: rotate(var(--r2)); } }
        @keyframes blossomPulse { 0%,100% { transform: scale(1); filter: saturate(1); } 50% { transform: scale(1.04); filter: saturate(1.25); } }
        @keyframes auroraFlow { 0%,100% { transform: translateX(-8%) skewX(-10deg); opacity: .45; } 50% { transform: translateX(10%) skewX(12deg); opacity: .75; } }
        @keyframes luxuryShimmer { 0% { transform: translateX(-120%) rotate(12deg); } 100% { transform: translateX(120%) rotate(12deg); } }
        @keyframes cyberGrid { 0% { background-position: 0 0, 0 0; } 100% { background-position: 90px 90px, 90px 90px; } }
        @keyframes floatGlow { 0%,100% { transform: translateY(0) scale(1); opacity: .42; } 50% { transform: translateY(-18px) scale(1.06); opacity: .72; } }
        @keyframes snowDrift { 0% { transform: translateY(-10vh); opacity: 0; } 15% { opacity: .7; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes cyberStreak { 0% { transform: translateX(-30vw); opacity: 0; } 15% { opacity: .95; } 100% { transform: translateX(130vw); opacity: 0; } }
        @keyframes hoverCarFly { 0% { transform: translateX(-18vw) translateY(0); opacity: 0; } 12% { opacity: .9; } 50% { transform: translateX(52vw) translateY(-16px); } 100% { transform: translateX(118vw) translateY(8px); opacity: 0; } }
        @keyframes holoBlink { 0%,100% { opacity: .35; filter: blur(0px); } 50% { opacity: .95; filter: blur(.5px); } }
        @keyframes cloudDrift { 0% { transform: translateX(-18vw); } 100% { transform: translateX(118vw); } }
        @keyframes waterShimmer { 0%,100% { transform: translateX(-2%) scaleY(1); opacity: .5; } 50% { transform: translateX(2%) scaleY(1.05); opacity: .85; } }
        @keyframes midnightStars { 0% { background-position: 0 0; } 100% { background-position: 120px 80px; } }
        @keyframes sunsetPulse { 0%,100% { transform: scale(1); opacity: .75; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes mountainFog { 0%,100% { transform: translateX(-3%); opacity: .28; } 50% { transform: translateX(3%); opacity: .55; } }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-all duration-700">
        {themePreset === "regular" && (
          <>
            <div className={dark ? "absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.035),transparent_35%,rgba(99,102,241,.08))]" : "absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.95),transparent_38%,rgba(99,102,241,.08))]"} />
            <div className={dark ? "absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" : "absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl"} />
            <div className={dark ? "absolute right-[-8rem] bottom-[-8rem] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" : "absolute right-[-8rem] bottom-[-8rem] h-96 w-96 rounded-full bg-sky-200/35 blur-3xl"} />
            <div className={dark ? "absolute inset-0 opacity-[0.045]" : "absolute inset-0 opacity-[0.06]"} style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "46px 46px" }} />
          </>
        )}

        {themePreset === "sakura" && (
          <>
            <div className={dark ? "absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(190,24,93,.42),transparent_28%),linear-gradient(135deg,rgba(76,5,25,.72),rgba(15,23,42,.15),transparent)]" : "absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(251,207,232,.82),transparent_30%),linear-gradient(135deg,rgba(255,241,242,.70),rgba(255,247,237,.22),transparent)]"} />
            <div className={dark ? "absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-[#1b0b12]/80 via-rose-950/20 to-transparent" : "absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-pink-100/90 via-white/35 to-transparent"} />

            <div className="absolute left-[-4rem] bottom-0 h-[42rem] w-[44rem] origin-bottom" style={{ animation: "sakuraSway 9s ease-in-out infinite" }}>
              <div className={dark ? "absolute bottom-0 left-24 h-[36rem] w-16 rounded-full bg-gradient-to-b from-[#4a241b] via-[#2b120f] to-[#120606] shadow-[0_0_55px_rgba(244,63,94,.28)]" : "absolute bottom-0 left-24 h-[36rem] w-16 rounded-full bg-gradient-to-b from-[#8b4a32] via-[#5b2d20] to-[#32170f] shadow-[0_0_55px_rgba(251,113,133,.30)]"} />
              <div className={dark ? "absolute bottom-[21rem] left-[8.5rem] h-12 w-[28rem] origin-left rounded-full bg-[#2b120f]" : "absolute bottom-[21rem] left-[8.5rem] h-12 w-[28rem] origin-left rounded-full bg-[#5b2d20]"} style={{ "--r1": "-22deg", "--r2": "-18deg", animation: "branchSway 8s ease-in-out infinite" }} />
              <div className={dark ? "absolute bottom-[25rem] left-[9rem] h-10 w-[24rem] origin-left rounded-full bg-[#2b120f]" : "absolute bottom-[25rem] left-[9rem] h-10 w-[24rem] origin-left rounded-full bg-[#5b2d20]"} style={{ "--r1": "15deg", "--r2": "11deg", animation: "branchSway 10s ease-in-out infinite reverse" }} />
              <div className={dark ? "absolute bottom-[29rem] left-[7rem] h-8 w-[20rem] origin-left rounded-full bg-[#2b120f]" : "absolute bottom-[29rem] left-[7rem] h-8 w-[20rem] origin-left rounded-full bg-[#5b2d20]"} style={{ "--r1": "-45deg", "--r2": "-39deg", animation: "branchSway 11s ease-in-out infinite" }} />

              <div className={dark ? "absolute left-[12rem] top-[1rem] h-72 w-[34rem] rounded-[55%] bg-rose-900/70 blur-[2px] shadow-[0_0_80px_rgba(244,114,182,.38)]" : "absolute left-[12rem] top-[1rem] h-72 w-[34rem] rounded-[55%] bg-pink-300/90 blur-[2px] shadow-[0_0_80px_rgba(244,114,182,.35)]"} style={{ animation: "blossomPulse 7s ease-in-out infinite" }} />
              <div className={dark ? "absolute left-[7rem] top-[7rem] h-60 w-[30rem] rounded-[60%] bg-fuchsia-950/70 blur-[3px]" : "absolute left-[7rem] top-[7rem] h-60 w-[30rem] rounded-[60%] bg-rose-200/95 blur-[3px]"} style={{ animation: "blossomPulse 9s ease-in-out infinite reverse" }} />
              <div className={dark ? "absolute left-[20rem] top-[5rem] h-48 w-96 rounded-full bg-pink-950/60 blur-[2px]" : "absolute left-[20rem] top-[5rem] h-48 w-96 rounded-full bg-white/80 blur-[2px]"} />

              {[...Array(42)].map((_, i) => (
                <span key={i} className={dark ? "absolute text-pink-300/90 drop-shadow-[0_0_8px_rgba(244,114,182,.65)]" : "absolute text-pink-500 drop-shadow-sm"} style={{ left: `${8 + (i * 37) % 480}px`, top: `${24 + (i * 53) % 250}px`, fontSize: `${12 + (i % 5) * 3}px` }}>✿</span>
              ))}
            </div>

            <div className="absolute right-[-5rem] bottom-0 hidden h-[31rem] w-[30rem] origin-bottom md:block" style={{ animation: "sakuraSway 12s ease-in-out infinite reverse" }}>
              <div className={dark ? "absolute bottom-0 left-20 h-[27rem] w-12 rounded-full bg-gradient-to-b from-[#3d1a14] to-[#120606]" : "absolute bottom-0 left-20 h-[27rem] w-12 rounded-full bg-gradient-to-b from-[#7b3e2b] to-[#34170f]"} />
              <div className={dark ? "absolute bottom-[17rem] left-[6rem] h-9 w-[19rem] origin-left rotate-[22deg] rounded-full bg-[#32120f]" : "absolute bottom-[17rem] left-[6rem] h-9 w-[19rem] origin-left rotate-[22deg] rounded-full bg-[#6b3524]"} />
              <div className={dark ? "absolute left-[-2rem] top-6 h-56 w-[28rem] rounded-full bg-rose-950/70 blur-[2px] shadow-[0_0_60px_rgba(244,63,94,.26)]" : "absolute left-[-2rem] top-6 h-56 w-[28rem] rounded-full bg-pink-200/95 blur-[2px] shadow-[0_0_60px_rgba(244,114,182,.30)]"} />
              {[...Array(26)].map((_, i) => (
                <span key={i} className={dark ? "absolute text-rose-300/90" : "absolute text-rose-400"} style={{ left: `${(i * 31) % 330}px`, top: `${20 + (i * 29) % 165}px`, fontSize: `${11 + (i % 4) * 3}px` }}>✿</span>
              ))}
            </div>

            {[...Array(46)].map((_, i) => (
              <span key={i} className={dark ? "absolute -top-10 text-lg opacity-80 drop-shadow-[0_0_10px_rgba(244,114,182,.65)]" : "absolute -top-10 text-lg opacity-95 drop-shadow-sm"} style={{ left: `${(i * 13) % 100}%`, animation: `sakuraFall ${9 + (i % 8)}s linear ${i * 0.22}s infinite`, "--drift": `${i % 3 === 0 ? 150 : i % 3 === 1 ? -115 : 70}px` }}>{dark ? "✿" : "🌸"}</span>
            ))}
          </>
        )}

        {themePreset === "cyber" && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,.20),rgba(76,29,149,.22),rgba(2,6,23,.65))]" />
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,.28) 1px, transparent 1px)", backgroundSize: "46px 46px", animation: "cyberGrid 12s linear infinite" }} />
            <div className="absolute bottom-0 left-0 flex h-[42vh] w-full items-end gap-2 px-2 opacity-95">
              {[18,30,24,38,28,44,34,50,31,42,26,36,47,29,40,33].map((h, i) => (
                <div key={i} className="relative flex-1 overflow-hidden rounded-t-xl border border-cyan-300/20 bg-gradient-to-t from-slate-950 via-fuchsia-950/80 to-cyan-950/70 shadow-[0_0_24px_rgba(34,211,238,.22)]" style={{ height: `${h}vh` }}>
                  <div className="absolute inset-x-1 top-2 grid grid-cols-3 gap-1 opacity-80">
                    {[...Array(18)].map((_, w) => <span key={w} className={(w+i)%3===0 ? "h-1.5 rounded bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,.9)]" : "h-1.5 rounded bg-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,.7)]"} />)}
                  </div>
                  {(i === 3 || i === 8 || i === 12) && <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded bg-fuchsia-500/90 px-2 py-1 text-[8px] font-black text-white shadow-[0_0_18px_rgba(217,70,239,.9)]" style={{ animation: "holoBlink 1.8s ease-in-out infinite" }}>DALLAS</div>}
                </div>
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="absolute h-2 w-10 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,1)]" style={{ top: `${18 + i * 9}%`, animation: `hoverCarFly ${8 + i * 1.4}s linear ${i * 1.1}s infinite` }}>
                <span className="absolute -right-8 top-1/2 h-[2px] w-10 -translate-y-1/2 bg-gradient-to-r from-cyan-300 to-transparent" />
              </div>
            ))}
            {[...Array(12)].map((_, i) => <div key={i} className="absolute h-[2px] w-56 bg-gradient-to-r from-transparent via-cyan-300 to-transparent blur-[1px]" style={{ top: `${8 + i * 7}%`, animation: `cyberStreak ${4 + (i % 5)}s linear ${i * .45}s infinite` }} />)}
          </>
        )}
        {themePreset === "aurora" && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,7,18,.85),rgba(15,23,42,.35),rgba(240,249,255,.18))]" />
            <div className="absolute -top-24 left-[-10%] h-72 w-[120%] rotate-[-8deg] rounded-full bg-gradient-to-r from-emerald-400/45 via-cyan-300/25 to-violet-500/45 blur-3xl" style={{ animation: "auroraFlow 8s ease-in-out infinite" }} />
            <div className="absolute top-32 left-[-15%] h-56 w-[130%] rotate-[7deg] rounded-full bg-gradient-to-r from-purple-500/35 via-blue-400/25 to-green-300/35 blur-3xl" style={{ animation: "auroraFlow 11s ease-in-out infinite reverse" }} />
            <div className="absolute bottom-0 left-0 h-[26vh] w-full bg-gradient-to-t from-white/80 via-sky-100/35 to-transparent" />
            <div className="absolute bottom-0 left-[-5%] h-40 w-[55%] bg-white/70" style={{ clipPath: "polygon(0 100%, 12% 46%, 24% 78%, 34% 35%, 48% 70%, 64% 25%, 78% 70%, 100% 42%, 100% 100%)" }} />
            <div className="absolute bottom-0 right-[-8%] h-32 w-[55%] bg-slate-100/65" style={{ clipPath: "polygon(0 100%, 14% 58%, 29% 77%, 43% 36%, 58% 75%, 72% 48%, 100% 82%, 100% 100%)" }} />
            {[...Array(34)].map((_, i) => <span key={i} className="absolute text-white/75 drop-shadow-[0_0_8px_rgba(255,255,255,.8)]" style={{ left: `${(i*17)%100}%`, top: `${(i*23)%72}%`, fontSize: `${8 + (i%4)*2}px` }}>✦</span>)}
          </>
        )}
        {themePreset === "frost" && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(224,242,254,.96),rgba(248,250,252,.86),rgba(255,255,255,.98))] dark:bg-[linear-gradient(to_bottom,rgba(8,47,73,.88),rgba(30,64,175,.46),rgba(2,6,23,.82))]" />
            <div className="absolute bottom-0 left-0 h-[46vh] w-full bg-white/90 dark:bg-slate-100/30" style={{ clipPath: "polygon(0 100%, 0 62%, 9% 50%, 16% 68%, 25% 24%, 34% 66%, 44% 30%, 53% 70%, 65% 18%, 77% 64%, 87% 38%, 100% 72%, 100% 100%)" }} />
            <div className="absolute bottom-0 left-0 h-[34vh] w-full bg-sky-100/80 dark:bg-sky-950/45" style={{ clipPath: "polygon(0 100%, 0 76%, 11% 62%, 21% 86%, 33% 44%, 43% 78%, 56% 38%, 68% 82%, 80% 52%, 100% 85%, 100% 100%)" }} />
            <div className="absolute bottom-[12vh] left-0 h-24 w-full bg-white/35 blur-2xl" style={{ animation: "mountainFog 9s ease-in-out infinite" }} />
            {[...Array(16)].map((_, i) => <div key={i} className="absolute bottom-0 h-16 w-10 bg-emerald-950/30 dark:bg-cyan-950/55" style={{ left: `${(i*9)%100}%`, clipPath: "polygon(50% 0, 0 100%, 100% 100%)" }} />)}
            {[...Array(42)].map((_, i) => <span key={i} className="absolute -top-6 text-sm text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,.9)]" style={{ left: `${(i * 11) % 100}%`, animation: `snowDrift ${7 + (i % 7)}s linear ${i * 0.25}s infinite` }}>❄</span>)}
          </>
        )}
        {themePreset === "sunset" && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#7c2d12_0%,#fb7185_34%,#fdba74_58%,#0f172a_100%)] opacity-80" />
            <div className="absolute left-1/2 top-[14%] h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-yellow-200 via-orange-300 to-rose-400 shadow-[0_0_120px_rgba(251,191,36,.75)]" style={{ animation: "sunsetPulse 7s ease-in-out infinite" }} />
            <div className="absolute bottom-0 left-0 h-[36vh] w-full bg-gradient-to-b from-cyan-900/20 via-blue-950/55 to-slate-950/80" />
            {[...Array(8)].map((_, i) => <div key={i} className="absolute left-[-10%] h-10 w-[48vw] rounded-full bg-white/18 blur-xl" style={{ top: `${12 + i * 7}%`, animation: `cloudDrift ${24 + i * 3}s linear ${i * -3}s infinite` }} />)}
            {[...Array(7)].map((_, i) => <div key={i} className="absolute bottom-[${i * 3}vh] left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-orange-200/65 to-transparent" style={{ bottom: `${5 + i * 3}vh`, animation: `waterShimmer ${5 + i}s ease-in-out ${i*.3}s infinite` }} />)}
            {[...Array(20)].map((_, i) => <span key={i} className="absolute text-amber-100/65" style={{ left: `${(i*13)%100}%`, top: `${15+(i*7)%70}%`, animation: `floatGlow ${8+(i%4)}s ease-in-out ${i*.2}s infinite` }}>✧</span>)}
          </>
        )}
        {themePreset === "midnight" && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(30,64,175,.22),transparent_28%),radial-gradient(circle_at_78%_72%,rgba(88,28,135,.20),transparent_30%),linear-gradient(to_bottom,#020617,#000)]" />
            <div className="absolute inset-0 opacity-55" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.82) 1px, transparent 1.8px)", backgroundSize: "92px 78px", animation: "midnightStars 22s linear infinite" }} />
            {[...Array(18)].map((_, i) => <span key={i} className="absolute text-white drop-shadow-[0_0_10px_rgba(147,197,253,.9)]" style={{ left: `${(i*29)%100}%`, top: `${8+(i*17)%78}%`, fontSize: `${8+(i%5)*3}px`, opacity: `${0.35 + (i%5)*0.12}` }}>✦</span>)}
            <div className="absolute left-[-10rem] top-[-8rem] h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute right-[-8rem] bottom-[-8rem] h-96 w-96 rounded-full bg-purple-500/15 blur-3xl" />
          </>
        )}
      </div>


      <header className={dark ? `sticky top-0 z-50 border-b border-white/10 bg-slate-950/82 shadow-sm backdrop-blur-2xl transition-transform duration-300 md:hidden ${mobileHeaderHidden && !mobileMenuOpen ? "-translate-y-full" : "translate-y-0"}` : `sticky top-0 z-50 border-b border-white/80 bg-white/85 shadow-sm backdrop-blur-2xl transition-transform duration-300 md:hidden ${mobileHeaderHidden && !mobileMenuOpen ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={dark ? "truncate text-2xl font-black tracking-[-0.04em] text-white" : "truncate text-2xl font-black tracking-[-0.04em] text-slate-950"}>DALLAS 2026</h1>
              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black text-white">LIVE</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-black text-indigo-500"><CalendarDays size={13} /> {getTripCountdownText()}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => setAssistantOpen(true)} className={dark ? "rounded-2xl bg-white/10 p-3 text-white" : "rounded-2xl bg-indigo-50 p-3 text-indigo-700"} aria-label="Open Dallas Assistant">
              <Bot size={18} />
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className={dark ? "rounded-2xl bg-white/10 p-3 text-white" : "rounded-2xl bg-slate-950 p-3 text-white"} aria-label="Open mobile menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" />
          <div className={dark ? "absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 text-white shadow-2xl" : "absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto border-l border-slate-200 bg-white p-5 text-slate-950 shadow-2xl"}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500">Mobile Menu</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">Dallas 2026</h2>
                <p className="mt-1 text-sm font-bold text-slate-400">Quick controls without the giant desktop header.</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className={dark ? "rounded-2xl bg-white/10 p-3 text-white" : "rounded-2xl bg-slate-100 p-3 text-slate-700"}>
                <X size={18} />
              </button>
            </div>

            {!user ? (
              <button onClick={handleLogin} className="mb-5 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-indigo-200">Sign in with Google</button>
            ) : (
              <div className={dark ? "mb-5 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4" : "mb-5 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4"}>
                <img src={user.photoURL || "https://ui-avatars.com/api/?name=User"} alt="" className="h-11 w-11 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{user.displayName}</p>
                  <p className="truncate text-xs font-bold text-slate-400">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Logout</button>
              </div>
            )}

            <div className="mb-5 grid grid-cols-2 gap-3">
              <button onClick={() => setDark((prev) => !prev)} className={dark ? "rounded-3xl bg-white/10 p-4 text-left text-white" : "rounded-3xl bg-slate-100 p-4 text-left text-slate-800"}>
                {dark ? <Sun size={20} /> : <Moon size={20} />}
                <p className="mt-2 text-sm font-black">{dark ? "Light Mode" : "Dark Mode"}</p>
              </button>
              <button onClick={toggleNotifications} className={dark ? "relative rounded-3xl bg-white/10 p-4 text-left text-white" : "relative rounded-3xl bg-indigo-50 p-4 text-left text-indigo-700"}>
                <Bell size={20} />
                <p className="mt-2 text-sm font-black">Notifications</p>
                {unreadNotifications > 0 && <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{unreadNotifications}</span>}
              </button>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Themes</p>
              <div className="flex gap-2 overflow-x-auto rounded-3xl bg-slate-950/5 p-2 dark:bg-white/5">
                {themeChoices.map(([themeId, themeLabel, swatch, description, emoji]) => (
                  <button
                    key={themeId}
                    onClick={() => setThemePreset(themeId)}
                    title={`${themeLabel}: ${description}`}
                    className={themePreset === themeId ? "relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-white text-lg shadow-[0_10px_30px_rgba(79,70,229,.35)] ring-2 ring-indigo-500" : "relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/60 text-lg shadow-lg"}
                  >
                    <span className={`absolute inset-0 rounded-2xl ${swatch}`} />
                    <span className="relative drop-shadow">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pages</p>
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = active === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { setActive(tab.id); setMobileMenuOpen(false); }} className={isActive ? "flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-3 text-sm font-black text-white" : dark ? "flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-sm font-black text-slate-200" : "flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-sm font-black text-slate-700"}>
                      <Icon size={16} /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">People</p>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">{confirmedPeople} confirmed</span>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {data.people.map((person) => (
                  <div key={person.id} className={dark ? "flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2" : "flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"}>
                    <div>
                      <p className="text-sm font-black">{person.name}</p>
                      <p className={person.going ? "text-xs font-bold text-emerald-500" : "text-xs font-bold text-slate-400"}>{person.going ? "Going" : "Not confirmed"}</p>
                    </div>
                    <button onClick={() => togglePerson(person.id)} className={person.going ? "rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700" : "rounded-xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-700"}>{person.going ? "Confirmed" : "Confirm"}</button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => { setAssistantOpen(true); setMobileMenuOpen(false); }} className="mt-auto rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl">
              Open Dallas Assistant
            </button>
          </div>
        </div>
      )}

      <header className={dark ? "sticky top-0 z-50 hidden border-b border-white/10 bg-slate-950/75 shadow-sm backdrop-blur-2xl md:block" : "sticky top-0 z-50 hidden border-b border-white/80 bg-white/75 shadow-sm backdrop-blur-2xl md:block"}>
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

                <div className="relative flex items-center gap-2">
                  <button
                    onClick={() => setThemePickerOpen((prev) => !prev)}
                    className={dark ? "inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white shadow-lg" : "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-lg shadow-slate-200"}
                    title="Theme"
                  >
                    <Palette size={18} />
                    <span className="hidden sm:inline">Theme</span>
                  </button>
                  {themePickerOpen && (
                    <div className="flex max-w-[calc(100vw-7rem)] gap-2 overflow-x-auto rounded-2xl bg-white/70 p-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-slate-950/70 dark:ring-white/10">
                      {themeChoices.map(([themeId, themeLabel, swatch, description, emoji]) => (
                        <button
                          key={themeId}
                          onClick={() => setThemePreset(themeId)}
                          title={`${themeLabel}: ${description}`}
                          className={themePreset === themeId ? "relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-white text-lg shadow-[0_10px_30px_rgba(79,70,229,.35)] ring-2 ring-indigo-500" : "relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/60 text-lg shadow-lg hover:scale-105"}
                        >
                          <span className={`absolute inset-0 rounded-2xl ${swatch}`} />
                          <span className="relative drop-shadow">{emoji}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                  <div key={person.uid} className="group relative">
                    <img
                      src={person.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || "User")}`}
                      alt={person.name || "Online user"}
                      title={person.name || "Online user"}
                      className="h-8 w-8 rounded-full border-2 border-white"
                    />
                    <div className="pointer-events-none absolute -top-10 left-1/2 z-[100] hidden -translate-x-1/2 whitespace-nowrap rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-xl group-hover:block group-focus:block">
                      {person.name || "Online user"}
                    </div>
                  </div>
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

      <main key={active} className={`${showSidebar ? "mx-auto grid max-w-7xl gap-6 px-3 py-4 pb-28 md:px-4 md:py-8 md:pb-8 lg:grid-cols-[360px_1fr] lg:px-8" : "mx-auto max-w-7xl px-3 py-4 pb-28 md:px-4 md:py-8 md:pb-8 lg:px-8"} page-transition`}>
        {showSidebar && (
          <aside className={`${panelClass} hidden md:block`}>
            <h2 className="text-2xl font-black">Who’s Going?</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">Add names and confirm who is going.</p>
            <div className="mt-5 flex gap-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPerson()} placeholder="Add name" className={`${inputClass} min-w-0 flex-1`} />
              <button onClick={addPerson} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Add</button>
            </div>
            <div className="mt-5 space-y-3">
              {data.people.map((person) => {
                return (
                  <div key={person.id} className={dark ? "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3" : "flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"}>
                    <div>
                      <p className="font-black">{person.name}</p>
                      <p className={person.going ? "text-xs font-bold text-emerald-600" : "text-xs font-bold text-slate-400"}>{person.going ? "Going" : "Not confirmed"}</p>
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
            <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-[radial-gradient(circle_at_top_left,#eef2ff,#ffffff_48%,#ecfdf5_100%)] p-6 shadow-[0_30px_100px_rgba(79,70,229,0.16)]">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-200/60 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-emerald-200/60 blur-3xl" />
              <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg">
                    <Wallet size={15} /> Premium Sheet
                  </div>
                  <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Dallas Trip Spreadsheet</h2>
                  <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-600">
                    Flexible live table for payments, links, plans, statuses, notes, and anything your group needs.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[290px]">
                  <div className="rounded-3xl bg-white/85 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-black uppercase text-slate-400">Rows</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{spreadsheetRows.length}</p>
                  </div>
                  <div className="rounded-3xl bg-white/85 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-black uppercase text-slate-400">Columns</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{spreadsheetColumns.length}</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-6 flex flex-wrap items-center gap-3">
                {!isSpreadsheetEditing ? (
                  <button onClick={startEditingSpreadsheet} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-300">
                    <Pencil size={17} /> Edit Spreadsheet
                  </button>
                ) : (
                  <>
                    <button onClick={saveSpreadsheetChanges} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-200">
                      <Save size={17} /> Save Spreadsheet
                    </button>
                    <button onClick={cancelSpreadsheetChanges} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">
                      Cancel
                    </button>
                  </>
                )}
                <button disabled={!isSpreadsheetEditing} onClick={addSpreadsheetRow} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-300 disabled:cursor-not-allowed disabled:opacity-40">
                  <Plus size={17} /> Add Row
                </button>
                <button disabled={!isSpreadsheetEditing} onClick={addSpreadsheetColumn} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-40">
                  <Plus size={17} /> Add Column
                </button>
                <button onClick={exportSpreadsheetCsv} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">
                  Export CSV
                </button>
                {!user && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700">Sign in to edit the spreadsheet.</p>}
                <div className="relative">
                  <button
                    onClick={() => setZoomPickerOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                    title="Spreadsheet zoom"
                  >
                    <SlidersHorizontal size={17} /> {spreadsheetViewMode === "tiny" ? "Tiny View" : spreadsheetViewMode === "compact" ? "Compact View" : "Normal View"}
                  </button>
                  {zoomPickerOpen && (
                    <div className="fixed right-4 top-24 z-[90] max-h-[60vh] w-[min(280px,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-2xl">
                      <p className="px-2 pb-2 text-xs font-black uppercase tracking-wider text-slate-400">Spreadsheet Zoom</p>
                      {[ ["normal", "Normal", "Comfortable editing"], ["compact", "Compact", "More visible at once"], ["tiny", "Tiny", "Maximum zoomed-out view"] ].map(([mode, label, helper]) => (
                        <button
                          key={mode}
                          onClick={() => { setSpreadsheetViewMode(mode); setZoomPickerOpen(false); }}
                          className={spreadsheetViewMode === mode ? "mb-1 w-full rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm font-black text-white" : "mb-1 w-full rounded-2xl px-4 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-100"}
                        >
                          <span className="block">{label}</span>
                          <span className="block text-[11px] font-bold opacity-70">{helper}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="ml-auto rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">{isSpreadsheetEditing ? "Editing draft" : "✓ Saved & locked"}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-slate-950 text-white">
                    <tr>
                      <th className="w-14 px-3 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-300">#</th>
                      {spreadsheetColumns.map((column) => (
                        <th key={column.id} className={spreadsheetTableSize.head}>
                          <div className="flex items-center gap-2">
                            <input
                              value={column.title}
                              onChange={(e) => renameSpreadsheetColumn(column.id, e.target.value)}
                              disabled={!isSpreadsheetEditing}
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white outline-none placeholder:text-slate-400"
                            />
                            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{column.type}</span>
                            {spreadsheetColumns.length > 1 && (
                              <button disabled={!isSpreadsheetEditing} onClick={() => deleteSpreadsheetColumn(column.id)} className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-20 border-l border-white/10 px-3 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spreadsheetRows.map((row, rowIndex) => (
                      <tr key={row.id} className="group hover:bg-indigo-50/50">
                        <td className={spreadsheetTableSize.rowNumber}>{rowIndex + 1}</td>
                        {spreadsheetColumns.map((column) => {
                          const value = row.cells?.[column.id] || "";
                          const isLocked = !isSpreadsheetEditing;
                          const personChoices = Array.from(new Set([...(data.people || []).map((person) => person.name), value].filter(Boolean)));
                          const paidChoices = Array.from(new Set([...paidOptions, value].filter(Boolean)));
                          const statusChoices = Array.from(new Set([...statusOptions, value].filter(Boolean)));
                          const displayValue = value || "—";

                          return (
                            <td key={column.id} className={spreadsheetTableSize.cell}>
                              {isLocked ? (
                                column.type === "link" && value ? (
                                  <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" className="inline-flex min-w-[120px] items-center justify-center rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">
                                    Open Link
                                  </a>
                                ) : column.type === "status" || column.id === "status" ? (
                                  <span className={`inline-flex rounded-2xl px-3 py-2 text-xs font-black ${getStatusPillClass(value || "Waiting")}`}>{displayValue}</span>
                                ) : column.type === "paid" || column.id === "paid" ? (
                                  <span className={`inline-flex rounded-2xl px-3 py-2 text-xs font-black ${getPaidPillClass(value || "No")}`}>{displayValue}</span>
                                ) : (
                                  <div className={spreadsheetTableSize.display}>{displayValue}</div>
                                )
                              ) : column.type === "status" || column.id === "status" ? (
                                <select
                                  value={value || "Waiting"}
                                  onChange={(e) => updateSpreadsheetCell(row.id, column.id, e.target.value)}
                                  className={`rounded-2xl px-3 py-2 text-xs font-black outline-none ${getStatusPillClass(value || "Waiting")}`}
                                >
                                  {statusChoices.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                              ) : column.type === "paid" || column.id === "paid" ? (
                                <select
                                  value={value || "No"}
                                  onChange={(e) => updateSpreadsheetCell(row.id, column.id, e.target.value)}
                                  className={`rounded-2xl px-3 py-2 text-xs font-black outline-none ${getPaidPillClass(value || "No")}`}
                                >
                                  {paidChoices.map((paid) => <option key={paid} value={paid}>{paid}</option>)}
                                </select>
                              ) : column.type === "person" || column.id === "person" ? (
                                <select
                                  value={value}
                                  onChange={(e) => updateSpreadsheetCell(row.id, column.id, e.target.value)}
                                  className={spreadsheetTableSize.select}
                                >
                                  <option value="">Select person</option>
                                  {personChoices.map((name) => <option key={name} value={name}>{name}</option>)}
                                </select>
                              ) : column.type === "link" ? (
                                <div className={spreadsheetTableSize.linkWrap}>
                                  <input
                                    value={value}
                                    onChange={(e) => updateSpreadsheetCell(row.id, column.id, e.target.value)}
                                    placeholder="Paste link"
                                    className={spreadsheetTableSize.linkInput}
                                  />
                                  {value && (
                                    <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">
                                      Open
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type={column.type === "money" ? "number" : column.type === "date" ? "date" : "text"}
                                  value={value}
                                  onChange={(e) => updateSpreadsheetCell(row.id, column.id, e.target.value)}
                                  placeholder={column.type === "money" || column.type === "moneyText" ? "$0" : "Type here"}
                                  className={spreadsheetTableSize.input}
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="border-l border-t border-slate-100 px-3 py-3">
                          <button disabled={!isSpreadsheetEditing} onClick={() => deleteSpreadsheetRow(row.id)} className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {spreadsheetRows.length === 0 && (
                      <tr>
                        <td colSpan={spreadsheetColumns.length + 2} className="px-6 py-12 text-center">
                          <p className="text-xl font-black text-slate-950">No rows yet.</p>
                          <p className="mt-1 text-sm font-bold text-slate-400">Add your first spreadsheet row to start planning.</p>
                          <button disabled={!isSpreadsheetEditing} onClick={addSpreadsheetRow} className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Add Row</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!isSpreadsheetEditing && (
              <div className="mt-8">
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
                      <CheckCircle2 size={15} /> Saved Sheet Cards
                    </div>
                    <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Payment Dashboard</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">Compact premium cards. Tap details for the full row without taking over the page.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 shadow-sm">Confirmed: {spreadsheetConfirmedCount}</span>
                    <span className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700 shadow-sm">Waiting: {spreadsheetWaitingCount}</span>
                    <span className="rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-black text-indigo-700 shadow-sm">Paid Notes: {spreadsheetPaidCount}</span>
                    <span className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-sm">✓ Saved</span>
                    <button onClick={() => setExpandedSpreadsheetCards(Object.fromEntries(spreadsheetRows.map((row) => [row.id, true])))} className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">Expand All</button>
                    <button onClick={() => setExpandedSpreadsheetCards({})} className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">Collapse All</button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {spreadsheetRows.map((row, index) => {
                    const personColumn = spreadsheetColumns.find((column) => column.id === "person") || spreadsheetColumns[0];
                    const statusColumn = spreadsheetColumns.find((column) => column.id === "status" || column.type === "status");
                    const paidColumn = spreadsheetColumns.find((column) => column.id === "paid" || column.type === "paid");
                    const amount6Column = spreadsheetColumns.find((column) => column.id === "amount6") || spreadsheetColumns.find((column) => column.title.toLowerCase().includes("6 people"));
                    const amount8Column = spreadsheetColumns.find((column) => column.id === "amount8") || spreadsheetColumns.find((column) => column.title.toLowerCase().includes("8 people"));
                    const refund8Column = spreadsheetColumns.find((column) => column.id === "refund8") || spreadsheetColumns.find((column) => column.title.toLowerCase().includes("refund if 8"));
                    const personName = row.cells?.[personColumn.id] || `Person ${index + 1}`;
                    const status = statusColumn ? row.cells?.[statusColumn.id] || "Waiting" : "Waiting";
                    const paid = paidColumn ? row.cells?.[paidColumn.id] || "No" : "No";
                    const currentAmount = amount6Column ? row.cells?.[amount6Column.id] || "—" : "—";
                    const finalAmount = amount8Column ? row.cells?.[amount8Column.id] || "—" : "—";
                    const refundAmount = refund8Column ? row.cells?.[refund8Column.id] || "—" : "—";
                    const isExpanded = !!expandedSpreadsheetCards[row.id];
                    const initials = personName
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const detailColumns = spreadsheetColumns.filter((column) => column.id !== personColumn.id);

                    return (
                      <div key={row.id} className="mobile-card-motion relative overflow-hidden rounded-[1.35rem] border border-indigo-100 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f8fafc_52%,#eef2ff_100%)] p-3 shadow-[0_14px_36px_rgba(79,70,229,0.11)] ring-1 ring-white hover:shadow-[0_18px_48px_rgba(79,70,229,0.16)]">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />
                        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-200/50 blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-emerald-200/50 blur-2xl" />

                        <div className="relative flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-300">
                              {initials || index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">Dallas 2026</p>
                              <h3 className="truncate text-xl font-black tracking-tight text-slate-950">{personName}</h3>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm ${getStatusPillClass(status)}`}>{status}</span>
                        </div>

                        <div className="relative mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-white/85 p-3 shadow-sm backdrop-blur">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Current</p>
                            <p className="mt-1 truncate text-lg font-black text-emerald-600">{currentAmount}</p>
                          </div>
                          <div className="rounded-2xl bg-white/85 p-3 shadow-sm backdrop-blur">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">8 People</p>
                            <p className="mt-1 truncate text-lg font-black text-slate-950">{finalAmount}</p>
                          </div>
                        </div>

                        <div className="relative mt-3 flex items-center justify-between gap-2">
                          <span className={`truncate rounded-full px-3 py-1.5 text-[10px] font-black shadow-sm ${getPaidPillClass(paid)}`}>{paid}</span>
                          <span className="truncate rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 shadow-sm">Refund: {refundAmount}</span>
                        </div>

                        {isExpanded && (
                          <div className="relative mt-3 grid gap-2 border-t border-indigo-100 pt-3">
                            {detailColumns.map((column) => {
                              const value = row.cells?.[column.id] || "—";
                              const isStatus = column.type === "status" || column.id === "status";
                              const isPaid = column.type === "paid" || column.id === "paid";
                              const isLink = column.type === "link" && value !== "—";

                              return (
                                <div key={column.id} className="grid grid-cols-[92px_1fr] items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
                                  <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{column.title}</p>
                                  {isLink ? (
                                    <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-[10px] font-black text-white">
                                      Open <ExternalLink size={11} />
                                    </a>
                                  ) : isStatus ? (
                                    <span className={`w-fit rounded-xl px-2.5 py-1 text-[10px] font-black ${getStatusPillClass(value === "—" ? "Waiting" : value)}`}>{value}</span>
                                  ) : isPaid ? (
                                    <span className={`w-fit rounded-xl px-2.5 py-1 text-[10px] font-black ${getPaidPillClass(value === "—" ? "No" : value)}`}>{value}</span>
                                  ) : (
                                    <p className="truncate text-xs font-black text-slate-800" title={value}>{value}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedSpreadsheetCards((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                          className="relative mt-3 w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-slate-200 hover:bg-indigo-700"
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="relative mt-8 overflow-hidden rounded-[2.5rem] border border-indigo-200 bg-[radial-gradient(circle_at_top_left,#eef2ff,#ffffff_42%,#ecfdf5_100%)] p-7 shadow-[0_30px_100px_rgba(79,70,229,0.22)] ring-4 ring-indigo-100">
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-indigo-300/40 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-emerald-300/45 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
                    <CheckCircle2 size={15} /> Saved Notes
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                    Dallas Payment Plan
                  </h3>
                  <p className="mt-2 max-w-xl text-sm font-bold text-slate-500">
                    Locked premium notes for the group. Click Edit Notes to make changes, then Save Notes to lock it again.
                  </p>
                </div>

                {!isNotesEditing ? (
                  <button
                    onClick={startEditingSpreadsheetNotes}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-slate-700 shadow-lg shadow-indigo-100 hover:bg-slate-950 hover:text-white"
                  >
                    <Pencil size={15} /> Edit Notes
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={saveSpreadsheetNotes}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                    >
                      <Save size={15} /> Save Notes
                    </button>
                    <button
                      onClick={cancelSpreadsheetNotes}
                      className="rounded-2xl bg-white px-5 py-3 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isNotesEditing ? (
                <div className="relative grid gap-4 md:grid-cols-[1fr_320px]">
                  <div className="whitespace-pre-wrap rounded-[2rem] border border-white/80 bg-white/85 px-6 py-5 text-sm font-bold leading-7 text-slate-700 shadow-xl shadow-indigo-100/50 backdrop-blur">
                    {spreadsheet.notes || "No notes saved yet."}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200">Status</p>
                      <p className="mt-2 text-2xl font-black">Saved & Locked</p>
                      <p className="mt-2 text-xs font-bold text-slate-300">Notes are view-only until someone edits them.</p>
                    </div>
                    <div className="rounded-[2rem] bg-emerald-50 p-5 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Best Method</p>
                      <p className="mt-2 text-sm font-black leading-6 text-emerald-800">Do not send refunds until the final headcount is locked.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-[2rem] border border-indigo-100 bg-white/90 p-4 shadow-xl shadow-indigo-100/50 backdrop-blur">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Add trip payment notes here..."
                    className="min-h-[320px] w-full resize-y rounded-[1.5rem] border border-indigo-100 bg-white px-5 py-4 text-sm font-bold leading-7 text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              )}
            </div>
          </section>
        )}

      </main>


      <nav className={dark ? "fixed inset-x-3 bottom-3 z-[65] rounded-[1.75rem] border border-white/10 bg-slate-950/88 p-2 shadow-2xl backdrop-blur-2xl md:hidden" : "fixed inset-x-3 bottom-3 z-[65] rounded-[1.75rem] border border-white/80 bg-white/90 p-2 shadow-2xl backdrop-blur-2xl md:hidden"}>
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: "flights", label: "Plans", icon: Plane },
            { id: "stay", label: "Stay", icon: Hotel },
            { id: "budget", label: "Sheet", icon: Wallet },
            { id: "final", label: "Final", icon: Trophy },
            { id: "menu", label: "Menu", icon: Menu },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.id === "menu" ? setMobileMenuOpen(true) : setActive(item.id)}
                className={isActive ? "flex flex-col items-center justify-center rounded-2xl bg-indigo-600 px-2 py-2 text-[10px] font-black text-white" : dark ? "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-300" : "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-500"}
              >
                <Icon size={18} />
                <span className="mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-5 right-5 z-[60] hidden md:inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_18px_60px_rgba(15,23,42,0.35)] hover:bg-indigo-700"
      >
        <Bot size={20} /> Dallas AI
      </button>

      {onlineUsers
        .filter((person) => person.uid !== user?.uid && person.cursor)
        .map((person) => (
          <div
            key={`cursor-${person.uid}`}
            className="pointer-events-none fixed z-[90] hidden md:block"
            style={{ left: `${person.cursor.x}px`, top: `${person.cursor.y}px` }}
          >
            <MousePointer2 className="h-5 w-5 text-indigo-600 drop-shadow" />
            <span className="ml-3 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black text-white shadow-xl">
              {person.name || "Online user"}
            </span>
          </div>
        ))}

      {commandOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/50 px-4 pt-20 backdrop-blur-sm" onClick={() => setCommandOpen(false)}>
          <div className={dark ? "mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl" : "mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-950 shadow-2xl"} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-200/20 px-5 py-4">
              <Search size={19} className="text-indigo-500" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Search pages, themes, spreadsheet actions..."
                className={dark ? "min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-500" : "min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"}
              />
              <span className="rounded-xl bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">ESC</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-3">
              {filteredCommandItems.slice(0, 12).map((item) => (
                <button
                  key={item.id}
                  onClick={() => runCommand(item)}
                  className={dark ? "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-white/10" : "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-indigo-50"}
                >
                  <span>
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="text-xs font-bold text-slate-400">{item.helper}</span>
                  </span>
                  <span className="text-xs font-black text-indigo-500">Enter</span>
                </button>
              ))}
              {filteredCommandItems.length === 0 && (
                <p className="px-4 py-8 text-center text-sm font-bold text-slate-400">No commands found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {assistantOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm md:flex md:items-end md:justify-end md:p-6">
          <div className={dark ? "flex h-full w-full flex-col bg-slate-950 text-white md:h-[720px] md:max-w-md md:rounded-[2rem] md:border md:border-white/10 md:shadow-2xl" : "flex h-full w-full flex-col bg-white text-slate-950 md:h-[720px] md:max-w-md md:rounded-[2rem] md:border md:border-slate-200 md:shadow-2xl"}>
            <div className="flex items-center justify-between border-b border-slate-200/20 p-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                  <Bot size={14} /> Dallas Assistant
                </div>
                <h2 className="mt-2 text-2xl font-black">Ask about the trip</h2>
              </div>
              <button onClick={() => setAssistantOpen(false)} className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {assistantMessages.map((msg, index) => (
                <div key={index} className={msg.role === "user" ? "ml-auto max-w-[85%] rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white" : "mr-auto max-w-[92%] rounded-3xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700"}>
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="mb-3 text-xl font-black leading-tight">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-black leading-tight">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-black leading-tight">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-black text-slate-950">{children}</strong>,
                      em: ({ children }) => <em className="font-semibold italic">{children}</em>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ))}
              {assistantLoading && (
                <div className="mr-auto max-w-[85%] rounded-3xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500">
                  Thinking...
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/20 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {["Analyze spreadsheet", "Summarize final picks", "Make a simple itinerary"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setAssistantInput(prompt)}
                    className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askDallasAssistant()}
                  placeholder="Ask Dallas Assistant..."
                  className={dark ? "min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none" : "min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none"}
                />
                <button onClick={askDallasAssistant} disabled={assistantLoading} className="rounded-2xl bg-slate-950 px-4 py-3 text-white disabled:opacity-50">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const groupTotal = getGroupTotal(item);
  const pricePP = getPricePP(item);
  const voteScore = getVoteScore(item);

  return (
    <div className="mobile-card-motion group relative overflow-hidden rounded-[1.6rem] border border-indigo-100 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f8fafc_58%,#eef2ff_100%)] p-4 shadow-[0_16px_46px_rgba(79,70,229,0.14)] ring-1 ring-white hover:shadow-[0_22px_60px_rgba(79,70,229,0.18)] md:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-200/45 blur-2xl" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-200/45 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-md">
            <CheckCircle2 size={12} /> Saved Pick
          </div>
          <h3 className="truncate text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            {item.title || `${labels[active]} Suggestion #${index + 1}`}
          </h3>
          <p className="mt-1 truncate text-xs font-bold text-slate-500">
            by {item.createdByName || item.submittedBy || "Unknown"}
          </p>
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => editSavedOption(item.id)} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-100"><Pencil size={13} /> Edit</button>
          <button onClick={() => removeOption(item.id)} className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 shadow-sm transition hover:bg-red-100"><Trash2 size={13} /> Delete</button>
        </div>
      </div>

      {item.notes && (
        <p className="relative mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
          {item.notes}
        </p>
      )}

      <div className="relative mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur">
        <div className="p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Group</p>
          <p className="mt-1 truncate text-lg font-black text-slate-950">{currency(groupTotal)}</p>
        </div>
        <div className="border-x border-slate-200 bg-emerald-50/80 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">Person</p>
          <p className="mt-1 truncate text-lg font-black text-emerald-700">{currency(pricePP)}</p>
        </div>
        <div className="bg-indigo-50/80 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-indigo-700">Votes</p>
          <p className="mt-1 truncate text-lg font-black text-indigo-700">{voteScore}</p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        {href && <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-md transition hover:bg-indigo-700">Open <ExternalLink size={13} /></a>}
        <ActionRow item={item} user={user} userVote={userVote} voteOption={voteOption} getVoteScore={getVoteScore} compact />
      </div>

      <CommentBox item={item} category={active} addComment={addComment} removeComment={removeComment} dark={dark} savedCard collapsedByDefault />
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
  const buttonSize = compact
    ? "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black"
    : "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black";

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "mt-5 flex flex-wrap items-center gap-3"}>
      <button onClick={() => voteOption(item.id, 1)} className={userVote === 1 ? `${buttonSize} bg-emerald-600 text-white` : `${buttonSize} bg-emerald-50 text-emerald-700`}><ThumbsUp size={compact ? 14 : 16} /> {compact ? `Up ${getVoteScore(item) > 0 ? getVoteScore(item) : ""}` : "Upvote"}</button>
      <button onClick={() => voteOption(item.id, -1)} className={userVote === -1 ? `${buttonSize} bg-red-600 text-white` : `${buttonSize} bg-red-50 text-red-600`}><ThumbsDown size={compact ? 14 : 16} /> {compact ? "Down" : "Downvote"}</button>
      {!compact && <span className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Score: {getVoteScore(item)}</span>}
    </div>
  );
}

function CommentBox({ item, category, addComment, removeComment, dark, savedCard = false, collapsedByDefault = false }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(!collapsedByDefault);
  const count = (item.comments || []).length;

  return (
    <div className={savedCard ? "relative mt-4 rounded-2xl border border-indigo-100 bg-white/70 p-3 backdrop-blur" : "relative mt-5 rounded-3xl border border-slate-200/60 bg-white/40 p-4 backdrop-blur"}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <MessageCircle size={16} /> Comments {count > 0 ? `(${count})` : ""}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <>
          <div className="mt-3 space-y-2">
            {(item.comments || []).map((comment) => (
              <div key={comment.id} className={dark && !savedCard ? "flex items-start justify-between rounded-2xl bg-white/5 px-4 py-3" : "flex items-start justify-between rounded-2xl bg-white px-4 py-3"}>
                <div><p className="text-xs font-black text-indigo-500">{comment.name}</p><p className="text-sm font-semibold text-slate-700">{comment.text}</p></div>
                <button onClick={() => removeComment(item.id, category, comment.id)} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
            {count === 0 && <p className="rounded-2xl bg-white/70 px-4 py-3 text-xs font-bold text-slate-400">No comments yet.</p>}
          </div>
          <div className="mt-3 flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add comment" className={dark && !savedCard ? "min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none" : "min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"} /><button onClick={() => { addComment(item.id, category, text); setText(""); }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Post</button></div>
        </>
      )}
    </div>
  );
}


export default App;
