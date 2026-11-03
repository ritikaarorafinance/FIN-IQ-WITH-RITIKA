import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { auth } from "./firebase"; // Needed for top-level access
import emailjs from 'emailjs-com';
import set6 from "./data/nism-series-viii/set6";
import set5 from "./data/nism-series-viii/set5";
import set4 from "./data/nism-series-viii/set4";
import set3 from "./data/nism-series-viii/set3";
import set2 from "./data/nism-series-viii/set2";
import set1 from "./data/nism-series-viii/set1";
import set7 from "./data/nism-series-viii/set7";
import set8 from "./data/nism-series-viii/set8";
import set9 from "./data/nism-series-viii/set9";
import set10 from "./data/nism-series-viii/set10";
import set11 from "./data/nism-series-viii/set11";
import set12 from "./data/nism-series-viii/set12";
import set13 from "./data/nism-series-viii/set13";
import set14 from "./data/nism-series-viii/set14";
import set15 from "./data/nism-series-viii/set15";
import set16 from "./data/nism-series-viii/set16";
import set17 from "./data/nism-series-viii/set17";
import set18 from "./data/nism-series-viii/set18";
import set19 from "./data/nism-series-viii/set19";
import set20 from "./data/nism-series-viii/set20";
import set21 from "./data/nism-series-viii/set21";
import set22 from "./data/nism-series-viii/set22";
import set23 from "./data/nism-series-viii/set23";
import set24 from "./data/nism-series-viii/set24";
import set25 from "./data/nism-series-viii/set25";
import set26 from "./data/nism-series-viii/set26";
import set27 from "./data/nism-series-viii/set27";
import set28 from "./data/nism-series-viii/set28";
import set29 from "./data/nism-series-viii/set29";
import set30 from "./data/nism-series-viii/set30";

import accSet1 from "./data/accounting/set1";
import accSet2 from "./data/accounting/set2";
import accSet3 from "./data/accounting/set3";

import finSet1 from "./data/financial-management/set1";
import finSet2 from "./data/financial-management/set2";
import finSet3 from "./data/financial-management/set3";
import finSet4 from "./data/financial-management/set4";
import finSet5 from "./data/financial-management/set5";
import finSet6 from "./data/financial-management/set6";
import finSet7 from "./data/financial-management/set7";
import finSet8 from "./data/financial-management/set8";

import equityResSet1 from "./data/equity-research/set1";
import equityResSet2 from "./data/equity-research/set2";
import equityResSet3 from "./data/equity-research/set3";
import equityResSet4 from "./data/equity-research/set4";
import equityResSet5 from "./data/equity-research/set5";
import equityResSet6 from "./data/equity-research/set6";
import equityResSet7 from "./data/equity-research/set7";
import equityResSet8 from "./data/equity-research/set8";
import equityResSet9 from "./data/equity-research/set9";
import equityResSet10 from "./data/equity-research/set10";
// import set data ... (imports are fine)

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AuthSystem from "./components/AuthSystem";
import { mockDb } from "./mockService";
import { AdminLogin, AdminDashboard } from './components/AdminSystem';
import { saveQuizProgress, getQuizProgress, saveQuizResult as saveQuizResultRemote } from "./services/db"; // Import DB service
import { db } from "./firebase"; // Needed for potential future use

import { collection, addDoc } from "firebase/firestore";

/* Utility: local storage hook for quiz state */
function useQuizState(courseKey, questions) {
  const { currentUser } = useAuth(); // Get current user
  const key = `nw_quiz_state_${courseKey}`;

  // Initialize state
  const [state, setState] = useState(() => {
    // 1. Try to load from localStorage first (fast render)
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { }

    // 2. Default init
    const init = {};
    (questions || []).forEach((q) => {
      init[q.id] = { selected: null, checked: false, correct: false, remainingTime: 300 };
    });
    init.__meta__ = { overallRemaining: 3600 };
    return init;
  });

  // Sync with Firestore on Mount (Load remote progress)
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    getQuizProgress(currentUser.uid, courseKey).then(remoteState => {
      if (isMounted && remoteState) {
        console.log("Loaded remote progress for", courseKey);
        // Verify if remote is "newer" or validity - for now just overwrite local
        // Ideally we merge, but overwriting is safer for "continue where left off" 
        setState(remoteState);
      }
    });

    return () => { isMounted = false; };
  }, [currentUser, courseKey]);

  // Save to LocalStorage AND Firestore on change
  useEffect(() => {
    // Local save (always)
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) { }

    // Remote save (debounced slightly or just direct)
    if (currentUser) {
      // We use a small timeout to avoid spamming DB on every single tick if timer is running
      // user checks an option -> immediate save
      const timer = setTimeout(() => {
        saveQuizProgress(currentUser.uid, courseKey, state);
      }, 2000); // 2 second debounce for timer updates etc.
      return () => clearTimeout(timer);
    }

  }, [key, state, currentUser]);


  const updateQuestion = (qid, patch) => {
    setState((s) => ({ ...s, [qid]: { ...s[qid], ...patch } }));
  };

  const resetAll = () => {
    const init = {};
    (questions || []).forEach((q) => {
      init[q.id] = { selected: null, checked: false, correct: false, remainingTime: 300 };
    });
    init.__meta__ = { overallRemaining: 3600 };
    setState(init);
  };

  return { state, updateQuestion, resetAll };
}

