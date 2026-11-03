import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
    return (
        <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12 animate-fade-in-up">
                <div className="mb-8 border-b border-slate-100 pb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">Terms of Service</h1>
                    <p className="text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using this website ("FIN-IQ WITH RITIKA"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Educational Purpose</h2>
                        <p>
                            This platform is designed for educational and practice purposes only. The quizzes and materials provided are intended to assist in preparing for various finance-related assessments but are <strong>not official exam questions</strong>. We do not guarantee that these exact questions will appear in any official examination.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Accounts</h2>
                        <p>
                            To access certain features like tracking progress and quiz history, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and current information during the registration process.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Intellectual Property</h2>
                        <p>
                            All content on this website, including but not limited to text, graphics, logos, quiz questions, and software code, is the property of FIN-IQ WITH RITIKA (or its content suppliers) and IS protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works from this content without explicit permission.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Limitation of Liability</h2>
                        <p>
                            In no event shall FIN-IQ WITH RITIKA or its affiliates be liable for any direct, indirect, incidental, or consequential damages arising out of your use of the website or the quiz materials. We strictly disclaim any liability for exam results or performance based on the use of this platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. Modifications</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the platform constitutes your acceptance of such changes.
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
