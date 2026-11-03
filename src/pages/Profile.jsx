import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { getStudentHistory } from "../services/db"; // Import DB helper
import { mockDb } from "../mockService";

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchHistory() {
            if (!currentUser) return setLoading(false);

            let combined = [];

            // 1. Fetch Cloud Data
            try {
                const cloudData = await getStudentHistory(currentUser.uid);
                if (Array.isArray(cloudData)) combined = [...cloudData];
            } catch (e) {
                console.warn("Firestore fetch failed", e);
            }

            // 2. Fetch Local Backup Data
            try {
                const localData = await mockDb.getUserHistory(currentUser.uid);
                if (Array.isArray(localData)) {
                    // Simple merge: Avoid duplicates if IDs match, otherwise just append
                    // We use a Map to dedup by ID
                    const map = new Map();
                    combined.forEach(item => map.set(item.id || item.timestamp, item));
                    // Local data usually has 'id' starting with "res_"
                    localData.forEach(item => {
                        if (!map.has(item.id)) {
                            map.set(item.id, item);
                        }
                    });
                    combined = Array.from(map.values());
                }
            } catch (me) { }

            // 3. Normalize & Sort
            // Fix field mismatches (quizTitle vs courseTitle, totalQuestions vs total)
            const normalized = combined.map(item => {
                let ts = item.timestamp || item.date;
                // Handle Firestore Timestamp object { seconds, nanoseconds }
                if (ts && typeof ts.seconds === 'number') {
                    ts = new Date(ts.seconds * 1000);
                } else {
                    ts = ts ? new Date(ts) : new Date();
                }

                // Final safety check
                if (isNaN(ts.getTime())) {
                    ts = new Date();
                }

                return {
                    ...item,
                    timestamp: ts.toISOString(), // Standardize to ISO string
                    courseTitle: item.courseTitle || item.quizTitle || item.courseId || "Unknown Course",
                    total: item.total || item.totalQuestions || 0,
                    correct: item.score ?? item.correct ?? 0, // ensure 'correct' is populated as column uses it
                    percentage: item.percentage || Math.round(((item.score ?? item.correct ?? 0) / (item.total || item.totalQuestions || 10)) * 100)
                };
            }).filter(item => {
                // Filter out complete garbage if any
                return item.courseId;
            });

            normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistory(normalized);
            setLoading(false);
        }
        fetchHistory();
    }, [currentUser]);

    async function handleLogout() {
        try {
            await logout();
            navigate("/login");
        } catch {
            console.error("Failed to log out");
        }
    }

    const stats = {
        total: history.length,
        avg: history.length ? Math.round(history.reduce((a, b) => a + (b.percentage || 0), 0) / history.length) : 0,
        best: history.length ? Math.max(...history.map(h => h.percentage || 0)) : 0
    };

    if (!currentUser) return (
        <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-2xl font-bold mb-4">Not signed in</h2>
                <p className="text-gray-600 mb-4">Please <Link to="/login" className="text-indigo-600 hover:underline">log in</Link> to view your profile and quiz history.</p>
            </div>
        </main>
    );

    return (
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
            {/* Banner Section with Mesh Gradient */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-10 animate-fade-in-up">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#db2777]"></div>
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 px-8 pt-10 pb-20 md:px-12 md:pt-14 md:pb-24 flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Glass Profile Card */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000"></div>
                        <div className="relative w-32 h-32 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 p-1.5 shadow-xl">
                            {currentUser.photoURL || currentUser.photo ? (
                                <img
                                    src={currentUser.photoURL || currentUser.photo}
                                    alt="Profile"
                                    className="w-full h-full object-cover rounded-xl bg-white/50"
                                />
                            ) : (
                                <div className="w-full h-full bg-white/20 rounded-xl flex items-center justify-center text-white/80">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
                                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center md:text-left text-white flex-1">
                        <h1 className="text-4xl md:text-5xl font-['Outfit'] font-bold tracking-tight mb-2 drop-shadow-md text-white">
                            {currentUser.displayName || currentUser.fullName || "Welcome Back"}
                        </h1>
                        <p className="text-indigo-100 font-medium text-lg flex items-center justify-center md:justify-start gap-2 mb-6">
                            <span className="opacity-70">📧</span> {currentUser.email}
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <button onClick={() => navigate('/profile/edit')} className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center gap-2">
                                <span>✏️</span> Edit Profile
                            </button>
                            <button onClick={handleLogout} className="px-5 py-2.5 bg-red-500/20 backdrop-blur-md border border-red-400/30 text-white rounded-xl font-semibold hover:bg-red-500/30 transition-all flex items-center gap-2">
                                <span>🚪</span> Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 -mt-24 relative z-20 px-4 md:px-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex items-center gap-5 hover:transform hover:-translate-y-1 transition-all duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-sm">
                        📊
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Total Tests</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex items-center gap-5 hover:transform hover:-translate-y-1 transition-all duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-sm">
                        📈
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Avg. Score</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.avg}%</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex items-center gap-5 hover:transform hover:-translate-y-1 transition-all duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl shadow-sm">
                        🏆
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Best Performance</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.best}%</h3>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-xl">📜</span>
                        Quiz History
                    </h3>
                    <div className="text-sm font-medium text-slate-400">
                        {history.length > 0 ? `${history.length} records found` : "No records"}
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center text-slate-400">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-lg font-medium">Synced with Cloud...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 flex flex-col items-center bg-slate-50/50">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl mb-6 shadow-sm border border-slate-100">🚀</div>
                        <p className="text-2xl font-bold text-slate-800 mb-2">Ready to Start?</p>
                        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">Your journey begins here. Take your first quiz to see analytics and track your progress.</p>
                        <button onClick={() => navigate('/courses')} className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                            Browse Courses ➝
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors group border-l-4 border-transparent hover:border-indigo-500">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-sm">
                                                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(item.timestamp).toLocaleDateString(undefined, { year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-slate-800 text-sm block">{item.courseTitle}</span>
                                            <span className="text-xs text-slate-400 font-medium">{item.totalQuestions || item.total} Questions</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-slate-800">{item.correct}</span>
                                                <span className="text-xs text-slate-400 font-bold">/ {item.total}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-full max-w-[140px]">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className={`text-xs font-bold ${item.percentage >= 70 ? "text-emerald-600" : item.percentage >= 40 ? "text-amber-600" : "text-red-500"}`}>
                                                        {item.percentage >= 70 ? "Excellent" : item.percentage >= 40 ? "Good" : "Needs Work"}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-700">{item.percentage}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${item.percentage >= 70 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : item.percentage >= 40 ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-red-400 to-red-600"}`}
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => navigate(`/course/${item.courseId}/quiz`)}
                                                className="group/btn relative inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-500/10 transition-all"
                                            >
                                                <span className="group-hover/btn:rotate-180 transition-transform duration-500">↻</span> Retake
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main >
    );
}