/* Header */
function Header() {
  const [isCloud, setIsCloud] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide global header on admin pages (admin has its own header)
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    import("./firebase").then(({ auth }) => {
      if (auth.app) setIsCloud(true);
    }).catch(() => setIsCloud(false));
  }, []);

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) { }
    navigate('/');
    closeMenu();
  };

  return (
    <header className="fixed w-full top-0 z-50 glass transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" onClick={closeMenu}>
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-gray-100 shadow-md group-hover:scale-105 transition-transform">
            <img
              src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2007_05_37%20PM.png"
              alt="FIN-IQ Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-primary-600">FIN-IQ WITH RITIKA</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Practice. Learn. Succeed.</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
          <Link to="/courses" className="hover:text-brand-600 transition-colors">Courses</Link>
          <ProfileMenu />
          <Link to="/about" className="hover:text-brand-600 transition-colors">About</Link>
          <Link to="/feedback" className="hover:text-brand-600 transition-colors">Feedback</Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-brand-600 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-100 shadow-lg animate-fade-in-down max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex flex-col p-4 space-y-4 font-medium text-slate-700">
            <Link to="/courses" onClick={closeMenu} className="px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">Courses</Link>
            <Link to="/about" onClick={closeMenu} className="px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">About</Link>
            <Link to="/feedback" onClick={closeMenu} className="px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">Feedback</Link>

            <div className="border-t border-slate-100 my-1"></div>

            {currentUser ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-brand-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-200">
                    {currentUser.photo ? (
                      <img src={currentUser.photo} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-brand-100 flex items-center justify-center text-xs text-brand-500 font-bold">
                        {currentUser.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-brand-900">{currentUser.fullName}</span>
                    <span className="text-xs text-brand-600">{currentUser.email}</span>
                  </div>
                </div>
                <Link to="/profile" onClick={closeMenu} className="px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">Track Records</Link>
                <Link to="/profile/edit" onClick={closeMenu} className="px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">Edit Profile</Link>
                <button onClick={handleLogout} className="text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold">Logout</button>
              </>
            ) : (
              <Link to="/auth" onClick={closeMenu} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-center font-semibold hover:bg-brand-700 transition-colors shadow-sm">Login / Signup</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function GlobalFooter() {
  const location = useLocation();

  // Hide global footer on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="mt-auto bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
          {/* Left: Logo */}
          <div className="flex justify-center md:justify-start">
            <Link to="/" className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-gray-100 shadow-md">
                <img
                  src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2007_05_37%20PM.png"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-slate-700 tracking-tight">FIN-IQ WITH RITIKA</span>
            </Link>
          </div>

          {/* Center: Copyright */}
          <div className="text-center font-bold text-slate-700 tracking-tight text-base opacity-80">
            <span className="font-bold text-slate-700 tracking-tight text-base opacity-80">©KRISHNA2380</span>. All rights reserved.
          </div>

          {/* Right: Links */}
          <div className="flex justify-center md:justify-end gap-6 text-sm font-medium text-slate-500">
            <Link to="/contact" className="hover:text-brand-600 transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms</Link>
            <span className="text-slate-300">|</span>
            <a href="/admin" className="hover:text-brand-600 transition-colors">Admin Login</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AuthLinks() {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Link to="/profile" className="hover:text-indigo-600 font-semibold text-indigo-700">Profile ({currentUser.email.split('@')[0]})</Link>;
  }
  // point to unified auth UI which supports guest, signup and login
  return <Link to="/auth" className="hover:text-indigo-600 font-semibold">Login</Link>;
}

function ProfileMenu() {
  const { currentUser, logout, setCurrentUserLocal } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const doLogout = async () => {
    try {
      await logout();
    } catch (e) { }
    try { setCurrentUserLocal && setCurrentUserLocal(null); } catch (e) { }
    navigate('/');
  };

  if (!currentUser) return <Link to="/auth" className="hover:text-indigo-600 font-semibold">Login</Link>;

  return (
    <div
      className="relative z-50"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-3 hover:text-brand-600 font-semibold focus:outline-none transition-colors py-2">
        <span className="hidden sm:inline font-medium text-slate-700">{currentUser.fullName || (currentUser.email || '').split('@')[0]}</span>
        <span className="inline-block w-9 h-9 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
          {currentUser.photo ? <img src={currentUser.photo} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-brand-50 flex items-center justify-center text-xs text-brand-400 font-bold">?</div>}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl py-2 animate-fade-in origin-top-right">
          <div className="px-4 py-2 border-b border-slate-50 mb-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Account</p>
          </div>
          <button onClick={() => { navigate('/profile/edit'); setOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-brand-50 text-slate-700 text-sm transition-colors">Edit Profile</button>
          <button onClick={() => { navigate('/profile'); setOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-brand-50 text-slate-700 text-sm transition-colors">Track Records</button>
          <div className="border-t border-slate-50 my-1"></div>
          <button onClick={doLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm transition-colors">Logout</button>
        </div>
      )}
    </div>
  );
}

/* Home */
function Home() {
  const courses = [
    {
      id: "nism-series-viii",
      title: "EQUITY & DERIVATIVES (NISM SERIES VIII)",
      desc: "Comprehensive preparation package containing 30 practice sets for NISM Series VIII. Master the exam with our extensive question bank.",
      isFolder: true,
      count: "30 Sets",
      link: "/courses/nism-series-viii",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_36_24%20PM.png"
    },
    {
      id: "accounting-series",
      title: "ACCOUNTING",
      desc: "Master the fundamentals of accounting, including journals, cash flow, and ratio analysis with our curated practice sets.",
      isFolder: true,
      count: "3 Sets",
      link: "/courses/accounting",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_02%20PM.png"
    },
    {
      id: "financial-management",
      title: "FINANCIAL MANAGEMENT",
      desc: "Comprehensive guide to financial decision making, capital budgeting, and cost of capital.",
      isFolder: true,
      count: "8 Sets",
      link: "/courses/financial-management",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_08%20PM.png"
    },
    {
      id: "equity-research",
      title: "EQUITY RESEARCH (NISM SERIES XV)",
      desc: "Prepare for NISM Series XV certification with comprehensive practice sets on equity research.",
      isFolder: true,
      count: "10 Sets",
      link: "/courses/equity-research",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_12%20PM.png"
    }
  ];

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <section className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in-up">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            Elevate your finance skills
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900">
            Master Finance & Excel with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-primary-500">Interactive Quizzes</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
            Short quizzes, instant feedback and a progress tracker to help you prepare for exams and interviews with confidence.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/courses" className="btn-primary px-8 py-3 rounded-xl font-semibold text-lg">Browse Courses</Link>
            <Link to="/about" className="btn-secondary px-8 py-3 rounded-xl font-semibold text-lg">Learn More</Link>
          </div>
        </div>
        <div className="relative lg:block">
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-200 to-primary-200 rounded-2xl opacity-30 blur-2xl animate-pulse-slow"></div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl glass p-2 hover:scale-[1.02] transition-transform duration-500">
            <img
              src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_39_06%20PM.png"
              alt="learning"
              className="w-full h-auto rounded-xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mt-24 relative px-4 sm:px-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-brand-600">✦</span> Featured Courses
          </h3>
          <Link to="/courses" className="text-brand-600 hover:text-brand-700 font-medium hover:underline decoration-2 underline-offset-4">View All &rarr;</Link>
        </div>

        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => document.getElementById('course-slider').scrollBy({ left: window.innerWidth > 768 ? -350 : -300, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-brand-600 hover:scale-110 transition-all focus:outline-none"
            aria-label="Scroll left"
          >
            ←
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => document.getElementById('course-slider').scrollBy({ left: window.innerWidth > 768 ? 350 : 300, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-brand-600 hover:scale-110 transition-all focus:outline-none"
            aria-label="Scroll right"
          >
            →
          </button>

          <div
            id="course-slider"
            className="flex gap-6 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {courses.map((c, i) => (
              <article
                key={c.id}
                className="min-w-full md:min-w-[calc(50%_-_12px)] lg:min-w-[calc(33.333%_-_16px)] snap-start group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div>
                  {c.logo ? (
                    <img src={c.logo} alt="Course Logo" className="w-12 h-12 rounded-xl mb-4 object-contain shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-4 text-xl">
                      {c.emoji}
                    </div>
                  )}
                  <h4 className="font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">{c.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2">{c.desc || "Master this topic with our comprehensive set of practice questions designed to test your knowledge."}</p>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{c.count}</span>
                  <Link to={c.link} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group-hover:gap-2 transition-all">View Series <span>&rarr;</span></Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination Dots (Visual Only for now) */}
          <div className="flex justify-center gap-2 absolute bottom-0 left-0 right-0 transform translate-y-4">
            {courses.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-brand-600 w-4' : 'bg-slate-300'}`}></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/* Series VIII List (Inside Folder) */
function SeriesVIIIList() {
  const [searchQuery, setSearchQuery] = useState("");

  const courses = [
    { id: "nism-viii-set1", title: "NISM Series VIII — Set 1", desc: "" },
    { id: "nism-viii-set2", title: "NISM Series VIII — Set 2", desc: "" },
    { id: "nism-viii-set3", title: "NISM Series VIII — Set 3", desc: "" },
    { id: "nism-viii-set4", title: "NISM Series VIII — Set 4", desc: "" },
    { id: "nism-viii-set5", title: "NISM Series VIII — Set 5", desc: "" },
    { id: "nism-viii-set6", title: "NISM Series VIII — Set 6", desc: "" },
    { id: "nism-viii-set7", title: "NISM Series VIII — Set 7", desc: "" },
    { id: "nism-viii-set8", title: "NISM Series VIII — Set 8", desc: "" },
    { id: "nism-viii-set9", title: "NISM Series VIII — Set 9", desc: "" },
    { id: "nism-viii-set10", title: "NISM Series VIII — Set 10", desc: "" },
    { id: "nism-viii-set11", title: "NISM Series VIII — Set 11", desc: "" },
    { id: "nism-viii-set12", title: "NISM Series VIII — Set 12", desc: "" },
    { id: "nism-viii-set13", title: "NISM Series VIII — Set 13", desc: "" },
    { id: "nism-viii-set14", title: "NISM Series VIII — Set 14", desc: "" },
    { id: "nism-viii-set15", title: "NISM Series VIII — Set 15", desc: "" },
    { id: "nism-viii-set16", title: "NISM Series VIII — Set 16", desc: "" },
    { id: "nism-viii-set17", title: "NISM Series VIII — Set 17", desc: "" },
    { id: "nism-viii-set18", title: "NISM Series VIII — Set 18", desc: "" },
    { id: "nism-viii-set19", title: "NISM Series VIII — Set 19", desc: "" },
    { id: "nism-viii-set20", title: "NISM Series VIII — Set 20", desc: "" },
    { id: "nism-viii-set21", title: "NISM Series VIII — Set 21", desc: "" },
    { id: "nism-viii-set22", title: "NISM Series VIII — Set 22", desc: "" },
    { id: "nism-viii-set23", title: "NISM Series VIII — Set 23", desc: "" },
    { id: "nism-viii-set24", title: "NISM Series VIII — Set 24", desc: "" },
    { id: "nism-viii-set25", title: "NISM Series VIII — Set 25", desc: "" },
    { id: "nism-viii-set26", title: "NISM Series VIII — Set 26", desc: "" },
    { id: "nism-viii-set27", title: "NISM Series VIII — Set 27", desc: "" },
    { id: "nism-viii-set28", title: "NISM Series VIII — Set 28", desc: "" },
    { id: "nism-viii-set29", title: "NISM Series VIII — Set 29", desc: "" },
    { id: "nism-viii-set30", title: "NISM Series VIII — Set 30", desc: "" }
  ];

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <img src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_36_24%20PM.png" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">EQUITY & DERIVATIVES (NISM SERIES VIII)</h2>
            <p className="text-slate-500 mt-1">Explore our collection of finance quizzes</p>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none w-full md:w-64"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((c, i) => (
          <Link to={`/course/${c.id}/quiz`} key={c.id} className="group bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-100 to-primary-100 text-brand-600 flex items-center justify-center text-2xl shadow-inner">
                📝
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center">
                <svg className="w-3 h-3 mr-1 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                60 Mins
              </span>
            </div>

            <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">{c.title}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-grow">{c.desc || "Comprehensive practice set to test your knowledge."}</p>

            <div className="pt-4 border-t border-slate-50 mt-auto flex justify-between items-center">
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md font-medium">Set {c.id.split('set')[1]}</span>
              <span className="text-sm font-semibold text-brand-700 hover:text-brand-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                Start Quiz <span>&rarr;</span>
              </span>
            </div>
          </Link>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No courses found matching "{searchQuery}"
          </div>
        )}
      </div>
    </main>
  );
}

/* Accounting List (Inside Folder) */
function AccountingList() {
  const [searchQuery, setSearchQuery] = useState("");

  const courses = [
    { id: "accounting-set1", title: "ACCOUNTS-BASIC ACCOUNTING", desc: "Covers fixed assets, liabilities, and basic definitions.", link: "/course/accounting-set1/quiz" },
    { id: "accounting-set2", title: "ACCOUNTS-JOURNAL, DISCOUNT & CASH FLOW", desc: "Understanding trade discount, cash flow activities, and ratios.", link: "/course/accounting-set2/quiz" },
    { id: "accounting-set3", title: "ACCOUNTS-RATIO ANALYSIS", desc: "Deep dive into ROCE, Current Ratio, Debt-Equity and more.", link: "/course/accounting-set3/quiz" }
  ];

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <img src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_02%20PM.png" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">ACCOUNTING</h2>
            <p className="text-slate-500 mt-1">Master the fundamentals of accounting</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none w-full md:w-64"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <button onClick={() => window.history.back()} className="text-sm font-semibold text-brand-600 hover:text-brand-700">← Back</button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((c, i) => (
          <Link to={c.link} key={c.id} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
                📊
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center">
                <svg className="w-3 h-3 mr-1 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                60 Mins
              </span>
            </div>
            <h4 className="font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">{c.title}</h4>
            <p className="text-sm text-slate-500 line-clamp-2">{c.desc}</p>
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">10 Questions</span>
              <span className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group-hover:gap-2 transition-all">Start Quiz <span>&rarr;</span></span>
            </div>
          </Link>
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          No sets found matching "{searchQuery}"
        </div>
      )}
    </main>
  );
}




/* Financial Management List */
function FinancialManagementList() {
  const [searchQuery, setSearchQuery] = useState("");

  const courses = [
    { id: "fin-man-set1", title: "FINANCIAL MANAGEMENT - SET 1", desc: "Capital Budgeting, Time Value of Money, Investment Decisions", link: "/course/fin-man-set1/quiz" },
    { id: "fin-man-set2", title: "FINANCIAL MANAGEMENT - SET 2", desc: "Cost of Capital, Dividend Decisions, Operating Cycle", link: "/course/fin-man-set2/quiz" },
    { id: "fin-man-set3", title: "FINANCIAL MANAGEMENT - SET 3", desc: "Leverage, Cost of Capital, Financing Decisions", link: "/course/fin-man-set3/quiz" },
    { id: "fin-man-set4", title: "FINANCIAL MANAGEMENT - SET 4", desc: "Dividend Payout, Working Capital, Time Value of Money", link: "/course/fin-man-set4/quiz" },
    { id: "fin-man-set5", title: "FINANCIAL MANAGEMENT - SET 5", desc: "Leverage Analysis, Working Capital, Internal Rate of Return", link: "/course/fin-man-set5/quiz" },
    { id: "fin-man-set6", title: "FINANCIAL MANAGEMENT - SET 6", desc: "Walter’s Model, TVM, Capital Budgeting Techniques", link: "/course/fin-man-set6/quiz" },
    { id: "fin-man-set7", title: "FINANCIAL MANAGEMENT - SET 7", desc: "Cost of Capital, Financing Decisions, Leverage", link: "/course/fin-man-set7/quiz" },
    { id: "fin-man-set8", title: "FINANCIAL MANAGEMENT - SET 8", desc: "Working Capital, Dividend Policy, Capital Structure", link: "/course/fin-man-set8/quiz" }
  ];

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <img src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_08%20PM.png" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">FINANCIAL MANAGEMENT</h2>
            <p className="text-slate-500 mt-1">Master financial decision making and analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none w-full md:w-64"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <button onClick={() => window.history.back()} className="text-sm font-semibold text-brand-600 hover:text-brand-700">← Back</button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((c, i) => (
          <Link to={c.link} key={c.id} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                💰
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center">
                <svg className="w-3 h-3 mr-1 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                60 Mins
              </span>
            </div>
            <h4 className="font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">{c.title}</h4>
            <p className="text-sm text-slate-500 line-clamp-2">{c.desc}</p>
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">10 Questions</span>
              <span className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group-hover:gap-2 transition-all">Start Quiz <span>&rarr;</span></span>
            </div>
          </Link>
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          No sets found matching "{searchQuery}"
        </div>
      )}
    </main>
  );
}


/* Equity Research List */
function EquityResearchList() {
  const [searchQuery, setSearchQuery] = useState("");

  const courses = [
    { id: "equity-res-set1", title: "EQUITY RESEARCH - SET 1", desc: "Introduction to Equity Research, Industry Analysis, Company Analysis", link: "/course/equity-res-set1/quiz" },
    { id: "equity-res-set2", title: "EQUITY RESEARCH - SET 2", desc: "Valuation, Fundamentals of Risk and  Return, Regulatory Environment", link: "/course/equity-res-set2/quiz" },
    { id: "equity-res-set3", title: "EQUITY RESEARCH - SET 3", desc: "Macroeconomic Analysis, Company Valuation, Market Dynamics", link: "/course/equity-res-set3/quiz" },
    { id: "equity-res-set4", title: "EQUITY RESEARCH - SET 4", desc: "Corporate Actions, Market Structure, Regulatory Framework", link: "/course/equity-res-set4/quiz" },
    { id: "equity-res-set5", title: "EQUITY RESEARCH - SET 5", desc: "Fundamental Analysis, Fiscal Policies, Risk Management", link: "/course/equity-res-set5/quiz" },
    { id: "equity-res-set6", title: "EQUITY RESEARCH - SET 6", desc: "Business Analysis, Macroeconomics, Valuation Parameters", link: "/course/equity-res-set6/quiz" },
    { id: "equity-res-set7", title: "EQUITY RESEARCH - SET 7", desc: "Industry Analysis, Cost of Capital, Economic Indicators", link: "/course/equity-res-set7/quiz" },
    { id: "equity-res-set8", title: "EQUITY RESEARCH - SET 8", desc: "Valuation, Regulatory Framework, SWOT Analysis", link: "/course/equity-res-set8/quiz" },
    { id: "equity-res-set9", title: "EQUITY RESEARCH - SET 9", desc: "BCG Matrix, SEBI Regulations, Economic Factors", link: "/course/equity-res-set9/quiz" },
    { id: "equity-res-set10", title: "EQUITY RESEARCH - SET 10", desc: "Investment Risks, Checklists, Beta and Volatility", link: "/course/equity-res-set10/quiz" }
  ];

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <img src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_12%20PM.png" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">EQUITY RESEARCH (NISM SERIES XV)</h2>
            <p className="text-slate-500 mt-1">Master the concepts of equity research and analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none w-full md:w-64"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <button onClick={() => window.history.back()} className="text-sm font-semibold text-brand-600 hover:text-brand-700">← Back</button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((c, i) => (
          <Link to={c.link} key={c.id} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
                📈
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center">
                <svg className="w-3 h-3 mr-1 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                60 Mins
              </span>
            </div>
            <h4 className="font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">{c.title}</h4>
            <p className="text-sm text-slate-500 line-clamp-2">{c.desc}</p>
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">10 Questions</span>
              <span className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group-hover:gap-2 transition-all">Start Quiz <span>&rarr;</span></span>
            </div>
          </Link>
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          No sets found matching "{searchQuery}"
        </div>
      )}
    </main>
  );
}

/* Courses Directory (Folder View) */
function CoursesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const courses = [
    {
      id: "nism-series-viii",
      title: "EQUITY & DERIVATIVES (NISM SERIES VIII)",
      desc: "Comprehensive preparation package containing 30 practice sets for NISM Series VIII. Master the exam with our extensive question bank.",
      isFolder: true,
      count: "30 Sets",
      link: "/courses/nism-series-viii",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_36_24%20PM.png"
    },
    {
      id: "accounting-series",
      title: "ACCOUNTING",
      desc: "Master the fundamentals of accounting, including journals, cash flow, and ratio analysis with our curated practice sets.",
      isFolder: true,
      count: "3 Sets",
      link: "/courses/accounting",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_02%20PM.png"
    },
    {
      id: "financial-management",
      title: "FINANCIAL MANAGEMENT",
      desc: "Comprehensive guide to financial decision making, capital budgeting, and cost of capital.",
      isFolder: true,
      count: "8 Sets",
      link: "/courses/financial-management",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_08%20PM.png"
    },
    {
      id: "equity-research",
      title: "EQUITY RESEARCH (NISM SERIES XV)",
      desc: "Prepare for NISM Series XV certification with comprehensive practice sets on equity research.",
      isFolder: true,
      count: "10 Sets",
      link: "/courses/equity-research",
      logo: "https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2006_37_12%20PM.png"
    }
  ];

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">All Courses</h2>
          <p className="text-slate-500 mt-2">Explore our collection of finance quizzes</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none w-full md:w-64"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((c, i) => (
          <article key={c.id} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div>
              {c.logo ? (
                <img src={c.logo} alt="Course Logo" className="w-12 h-12 rounded-xl mb-4 object-contain shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-4 text-xl">
                  {c.emoji}
                </div>
              )}
              <h4 className="font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">{c.title}</h4>
              <p className="text-sm text-slate-500 line-clamp-2">{c.desc || "Master this topic with our comprehensive set of practice questions designed to test your knowledge."}</p>
            </div>
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{c.count}</span>
              <Link to={c.link} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group-hover:gap-2 transition-all">View Series <span>&rarr;</span></Link>
            </div>
          </article>
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          No courses found matching "{searchQuery}"
        </div>
      )}
    </main>
  );
}

