import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, FileText, Clock, Calendar, Shield, LogOut, Trash2, Search, Eye, EyeOff, X } from 'lucide-react';
import { getAllAdminResults, getAllUsers, getAllFeedback, getAdminSettings, updateAdminSettings } from '../services/db'; // Import DB service

// Helper to get credentials (from storage or default)
const getAdminCredentials = () => {
    try {
        const stored = localStorage.getItem('admin_credentials');
        return stored ? JSON.parse(stored) : { username: 'admin', password: 'admin123' };
    } catch (e) {
        console.error("Error parsing admin credentials", e);
        return { username: 'admin', password: 'admin123' };
    }
};

export function AdminLogin() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Removed auto-redirect useEffect to prevent loops

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // 1. Try fetching from Cloud (Firestore)
            let currentCreds = await getAdminSettings();

            // 2. Fallback to LocalStorage if cloud is empty (first run) or fails
            if (!currentCreds) {
                const stored = localStorage.getItem('admin_credentials');
                currentCreds = stored ? JSON.parse(stored) : { username: 'admin', password: 'admin123' };
            }

            if (
                credentials.username === currentCreds.username &&
                credentials.password === currentCreds.password
            ) {
                // Determine if this is a first-time migration (cloud was empty but we logged in via local/default)
                // If so, we should silently sync to cloud now to ensure consistency next time
                // But generally safe to just let them login
                localStorage.setItem('admin_authenticated', 'true');
                navigate('/admin/dashboard');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            console.error("Login check failed", err);
            setError('Connection failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
            {/* Back to Home Link */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8">
                <a href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                        <img
                            src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2007_05_37%20PM.png"
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-primary-600">FIN-IQ WITH RITIKA</h1>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium group-hover:text-slate-700 transition-colors">← Back to Home</p>
                    </div>
                </a>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-slate-100 relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                        🛡️
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Admin Portal</h2>
                    <p className="text-slate-500 mt-2">Restricted Access only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                                placeholder="Enter username"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                                placeholder="Enter password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}

// export function AdminLogin_ORIGINAL() {
//    const [credentials, setCredentials] = useState({ username: '', password: '' }); 
//    ... (commented out original logic for safekeeping)
// }

export function AdminDashboard() {
    const [records, setRecords] = useState([]);
    const [students, setStudents] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [activeTab, setActiveTab] = useState('recent'); // 'recent', 'students', 'feedback'
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [search, setSearch] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [newCreds, setNewCreds] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    // Reset page when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, search]);

    useEffect(() => {
        const isAuth = localStorage.getItem('admin_authenticated');
        if (!isAuth) {
            navigate('/admin');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Tests
                const results = await getAllAdminResults();
                const normalizedRecords = results.map(r => {
                    let ts = r.timestamp || r.date;
                    if (ts && typeof ts.seconds === 'number') {
                        ts = new Date(ts.seconds * 1000);
                    } else {
                        ts = ts ? new Date(ts) : new Date();
                    }
                    if (isNaN(ts.getTime())) ts = new Date();

                    const finalScore = r.score ?? r.correct ?? 0;
                    const finalTotal = r.totalQuestions || r.total || 10;
                    const pct = r.percentage ?? Math.round((finalScore / finalTotal) * 100);

                    return {
                        ...r,
                        timestamp: ts.toISOString(),
                        studentName: r.studentName || r.displayName || "Unknown Student",
                        studentPhoto: r.studentPhoto || r.photo || r.photoURL,
                        rollNumber: r.rollNumber || "N/A",
                        quizTitle: r.quizTitle || r.courseTitle || r.courseId || "Unknown Quiz",
                        score: finalScore,
                        totalQuestions: finalTotal,
                        percentage: pct,
                        timeTaken: r.timeTaken || "N/A",
                        uid: r.userId || r.uid || r.studentId
                    };
                }).filter(r => r.score !== undefined).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setRecords(normalizedRecords);

                // 2. Fetch Users (Student Directory)
                const users = await getAllUsers();

                // 3. Fetch Feedback
                const feedbackData = await getAllFeedback();
                setFeedback(feedbackData);

                // 3. Aggregate Stats per Student
                const studentList = users.map(u => {
                    const userRecords = normalizedRecords.filter(r => {
                        if (u.id && r.uid) return u.id === r.uid;
                        if (u.uid && r.uid) return u.uid === r.uid;
                        return r.studentName === (u.fullName || u.displayName);
                    });

                    const totalTests = userRecords.length;
                    const avgScore = totalTests ? Math.round(userRecords.reduce((acc, curr) => acc + curr.percentage, 0) / totalTests) : 0;
                    const bestScore = totalTests ? Math.max(...userRecords.map(r => r.percentage)) : 0;

                    return {
                        ...u,
                        displayName: u.fullName || u.displayName || "Unknown",
                        photo: u.photo || u.photoURL,
                        stats: {
                            totalTests,
                            avgScore,
                            bestScore
                        },
                        history: userRecords
                    };
                });

                setStudents(studentList);

            } catch (err) {
                console.error("Failed to load admin data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin_authenticated');
        window.location.href = '/';
    };

    const clearRecords = () => {
        if (window.confirm('Are you sure you want to delete ALL student records? This cannot be undone.')) {
            localStorage.removeItem('student_quiz_records');
            setRecords([]);
        }
    };

    const updateCredentials = async (e) => {
        e.preventDefault();
        if (!newCreds.username || !newCreds.password) {
            alert("Please fill in both fields");
            return;
        }

        try {
            // Save to Cloud (Master)
            await updateAdminSettings(newCreds);
            // Save to Local (Cache)
            localStorage.setItem('admin_credentials', JSON.stringify(newCreds));

            alert("Credentials updated in Cloud! Please login again.");
            handleLogout();
        } catch (err) {
            console.error("Failed to update credentials", err);
            alert("Failed to update credentials. Please check your internet connection.");
        }
    };

    // Filter & Sort Logic for Recent Records (Latest First)
    const filteredRecords = records
        .filter(r => {
            const sName = r.studentName || '';
            const qTitle = r.quizTitle || '';
            const searchLower = search.toLowerCase();
            return sName.toLowerCase().includes(searchLower) || qTitle.toLowerCase().includes(searchLower);
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter & Sort Logic for Student Records (Most Recently Active First)
    const filteredStudents = students
        .filter(s => {
            const sName = s.displayName || '';
            const sEmail = s.email || '';
            const searchLower = search.toLowerCase();
            return sName.toLowerCase().includes(searchLower) || sEmail.toLowerCase().includes(searchLower);
        })
        .sort((a, b) => {
            const lastActiveA = a.history && a.history.length > 0 ? new Date(a.history[0].timestamp) : new Date(0);
            const lastActiveB = b.history && b.history.length > 0 ? new Date(b.history[0].timestamp) : new Date(0);
            return lastActiveB - lastActiveA;
        });

    const StatsCard = ({ icon, label, value, sub }) => (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex items-center gap-5 hover:transform hover:-translate-y-1 transition-all duration-300">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${sub === 'excellent' ? 'bg-emerald-50 text-emerald-600' : sub === 'good' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{label}</p>
                <h3 className="text-3xl font-black text-slate-800">{value}</h3>
            </div>
        </div>
    );

    // --- RENDER HELPERS ---

    const renderRecentRecords = () => {
        const ITEMS_PER_PAGE = 15;
        const totalItems = filteredRecords.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
        const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        const visibleRecords = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Quiz Name</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4">Time Taken</th>
                                <th className="px-6 py-4">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visibleRecords.length > 0 ? (
                                visibleRecords.map((record, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => {
                                                    const targetStudent = students.find(s =>
                                                        (record.uid && (s.id === record.uid || s.uid === record.uid)) ||
                                                        s.displayName === record.studentName
                                                    );

                                                    if (targetStudent) {
                                                        setSelectedStudent(targetStudent);
                                                        setActiveTab('students');
                                                    } else {
                                                        alert("Student details not found for this record.");
                                                    }
                                                }}
                                            >
                                                {record.studentPhoto ? (
                                                    <img
                                                        src={record.studentPhoto}
                                                        alt={record.studentName}
                                                        className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-indigo-400 transition-colors"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                        {record.studentName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{record.studentName || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                {record.quizTitle}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.percentage >= 70 ? 'bg-green-100 text-green-800' :
                                                record.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {record.score} / {record.totalQuestions} ({record.percentage}%)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {record.timeTaken || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                {new Date(record.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        {search ? 'No matching records found' : 'No quiz records yet'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex justify-center items-center gap-4 bg-slate-50/50">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={safeCurrentPage === 1}
                            className={`text-blue-600 font-medium hover:underline ${safeCurrentPage === 1 ? 'opacity-50 cursor-not-allowed text-slate-400 no-underline' : ''}`}
                        >
                            <span className="mr-1">«</span>Previous
                        </button>

                        <div className="flex items-center gap-2">
                            {(() => {
                                const windowSize = 10;
                                const startPage = Math.max(1, Math.min(safeCurrentPage - Math.floor(windowSize / 2), totalPages - windowSize + 1));
                                const endPage = Math.min(totalPages, startPage + windowSize - 1);
                                const pages = [];
                                for (let i = startPage; i <= endPage; i++) pages.push(i);
                                return pages.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${p === safeCurrentPage
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ));
                            })()}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className={`text-blue-600 font-medium hover:underline ${safeCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed text-slate-400 no-underline' : ''}`}
                        >
                            Next<span className="ml-1">»</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderStudentList = () => {
        const ITEMS_PER_PAGE = 15;
        const totalItems = filteredStudents.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        // Ensure current page is valid
        const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
        const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        const visibleStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {visibleStudents.map((student) => (
                    <div
                        key={student.id || student.uid || Math.random()}
                        onClick={() => setSelectedStudent(student)}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            {student.photo ? (
                                <img src={student.photo} alt={student.displayName} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 group-hover:border-indigo-100 transition-colors" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    🎓
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{student.displayName}</h3>
                                <p className="text-sm text-slate-500">{student.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase">Tests</p>
                                <p className="font-black text-slate-800 text-lg">{student.stats.totalTests}</p>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase">Avg</p>
                                <p className={`font-black text-lg ${student.stats.avgScore >= 70 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                    {student.stats.avgScore}%
                                </p>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase">Best</p>
                                <p className="font-black text-amber-600 text-lg">{student.stats.bestScore}%</p>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredStudents.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        No students found matching "{search}"
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="col-span-full flex justify-center items-center gap-4 mt-8">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={safeCurrentPage === 1}
                            className={`text-blue-600 font-medium hover:underline ${safeCurrentPage === 1 ? 'opacity-50 cursor-not-allowed text-slate-400 no-underline' : ''}`}
                        >
                            <span className="mr-1">«</span>Previous
                        </button>

                        <div className="flex items-center gap-2">
                            {(() => {
                                const windowSize = 10;
                                const startPage = Math.max(1, Math.min(safeCurrentPage - Math.floor(windowSize / 2), totalPages - windowSize + 1));
                                const endPage = Math.min(totalPages, startPage + windowSize - 1);
                                const pages = [];
                                for (let i = startPage; i <= endPage; i++) pages.push(i);
                                return pages.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${p === safeCurrentPage
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ));
                            })()}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className={`text-blue-600 font-medium hover:underline ${safeCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed text-slate-400 no-underline' : ''}`}
                        >
                            Next<span className="ml-1">»</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderStudentDetail = () => {
        if (!selectedStudent) return null;
        const history = selectedStudent.history || [];

        return (
            <div className="animate-fade-in-up space-y-8">
                <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors mb-4">
                    <span>←</span> Back to Students
                </button>

                {/* Profile Header */}
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
                                {selectedStudent.photo ? (
                                    <img
                                        src={selectedStudent.photo}
                                        alt="Profile"
                                        className="w-full h-full object-cover rounded-xl bg-white/50"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/20 rounded-xl flex items-center justify-center text-white/80">
                                        <span className="text-4xl">🎓</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center md:text-left text-white flex-1">
                            <h1 className="text-4xl md:text-5xl font-['Outfit'] font-bold tracking-tight mb-2 drop-shadow-md text-white">
                                {selectedStudent.displayName || "Unknown User"}
                            </h1>
                            <p className="text-indigo-100 font-medium text-lg flex items-center justify-center md:justify-start gap-2 mb-6">
                                <span className="opacity-70">📧</span> {selectedStudent.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard icon="📊" label="Total Tests" value={selectedStudent.stats.totalTests} />
                    <StatsCard icon="📈" label="Avg. Score" value={`${selectedStudent.stats.avgScore}%`} sub={selectedStudent.stats.avgScore >= 70 ? 'excellent' : 'normal'} />
                    <StatsCard icon="🏆" label="Best Score" value={`${selectedStudent.stats.bestScore}%`} sub="good" />
                </div>

                {/* History Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <span>📜</span> Quiz History
                        </h3>
                        <span className="text-sm text-slate-500">{history.length} records</span>
                    </div>
                    {history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Quiz</th>
                                        <th className="px-6 py-4">Score</th>
                                        <th className="px-6 py-4">Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((h, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {new Date(h.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">
                                                {h.quizTitle}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-900">{h.correct}</span>
                                                <span className="text-slate-400 text-xs"> / {h.totalQuestions}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${h.percentage >= 70 ? 'bg-emerald-500' : h.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${h.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 mt-1 block">{h.percentage}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            No quiz history found for this student.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const renderFeedbackDetail = () => {
        if (!selectedFeedback) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-xl font-bold text-slate-900">Feedback Details</h3>
                        <button onClick={() => setSelectedFeedback(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Submitted By</label>
                                <p className="text-lg font-semibold text-slate-900 mt-1">{selectedFeedback.firstName} {selectedFeedback.lastName}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                                <p className="text-lg font-medium text-slate-700 mt-1">{new Date(selectedFeedback.submittedAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                                <p className="text-base font-medium text-slate-700 mt-1">{selectedFeedback.email}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone</label>
                                <p className="text-base font-medium text-slate-700 mt-1">{selectedFeedback.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Message</label>
                            <div className="bg-slate-50 p-4 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                                {selectedFeedback.message}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={() => setSelectedFeedback(null)} className="btn-secondary px-6 py-2 rounded-lg font-semibold">Close</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderFeedbackList = () => {
        const ITEMS_PER_PAGE = 15;
        const totalItems = feedback.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
        const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        const visibleFeedback = feedback.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visibleFeedback.length > 0 ? (
                                visibleFeedback.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                            {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{item.firstName} {item.lastName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600">
                                                {item.message?.split(' ').slice(0, 4).join(' ')}...
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedFeedback(item)}
                                                className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 text-sm font-semibold group"
                                            >
                                                Read More <span className="group-hover:translate-x-1 transition-transform">→</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        No feedback received yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safeCurrentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pNum = i + 1;
                                if (totalPages > 5 && safeCurrentPage > 3) {
                                    pNum = safeCurrentPage - 2 + i;
                                }
                                if (pNum > totalPages) return null;

                                return (
                                    <button
                                        key={pNum}
                                        onClick={() => setCurrentPage(pNum)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${safeCurrentPage === pNum ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {pNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <nav className="bg-slate-900 text-white shadow-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex items-center justify-center shadow-lg">
                                <img
                                    src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2007_05_37%20PM.png"
                                    alt="Admin Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-lg tracking-tight">Admin<span className="text-indigo-400">Panel</span></span>
                                <Shield className="w-5 h-5 text-indigo-500" />
                            </div>
                        </div>

                        {/* Tab Bar */}
                        <div className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                            <button
                                onClick={() => { setActiveTab('recent'); setSelectedStudent(null); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'recent' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                Recent Records
                            </button>
                            <button
                                onClick={() => { setActiveTab('students'); setSelectedStudent(null); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'students' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                Student Records
                            </button>
                            <button
                                onClick={() => { setActiveTab('feedback'); setSelectedStudent(null); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'feedback' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                Feedback
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg transition-all"
                                title="Settings"
                            >
                                ⚙️ <span>Settings</span>
                            </button>
                            <div className="h-6 w-px bg-slate-800"></div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all"
                            >
                                <LogOut className="w-4 h-4" /> <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Tab Bar (Visible on small screens) */}
            <div className="md:hidden bg-white border-b border-slate-200 sticky top-16 z-30 px-4 py-2 flex gap-2 overflow-x-auto">
                <button
                    onClick={() => { setActiveTab('recent'); setSelectedStudent(null); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'recent' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                    Recent Records
                </button>
                <button
                    onClick={() => { setActiveTab('students'); setSelectedStudent(null); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'students' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                    Student Records
                </button>
                <button
                    onClick={() => { setActiveTab('feedback'); setSelectedStudent(null); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'feedback' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                    Feedback
                </button>
            </div>

            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                🔐 Change Credentials
                            </h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={updateCredentials} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={newCreds.username}
                                        onChange={(e) => setNewCreds({ ...newCreds, username: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                        placeholder="Enter new username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="password"
                                        value={newCreds.password}
                                        onChange={(e) => setNewCreds({ ...newCreds, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                        placeholder="Enter new password"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                                >
                                    Update Credentials
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Section */}
                {!selectedStudent && (
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {activeTab === 'recent' ? 'Recent Activity' : activeTab === 'students' ? 'Student Directory' : 'User Feedback'}
                            </h1>
                            <p className="text-slate-500 mt-1 font-medium">
                                {activeTab === 'recent'
                                    ? 'Real-time feed of latest quiz attempts'
                                    : activeTab === 'students'
                                        ? 'Manage and view registered students'
                                        : 'Review messages and suggestions from users'}
                            </p>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-grow md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'recent' ? "Search quiz or student..." : activeTab === 'students' ? "Search by name or email..." : "Search messages..."}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all"
                                />
                            </div>
                            {activeTab === 'recent' && (
                                <button
                                    onClick={clearRecords}
                                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" /> Clear All
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'recent' && renderRecentRecords()}
                        {activeTab === 'students' && (
                            selectedStudent ? renderStudentDetail() : renderStudentList()
                        )}
                        {activeTab === 'feedback' && renderFeedbackList()}
                    </>
                )}
            </main>
            {renderFeedbackDetail()}

            <footer className="mt-auto bg-slate-900 border-t border-slate-800 h-16 flex items-center shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="flex justify-between items-center w-full">
                        {/* Left: Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-gray-100 shadow-md">
                                    <img
                                        src="https://ik.imagekit.io/KRISHNA2380/ChatGPT%20Image%20Jan%2020,%202026,%2007_05_37%20PM.png"
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="font-bold text-slate-300 tracking-tight hidden sm:block">FIN-IQ WITH RITIKA</span>
                            </Link>
                        </div>

                        {/* Center: Copyright */}
                        <div className="text-center font-bold text-slate-500 tracking-tight text-sm hidden md:block">
                            <span className="text-slate-300">©KRISHNA2380</span>. All rights reserved.
                        </div>

                        {/* Right: Links */}
                        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
