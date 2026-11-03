import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
    return (
        <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12 animate-fade-in-up">
                <div className="mb-8 border-b border-slate-100 pb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
                    <p className="text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
                        <p>
                            When you use FIN-IQ WITH RITIKA, we collect information that you provide to us directly, such as when you create an account, update your profile, or contact us. This may include your name, email address, and profile picture. We also track your quiz performance and progress to provide you with detailed analytics.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Provide, maintain, and improve our services.</li>
                            <li>Personalize your learning experience and track your progress.</li>
                            <li>Authentication and account security.</li>
                            <li>Respond to your comments and questions.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Storage and Cookies</h2>
                        <p>
                            We utilize secure cloud storage (Google Firebase) to store your account details, quiz progress, and performance history, ensuring your data is synchronized across all your devices. We also use local storage on your device to maintain your login session and verify administrative credentials. Cookies are used to enhance site functionality and improve your user experience.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Security</h2>
                        <p>
                            We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. However, no internet transmission is completely secure, and we cannot guarantee the security of your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Third-Party Services</h2>
                        <p>
                            We may use third-party services (such as Firebase for authentication) that collect usage data and handle data processing. These services have their own privacy policies which we serve to respect.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us via our <Link to="/contact" className="text-brand-600 hover:underline">Contact Page</Link>.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
                    <Link to="/" className="btn-primary px-8 py-3 rounded-xl font-semibold">
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