/* Course page */
function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const courseInfo = {
    "nism-viii-set7": { title: "NISM Series VIII — Set 7", setNum: "Set 7" },
    "nism-viii-set6": { title: "NISM Series VIII — Set 6", setNum: "Set 6" },
    "nism-viii-set5": { title: "NISM Series VIII — Set 5", setNum: "Set 5" },
    "nism-viii-set4": { title: "NISM Series VIII — Set 4", setNum: "Set 4" },
    "nism-viii-set3": { title: "NISM Series VIII — Set 3", setNum: "Set 3" },
    "nism-viii-set2": { title: "NISM Series VIII — Set 2", setNum: "Set 2" },
    "nism-viii-set1": { title: "NISM Series VIII — Set 1", setNum: "Set 1" },
    "nism-viii-set8": { title: "NISM Series VIII — Set 8", setNum: "Set 8" },
    "nism-viii-set9": { title: "NISM Series VIII — Set 9", setNum: "Set 9" },
    "nism-viii-set10": { title: "NISM Series VIII — Set 10", setNum: "Set 10" },
    "nism-viii-set11": { title: "NISM Series VIII — Set 11", setNum: "Set 11" },
    "nism-viii-set12": { title: "NISM Series VIII — Set 12", setNum: "Set 12" },
    "nism-viii-set13": { title: "NISM Series VIII — Set 13", setNum: "Set 13" },
    "nism-viii-set14": { title: "NISM Series VIII — Set 14", setNum: "Set 14" },
    "nism-viii-set15": { title: "NISM Series VIII — Set 15", setNum: "Set 15" },
    "nism-viii-set16": { title: "NISM Series VIII — Set 16", setNum: "Set 16" },
    "nism-viii-set17": { title: "NISM Series VIII — Set 17", setNum: "Set 17" },
    "nism-viii-set18": { title: "NISM Series VIII — Set 18", setNum: "Set 18" },
    "nism-viii-set19": { title: "NISM Series VIII — Set 19", setNum: "Set 19" },
    "nism-viii-set20": { title: "NISM Series VIII — Set 20", setNum: "Set 20" },
    "nism-viii-set21": { title: "NISM Series VIII — Set 21", setNum: "Set 21" },
    "nism-viii-set22": { title: "NISM Series VIII — Set 22", setNum: "Set 22" },
    "nism-viii-set23": { title: "NISM Series VIII — Set 23", setNum: "Set 23" },
    "nism-viii-set24": { title: "NISM Series VIII — Set 24", setNum: "Set 24" },
    "nism-viii-set25": { title: "NISM Series VIII — Set 25", setNum: "Set 25" },
    "nism-viii-set26": { title: "NISM Series VIII — Set 26", setNum: "Set 26" },
    "nism-viii-set27": { title: "NISM Series VIII — Set 27", setNum: "Set 27" },
    "nism-viii-set28": { title: "NISM Series VIII — Set 28", setNum: "Set 28" },
    "nism-viii-set29": { title: "NISM Series VIII — Set 29", setNum: "Set 29" },
    "nism-viii-set30": { title: "NISM Series VIII — Set 30", setNum: "Set 30" },
    "accounting-set1": { title: "ACCOUNTS-BASIC ACCOUNTING", setNum: "Set 1" },
    "accounting-set2": { title: "ACCOUNTS-JOURNAL, DISCOUNT & CASH FLOW", setNum: "Set 2" },
    "accounting-set3": { title: "ACCOUNTS-RATIO ANALYSIS", setNum: "Set 3" },
    "fin-man-set1": { title: "FINANCIAL MANAGEMENT - SET 1", setNum: "Set 1" },
    "fin-man-set2": { title: "FINANCIAL MANAGEMENT - SET 2", setNum: "Set 2" },
    "fin-man-set3": { title: "FINANCIAL MANAGEMENT - SET 3", setNum: "Set 3" },
    "fin-man-set4": { title: "FINANCIAL MANAGEMENT - SET 4", setNum: "Set 4" },
    "fin-man-set5": { title: "FINANCIAL MANAGEMENT - SET 5", setNum: "Set 5" },
    "fin-man-set6": { title: "FINANCIAL MANAGEMENT - SET 6", setNum: "Set 6" },
    "fin-man-set7": { title: "FINANCIAL MANAGEMENT - SET 7", setNum: "Set 7" },
    "fin-man-set8": { title: "FINANCIAL MANAGEMENT - SET 8", setNum: "Set 8" },
    "equity-res-set1": { title: "EQUITY RESEARCH - SET 1", setNum: "Set 1" },
    "equity-res-set2": { title: "EQUITY RESEARCH - SET 2", setNum: "Set 2" },
    "equity-res-set3": { title: "EQUITY RESEARCH - SET 3", setNum: "Set 3" },
    "equity-res-set4": { title: "EQUITY RESEARCH - SET 4", setNum: "Set 4" },
    "equity-res-set5": { title: "EQUITY RESEARCH - SET 5", setNum: "Set 5" },
    "equity-res-set6": { title: "EQUITY RESEARCH - SET 6", setNum: "Set 6" },
    "equity-res-set7": { title: "EQUITY RESEARCH - SET 7", setNum: "Set 7" },
    "equity-res-set8": { title: "EQUITY RESEARCH - SET 8", setNum: "Set 8" },
    "equity-res-set9": { title: "EQUITY RESEARCH - SET 9", setNum: "Set 9" },
    "equity-res-set10": { title: "EQUITY RESEARCH - SET 10", setNum: "Set 10" }
  };

  const info = courseInfo[courseId];
  if (!info) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold">Course not found</h2>
        <button onClick={() => navigate("/courses")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Back</button>
      </main>
    );
  }
  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <button onClick={() => navigate("/courses")} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors font-medium">
        <span>←</span> Back to Courses
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-primary-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
        </div>

        <div className="px-8 pb-8 relative">
          <div className="-mt-12 w-24 h-24 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center text-4xl p-2 mb-4">
            🎓
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{info.title}</h2>
              <p className="text-slate-500 mt-2 text-lg">Master your finance skills with this practice set.</p>

              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span>❓</span> 10 Questions
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span>⏱️</span> ~60 Minutes
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Link to={`/course/${courseId}/quiz`} className="btn-primary px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2">
                Start {info.setNum}
                <span>▶</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* Quiz page: one question per page */
function QuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Guaranteed consistent user

  const quizData = {
    "nism-viii-set7": { questions: set7, title: "NISM — Set 7" },
    "nism-viii-set6": { questions: set6, title: "NISM — Set 6" },
    "nism-viii-set5": { questions: set5, title: "NISM — Set 5" },
    "nism-viii-set4": { questions: set4, title: "NISM — Set 4" },
    "nism-viii-set3": { questions: set3, title: "NISM — Set 3" },
    "nism-viii-set2": { questions: set2, title: "NISM — Set 2" },
    "nism-viii-set1": { questions: set1, title: "NISM — Set 1" },
    "nism-viii-set8": { questions: set8, title: "NISM — Set 8" },
    "nism-viii-set9": { questions: set9, title: "NISM — Set 9" },
    "nism-viii-set10": { questions: set10, title: "NISM — Set 10" },
    "nism-viii-set11": { questions: set11, title: "NISM — Set 11" },
    "nism-viii-set12": { questions: set12, title: "NISM — Set 12" },
    "nism-viii-set13": { questions: set13, title: "NISM — Set 13" },
    "nism-viii-set14": { questions: set14, title: "NISM — Set 14" },
    "nism-viii-set15": { questions: set15, title: "NISM — Set 15" },
    "nism-viii-set16": { questions: set16, title: "NISM — Set 16" },
    "nism-viii-set17": { questions: set17, title: "NISM — Set 17" },
    "nism-viii-set18": { questions: set18, title: "NISM — Set 18" },
    "nism-viii-set19": { questions: set19, title: "NISM — Set 19" },
    "nism-viii-set20": { questions: set20, title: "NISM — Set 20" },
    "nism-viii-set21": { questions: set21, title: "NISM — Set 21" },
    "nism-viii-set22": { questions: set22, title: "NISM — Set 22" },
    "nism-viii-set23": { questions: set23, title: "NISM — Set 23" },
    "nism-viii-set24": { questions: set24, title: "NISM — Set 24" },
    "nism-viii-set25": { questions: set25, title: "NISM — Set 25" },
    "nism-viii-set26": { questions: set26, title: "NISM — Set 26" },
    "nism-viii-set27": { questions: set27, title: "NISM — Set 27" },
    "nism-viii-set28": { questions: set28, title: "NISM — Set 28" },
    "nism-viii-set29": { questions: set29, title: "NISM — Set 29" },

    "nism-viii-set30": { questions: set30, title: "NISM — Set 30" },
    "accounting-set1": { questions: accSet1, title: "ACCOUNTS-BASIC ACCOUNTING" },
    "accounting-set2": { questions: accSet2, title: "ACCOUNTS-JOURNAL, DISCOUNT & CASH FLOW" },
    "accounting-set3": { questions: accSet3, title: "ACCOUNTS-RATIO ANALYSIS" },
    "fin-man-set1": { questions: finSet1, title: "FINANCIAL MANAGEMENT - SET 1" },
    "fin-man-set2": { questions: finSet2, title: "FINANCIAL MANAGEMENT - SET 2" },
    "fin-man-set3": { questions: finSet3, title: "FINANCIAL MANAGEMENT - SET 3" },
    "fin-man-set4": { questions: finSet4, title: "FINANCIAL MANAGEMENT - SET 4" },
    "fin-man-set5": { questions: finSet5, title: "FINANCIAL MANAGEMENT - SET 5" },
    "fin-man-set6": { questions: finSet6, title: "FINANCIAL MANAGEMENT - SET 6" },
    "fin-man-set7": { questions: finSet7, title: "FINANCIAL MANAGEMENT - SET 7" },
    "fin-man-set8": { questions: finSet8, title: "FINANCIAL MANAGEMENT - SET 8" },
    "equity-res-set1": { questions: equityResSet1, title: "EQUITY RESEARCH - SET 1" },
    "equity-res-set2": { questions: equityResSet2, title: "EQUITY RESEARCH - SET 2" },
    "equity-res-set3": { questions: equityResSet3, title: "EQUITY RESEARCH - SET 3" },
    "equity-res-set4": { questions: equityResSet4, title: "EQUITY RESEARCH - SET 4" },
    "equity-res-set5": { questions: equityResSet5, title: "EQUITY RESEARCH - SET 5" },
    "equity-res-set6": { questions: equityResSet6, title: "EQUITY RESEARCH - SET 6" },
    "equity-res-set7": { questions: equityResSet7, title: "EQUITY RESEARCH - SET 7" },
    "equity-res-set8": { questions: equityResSet8, title: "EQUITY RESEARCH - SET 8" },
    "equity-res-set9": { questions: equityResSet9, title: "EQUITY RESEARCH - SET 9" },
    "equity-res-set10": { questions: equityResSet10, title: "EQUITY RESEARCH - SET 10" }
  };

  const quiz = quizData[courseId];
  if (!quiz) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold">No quiz found</h2>
        <button onClick={() => navigate("/courses")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Back</button>
      </main>
    );
  }

  const questions = quiz.questions.slice(0, 10);
  const [index, setIndex] = useState(0);
  const { state, updateQuestion, resetAll } = useQuizState(courseId, questions);

  // Ensure index stays in range
  useEffect(() => {
    if (index < 0) setIndex(0);
    if (index >= questions.length) setIndex(questions.length - 1);
  }, [index, questions.length]);

  // Timer effect: persist remaining time per question in quiz state so
  // when the user navigates back to a question, the remaining time resumes.
  useEffect(() => {
    const q = questions[index];
    if (!q) return;
    const qid = q.id;

    // initialize remainingTime if missing
    if (state[qid] == null || state[qid].remainingTime == null) {
      updateQuestion(qid, { remainingTime: 300 });
    }

    const timer = setInterval(() => {
      const curr = (state[qid] && typeof state[qid].remainingTime === 'number') ? state[qid].remainingTime : 300;
      if (curr <= 0) {
        clearInterval(timer);
        // auto-move to next question when time's up
        if (index < questions.length - 1) setIndex((prev) => prev + 1);
        return;
      }
      updateQuestion(qid, { remainingTime: curr - 1 });
    }, 1000);

    return () => clearInterval(timer);
    // include `state` so we read the latest remainingTime; this causes the
    // effect to re-run when remainingTime changes which keeps the timer in sync.
  }, [index, state, questions, updateQuestion]);

  // Overall quiz timer (total time left for the quiz). Stored in state.__meta__.overallRemaining
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    const metaKey = '__meta__';
    const totalInit = 3600;
    if (!state[metaKey] || typeof state[metaKey].overallRemaining !== 'number') {
      updateQuestion(metaKey, { overallRemaining: totalInit });
    }

    const timer = setInterval(() => {
      const curr = (state[metaKey] && typeof state[metaKey].overallRemaining === 'number') ? state[metaKey].overallRemaining : totalInit;
      if (curr <= 0) {
        clearInterval(timer);
        // Auto-submit when overall time runs out
        navigate(`/course/${courseId}/results`, {
          state: { questions, quizState: state, courseId }
        });
        return;
      }
      updateQuestion(metaKey, { overallRemaining: curr - 1 });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, updateQuestion, questions, courseId, navigate]);

  const q = questions[index];
  const qState = state[q.id] || { selected: null, checked: false, correct: false, remainingTime: 300 };

  function selectOption(i) {
    if (qState.checked) return; // locked after check
    updateQuestion(q.id, { selected: i });
  }

  function checkAnswer() {
    if (qState.selected === null) {
      alert("Please select an option before checking the answer.");
      return;
    }
    const isCorrect = qState.selected === q.answer;
    updateQuestion(q.id, { checked: true, correct: isCorrect });
  }

  function nextQ() {
    if (index + 1 < questions.length) setIndex(index + 1);
  }

  function prevQ() {
    if (index > 0) setIndex(index - 1);
  }

  async function submitQuiz() {
    const unansweredCount = questions.filter(q => !state[q.id] || state[q.id].selected === null).length;
    let confirmMsg = "Submit quiz and view score?";
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit the quiz early?`;
    }
    if (!window.confirm(confirmMsg)) return;

    // Calculate score
    const score = questions.reduce((acc, q) => {
      const qState = state[q.id];
      if (qState && qState.selected === q.answer) {
        return acc + 1;
      }
      return acc;
    }, 0);

    // Calculate time taken
    const totalTime = 3600; // 60 minutes overall
    const remaining = state.__meta__?.overallRemaining ?? 0;
    const takenSeconds = Math.max(0, totalTime - remaining);

    const minutes = Math.floor(takenSeconds / 60);
    const seconds = takenSeconds % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // --- HYBRID SAVE LOGIC (INTERNAL TO QUIZ PAGE) ---
    const record = {
      courseId,
      quizTitle: quiz.title || courseId, // use valid title
      score,
      totalQuestions: questions.length,
      correct: score,
      percentage: Math.round((score / questions.length) * 100),
      timeTaken: formattedTime,
      timestamp: new Date().toISOString()
    };

    if (currentUser) {
      // 1. Local Backup
      try {
        await mockDb.saveResult({
          userId: currentUser.uid,
          ...record
        });
        console.log("Internal Check: Local Saved");
      } catch (e) { console.warn("Local save failed", e); }

      // 2. Cloud Save
      try {
        // Need to add student info for Admin dashboard
        const enrichedRecord = {
          ...record,
          studentName: currentUser.displayName || currentUser.fullName || currentUser.email,
          studentPhoto: currentUser.photoURL || currentUser.photo,
          rollNumber: currentUser.rollNumber || "N/A"
        };
        await saveQuizResultRemote(currentUser.uid, enrichedRecord);
        console.log("Internal Check: Cloud Saved");
      } catch (e) { console.error("Cloud save failed", e); }
    } else {
      console.warn("No user logged in, cannot save.");
    }

    navigate(`/course/${courseId}/results`, {
      state: {
        questions,
        quizState: state,
        courseId
      }
    });
  }

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 glass p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{quiz.title}</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <span className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
              <span className="block h-full bg-brand-500 transition-all duration-300" style={{ width: `${((index + 1) / questions.length) * 100}%` }}></span>
            </span>
            Question {index + 1} of {questions.length}
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {
            (() => {
              const displayTime = (qState && typeof qState.remainingTime === 'number') ? qState.remainingTime : 300;
              const isLow = displayTime <= 10;
              return (
                <div className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold shadow-sm transition-all duration-500 ${isLow ? "bg-red-50 text-red-600 animate-pulse" : "bg-brand-50 text-brand-600"}`}>
                  <span className={isLow ? "animate-bounce" : ""}>⏱</span> {displayTime}s
                </div>
              );
            })()
          }
          {
            (() => {
              const meta = state && state.__meta__;
              const overall = (meta && typeof meta.overallRemaining === 'number') ? meta.overallRemaining : 3600;
              const minutes = Math.floor(overall / 60);
              const secs = overall % 60;
              const pad = secs < 10 ? `0${secs}` : secs;
              const isLow = overall <= 30;
              return (
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium border ${isLow ? "border-red-200 text-red-600 bg-red-50" : "border-slate-200 text-slate-600 bg-white"}`}>
                  <span>⌛</span> {minutes}:{pad}
                </div>
              );
            })()
          }
          <button
            onClick={() => { if (window.confirm("Reset all progress for this quiz?")) { resetAll(); setIndex(0); } }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Reset Quiz"
          >
            ↺
          </button>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
        <h3 className="font-bold text-xl sm:text-2xl text-slate-900 leading-snug">{q.q}</h3>

        <div className="mt-8 grid gap-4">
          {q.options.map((opt, i) => {
            const isSelected = qState.selected === i;
            const locked = qState.checked;
            const isCorrect = i === q.answer;

            let stateClass = "border-slate-200 hover:bg-slate-50 hover:border-slate-300";
            if (isSelected) stateClass = "border-brand-500 ring-1 ring-brand-500 bg-brand-50 text-brand-700";
            if (locked) {
              stateClass = "opacity-70 cursor-not-allowed";
              if (isCorrect) stateClass = "border-green-500 bg-green-50 text-green-700 font-medium";
              else if (isSelected) stateClass = "border-red-300 bg-red-50 text-red-700";
              else stateClass = "border-slate-100 bg-slate-50 text-slate-400";
            }

            return (
              <button
                key={i}
                onClick={() => selectOption(i)}
                disabled={locked}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 flex justify-between items-center group ${stateClass}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${isSelected || (locked && isCorrect) ? 'border-transparent bg-white/50' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-base">{opt}</span>
                </div>
                {qState.checked && (isCorrect ? <span className="text-green-600 text-lg font-bold">✓</span> : (isSelected ? <span className="text-red-500 text-lg font-bold">✕</span> : null))}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex gap-3 items-center justify-between pt-6 border-t border-slate-50">
          <button onClick={prevQ} disabled={index === 0} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Prev</button>

          <div className="flex flex-wrap gap-3 justify-end">
            <button onClick={checkAnswer} disabled={qState.checked || qState.selected === null} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/30 hover:bg-brand-700 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all">Check Answer</button>

            {index < questions.length - 1 && (
              <button onClick={submitQuiz} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all">Submit Early</button>
            )}

            {index === questions.length - 1 ? (
              <button onClick={submitQuiz} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all">Submit Quiz</button>
            ) : (
              <button onClick={nextQ} className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-900 font-semibold hover:border-brand-500 hover:text-brand-600 transition-all">Next</button>
            )}
          </div>
        </div>

        {qState.checked && (
          <div className={`mt-6 p-6 rounded-xl animate-fade-in border-l-4 ${qState.correct ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
            <div className={`font-bold flex items-center gap-2 ${qState.correct ? "text-green-700" : "text-red-700"}`}>
              <span>{qState.correct ? "🎉 Correct!" : "🤔 Incorrect"}</span>
            </div>
            <div className="text-slate-700 mt-2 leading-relaxed">{q.explanation}</div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-slate-400 font-medium">Progress: {Object.keys(state).filter((k) => k !== '__meta__' && state[k]?.selected !== null).length} / {questions.length} completed</div>
    </main>
  );
}

/* Results Dashboard */
function ResultsDashboard() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, quizState } = location.state || {};

  const courseInfo = {
    "nism-viii-set7": "NISM Series VIII — Set 7",
    "nism-viii-set6": "NISM Series VIII — Set 6",
    "nism-viii-set5": "NISM Series VIII — Set 5",
    "nism-viii-set4": "NISM Series VIII — Set 4",
    "nism-viii-set3": "NISM Series VIII — Set 3",
    "nism-viii-set2": "NISM Series VIII — Set 2",
    "nism-viii-set1": "NISM Series VIII — Set 1",
    "nism-viii-set8": "NISM Series VIII — Set 8",
    "nism-viii-set9": "NISM Series VIII — Set 9",
    "nism-viii-set10": "NISM Series VIII — Set 10",
    "nism-viii-set11": "NISM Series VIII — Set 11",
    "nism-viii-set12": "NISM Series VIII — Set 12",
    "nism-viii-set13": "NISM Series VIII — Set 13",
    "nism-viii-set14": "NISM Series VIII — Set 14",
    "nism-viii-set15": "NISM Series VIII — Set 15",
    "nism-viii-set16": "NISM Series VIII — Set 16",
    "nism-viii-set17": "NISM Series VIII — Set 17",
    "nism-viii-set18": "NISM Series VIII — Set 18",
    "nism-viii-set19": "NISM Series VIII — Set 19",
    "nism-viii-set20": "NISM Series VIII — Set 20",
    "nism-viii-set21": "NISM Series VIII — Set 21",
    "nism-viii-set22": "NISM Series VIII — Set 22",
    "nism-viii-set23": "NISM Series VIII — Set 23",
    "nism-viii-set24": "NISM Series VIII — Set 24",
    "nism-viii-set25": "NISM Series VIII — Set 25",
    "nism-viii-set26": "NISM Series VIII — Set 26",
    "nism-viii-set27": "NISM Series VIII — Set 27",
    "nism-viii-set28": "NISM Series VIII — Set 28",
    "nism-viii-set29": "NISM Series VIII — Set 29",
    "nism-viii-set30": "NISM Series VIII — Set 30",
    "accounting-set1": "ACCOUNTS-BASIC ACCOUNTING",
    "accounting-set2": "ACCOUNTS-JOURNAL, DISCOUNT & CASH FLOW",
    "accounting-set3": "ACCOUNTS-RATIO ANALYSIS",
    "fin-man-set1": "FINANCIAL MANAGEMENT - SET 1",
    "fin-man-set2": "FINANCIAL MANAGEMENT - SET 2",
    "fin-man-set3": "FINANCIAL MANAGEMENT - SET 3",
    "fin-man-set4": "FINANCIAL MANAGEMENT - SET 4",
    "fin-man-set5": "FINANCIAL MANAGEMENT - SET 5",
    "fin-man-set6": "FINANCIAL MANAGEMENT - SET 6",
    "fin-man-set7": "FINANCIAL MANAGEMENT - SET 7",
    "fin-man-set8": "FINANCIAL MANAGEMENT - SET 8",
    "equity-res-set1": "EQUITY RESEARCH - SET 1",
    "equity-res-set2": "EQUITY RESEARCH - SET 2",
    "equity-res-set3": "EQUITY RESEARCH - SET 3",
    "equity-res-set4": "EQUITY RESEARCH - SET 4",
    "equity-res-set5": "EQUITY RESEARCH - SET 5",
    "equity-res-set6": "EQUITY RESEARCH - SET 6",
    "equity-res-set7": "EQUITY RESEARCH - SET 7",
    "equity-res-set8": "EQUITY RESEARCH - SET 8",
    "equity-res-set9": "EQUITY RESEARCH - SET 9",
    "equity-res-set10": "EQUITY RESEARCH - SET 10"
  };
  const courseTitle = courseInfo[courseId] || "Quiz";

  if (!questions || !quizState) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">No Results Available</h2>
          <p className="text-gray-600 mb-4">Please complete a quiz first.</p>
          <button onClick={() => navigate(`/course/${courseId}/quiz`)} className="px-4 py-2 bg-indigo-600 text-white rounded">
            Go to Quiz
          </button>
        </div>
      </main>
    );
  }

  // Calculate results
  let correctCount = 0;
  const results = questions.map((q) => {
    const qState = quizState[q.id] || { selected: null, checked: false, correct: false };
    const isCorrect = qState.selected === q.answer;
    if (isCorrect) correctCount++;
    return {
      ...q,
      selected: qState.selected,
      isCorrect,
      correctAnswer: q.answer,
      selectedText: qState.selected !== null ? q.options[qState.selected] : "Not answered",
      correctText: q.options[q.answer]
    };
  });

  const total = questions.length;
  const percentage = ((correctCount / total) * 100).toFixed(1);
  const incorrectCount = total - correctCount;

  // Save result to Firebase (Mock)
  const { currentUser } = useAuth();
  const saveAttempted = React.useRef(false);

  useEffect(() => {
    async function saveResult() {
      if (currentUser && location.state?.saved !== true && !saveAttempted.current) {
        saveAttempted.current = true;
        try {
          await mockDb.saveResult({
            userId: currentUser.uid,
            courseId,
            courseTitle,
            correct: correctCount,
            total,
            percentage: parseFloat(percentage),
            timestamp: new Date().toISOString()
          });
          // Avoid double saving in StrictMode or re-renders
          navigate(".", { state: { ...location.state, saved: true }, replace: true });
        } catch (e) {
          console.error("Error saving result:", e);
          saveAttempted.current = false; // Reset on error to allow retry if needed
        }
      }
    }
    saveResult();
  }, [currentUser, location.state, correctCount, total, percentage, courseId, courseTitle, navigate]);


  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8 text-center sm:text-left">
        <button onClick={() => navigate(`/course/${courseId}/quiz`)} className="text-brand-600 hover:text-brand-700 hover:underline mb-4 font-medium transition-colors">
          ← Back to Quiz
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900">Quiz Results</h1>
        <p className="text-slate-500 mt-2">{courseTitle}</p>
        {!currentUser && (
          <div className="mt-4 text-sm text-amber-700 bg-amber-50 inline-block px-4 py-2 rounded-lg border border-amber-100">
            ⚠ Log in to save your progress! <Link to="/login" className="underline font-bold hover:text-amber-900">Login here</Link>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-fade-in-up">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 group hover:shadow-md transition-all">
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Questions</div>
          <div className="text-4xl font-extrabold text-slate-700">{total}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-emerald-100 flex flex-col items-center justify-center gap-2 group hover:shadow-md hover:border-emerald-200 transition-all bg-emerald-50/50">
          <div className="text-sm text-emerald-600 font-medium uppercase tracking-wider">Correct</div>
          <div className="text-4xl font-extrabold text-emerald-600">{correctCount}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-red-100 flex flex-col items-center justify-center gap-2 group hover:shadow-md hover:border-red-200 transition-all bg-red-50/50">
          <div className="text-sm text-red-600 font-medium uppercase tracking-wider">Incorrect</div>
          <div className="text-4xl font-extrabold text-red-600">{incorrectCount}</div>
        </div>
        <div className="bg-gradient-to-br from-brand-500 to-primary-600 p-6 rounded-2xl shadow-lg shadow-brand-500/30 text-white flex flex-col items-center justify-center gap-2">
          <div className="text-sm text-white/80 font-medium uppercase tracking-wider">Score</div>
          <div className="text-4xl font-extrabold">{percentage}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-10">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-slate-800 text-lg">Overall Performance</span>
          <span className="text-slate-500 font-medium">{correctCount} / {total} Correct</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 via-brand-500 to-primary-600 h-full rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Detailed Review</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Q#</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Question</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Your Answer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Correct Answer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Explanation</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {results.map((result, idx) => (
                <tr key={result.id} className={`hover:bg-slate-50 transition-colors ${result.isCorrect ? "bg-green-50/30" : "bg-red-50/30"}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 max-w-md font-medium">
                    {result.q}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {result.selected !== null ? (
                      <span className={`font-semibold inline-flex items-center gap-1 ${result.isCorrect ? "text-emerald-700" : "text-red-600"}`}>
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-xs text-white ${result.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>{String.fromCharCode(65 + result.selected)}</span>
                        {result.selectedText}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not answered</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-semibold inline-flex items-center gap-1 text-emerald-700">
                      <span className="w-5 h-5 rounded flex items-center justify-center text-xs text-white bg-emerald-500">{String.fromCharCode(65 + result.correctAnswer)}</span>
                      {result.correctText}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                    <span className="text-sm">{result.explanation || "No explanation available"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {result.isCorrect ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Correct
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                        ✕ Incorrect
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => navigate(`/course/${courseId}/quiz`)}
          className="btn-primary px-8 py-4 rounded-xl font-bold shadow-lg shadow-brand-500/30 text-lg flex items-center gap-2"
        >
          <span>↺</span> Retake Quiz
        </button>
        <button
          onClick={() => navigate("/courses")}
          className="btn-secondary px-8 py-4 rounded-xl font-bold text-lg"
        >
          Back to Courses
        </button>
      </div>
    </main>
  );
}

/* Static pages omitted for brevity (About/Contact/NotFound) */
function About() {
  return (
    <main className="max-w-4xl mx-auto px-4 pt-32 pb-16">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">About Me</h2>
        <div className="flex gap-12 items-start flex-col md:flex-row">
          <div className="flex-shrink-0 mx-auto md:mx-0 relative group">
            {/* Animated Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

            {/* Main Image Container */}
            <div className="relative w-56 h-56 rounded-3xl p-1.5 bg-white ring-1 ring-slate-100 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="w-full h-full rounded-2xl overflow-hidden relative">
                <img
                  src="https://media.licdn.com/dms/image/v2/D5603AQH7ol5Imr-oNw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1718251544325?e=1770854400&v=beta&t=dQHm_8cGen2z8FgiWEvspsN_ToYV4Jun6RAq2nA2kgE"
                  alt="Ritika Arora"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Shine effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>

            {/* Decorative decorative elements */}
            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-100 text-2xl animate-bounce delay-100">
              👩‍🏫
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-bold mb-4 text-slate-900">Ritika Arora</h3>
            <p className="text-gray-700 mb-4">Welcome to FIN-IQ WITH RITIKA! I'm Ritika Arora, the founder and creator of this platform. My mission is to help finance professionals and students master key financial concepts through interactive, comprehensive quizzes.</p>
            <p className="text-gray-700 mb-2 font-medium">Our platform offers specialized preparation for:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1 pl-2">
              <li>NISM Series VIII (Equity Derivatives)</li>
              <li>NISM Series XV (Equity Research)</li>
              <li>Core Accounting Principles</li>
              <li>Financial Management & Analysis</li>
            </ul>
            <p className="text-gray-700 mb-4">With a passion for financial education and a deep understanding of the industry, I've curated these practice questions to ensure you're well-prepared for your exams and interviews.</p>
            <p className="text-gray-700 mb-6">Whether you're a beginner or an experienced professional, this platform is designed to help you succeed.</p>
            <div className="mt-6 text-center md:text-left">
              <a href="https://www.linkedin.com/in/ritika-arora-b27b8a200?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BmGN4keVZQuKa1XKnQL2uXQ%3D%3D" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">💼 Connect on LinkedIn</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
function Contact() { return (<main className="max-w-4xl mx-auto px-4 pt-32 pb-16"><div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100"><h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">Contact</h2><div className="space-y-6"><div><h3 className="text-lg font-semibold mb-2">Get in Touch</h3><p className="text-gray-600 mb-4">Feel free to reach out to me for any questions or feedback about Finance Quiz.</p></div><div className="space-y-4"><div><h4 className="font-semibold text-gray-900 mb-2">📧 Email</h4><a href="mailto:finiqwithritika@gmail.com" className="text-blue-600 hover:underline text-lg">finiqwithritika@gmail.com</a></div><div><h4 className="font-semibold text-gray-900 mb-2">💼 LinkedIn</h4><a href="https://www.linkedin.com/in/ritika-arora-b27b8a200?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BmGN4keVZQuKa1XKnQL2uXQ%3D%3D" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-lg">Connect on LinkedIn</a></div></div></div></div></main>); }
function Feedback() {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Save to Firestore 'feedback' collection
      await addDoc(collection(db, "feedback"), {
        ...formData,
        submittedAt: new Date().toISOString()
      });
      setStatus("success");
      setFormData({ firstName: "", lastName: "", email: "", phone: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      console.error("Error sending feedback:", err);
      setStatus("error");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pt-32 pb-16">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100 text-center animate-fade-in-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -z-10 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-50"></div>

        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          Share Your <span className="text-indigo-600">Feedback</span>
        </h2>
        <p className="text-slate-500 mb-12 max-w-lg mx-auto text-lg leading-relaxed">
          We value your input!
          <br />
          Help us improve your learning experience. Let us know what you think!
        </p>

        {status === "success" && (
          <div className="mb-8 p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-100 animate-fade-in flex items-center justify-center gap-2">
            <span>✓</span> Message sent successfully! We'll get back to you soon.
          </div>
        )}

        {status === "error" && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl font-bold border border-red-100 animate-fade-in">
            Something went wrong. Please check your connection and try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="spec-y-6 text-left max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your First Name"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium group-hover:bg-white text-slate-800"
                required
              />
            </div>
            <div className="group">
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your Last Name"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium group-hover:bg-white text-slate-800 text-base"
                required
              />
            </div>
          </div>

          <div className="group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium group-hover:bg-white text-slate-800 text-base"
              required
            />
          </div>

          <div className="group">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium group-hover:bg-white text-slate-800 text-base"
            />
          </div>

          <div className="group">
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              placeholder="Enter your message"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium group-hover:bg-white resize-none text-slate-800 text-base"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className={`w-full py-5 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/30 transition-all transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/40 ${status === 'submitting' ? 'bg-indigo-300 cursor-wait' : 'bg-[#8b5cf6] hover:bg-[#7c3aed] active:scale-[0.98]'}`}
          >
            {status === "submitting" ? "Sending Message..." : "Send Message"}
          </button>
        </form>
      </div>
    </main>
  );
}

function NotFound() { return (<main className="max-w-4xl mx-auto px-4 py-8"><h2 className="text-2xl font-bold">Page not found</h2></main>); }

/* App */
export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('user_session');
    if (stored) {
      setSession(JSON.parse(stored));
    }
  }, []);

  // Helper to save quiz results
  // Helper to save quiz results
  const saveQuizResult = async (courseId, score, totalQuestions, timeTaken) => {
    // 1. Get Current User directly from Firebase Auth Service (since we are outside context)
    // We can also try to grab from localStorage as fallback for "Name" display, but ID comes from Auth.
    // However, db service handles ID check too.

    // We need the ID to save to the right place.
    // relying on the top-level `auth` import from ./firebase

    let uid = null;
    let userInfo = {};

    if (auth.currentUser) {
      uid = auth.currentUser.uid;
      userInfo = {
        fullName: auth.currentUser.displayName,
        photo: auth.currentUser.photoURL,
        email: auth.currentUser.email
      };
    } else {
      // Fallback to local storage artifact if auth not ready but user "was" logged in?
      try {
        const stored = JSON.parse(localStorage.getItem('auth_currentUser'));
        if (stored && stored.uid) {
          uid = stored.uid;
          userInfo = stored;
        }
      } catch (e) { }
    }

    if (!uid) {
      console.warn("Cannot save result: No user logged in.");
      return;
    }

    const record = {
      courseId,
      quizTitle: courseId.replace(/-/g, ' ').toUpperCase(),
      score,
      totalQuestions,
      correct: score,
      percentage: Math.round((score / totalQuestions) * 100),
      timeTaken: timeTaken || "N/A",
      studentName: userInfo.fullName || userInfo.displayName || userInfo.email,
      studentPhoto: userInfo.photo || userInfo.photoURL,
      rollNumber: userInfo.rollNumber || "N/A"
    };

    // 4. Save to Local Backup (Safety Net)
    // We do this BEFORE cloud to ensure we never lose data on the client side.
    try {
      if (uid) {
        await mockDb.saveResult({
          userId: uid,
          courseId: courseId,
          courseTitle: record.quizTitle,
          score: score,
          total: totalQuestions,
          correct: score,
          percentage: record.percentage,
          timestamp: new Date().toISOString()
        });
        console.log("Saved to local backup");
      }
    } catch (e) { console.warn("Local save failed", e); }

    // 5. Save to Firestore (Cloud Sync)
    try {
      await saveQuizResultRemote(uid, record);
      console.log("Result saved to Firestore");
    } catch (e) {
      console.error("Failed to save result to Firestore", e);
      // Since we saved locally, we don't need to panic the user, 
      // but we might want to retry later (not implemented yet).
    }
  };



  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-800">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth" element={<AuthSystem />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/courses" element={<CoursesList />} />
            <Route path="/courses/nism-series-viii" element={<SeriesVIIIList />} />
            <Route path="/courses/accounting" element={<AccountingList />} />
            <Route path="/courses/financial-management" element={<FinancialManagementList />} />
            <Route path="/courses/equity-research" element={<EquityResearchList />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/course/:courseId/quiz" element={<QuizPage saveQuizResult={saveQuizResult} />} />
            <Route path="/course/:courseId/results" element={<ResultsDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalFooter />
        </div>
      </Router>
    </AuthProvider>
  );
}
