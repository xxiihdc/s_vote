'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Premium Gradient */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-32 sm:pb-40">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 transition-colors duration-300">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Anonymous Polling Platform
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
            Create Polls,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Share Results Securely
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Create anonymous polls without registration. Share result links with secure token access. Perfect for surveys, team decisions, and public opinions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/votes/create"
              className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-4 font-semibold !text-white shadow-xl shadow-blue-900/25 ring-1 ring-blue-800/20 transition-all duration-300 ease-out hover:from-blue-800 hover:to-indigo-800 hover:shadow-2xl hover:shadow-blue-900/35 hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2 text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_0.28)]">
                Create Your First Poll
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>

            <Link
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-50 text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            >
              <span className="flex items-center gap-2">
                Learn More
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 sm:px-6 lg:px-8 py-28 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1 rounded-full mb-4">
              Core Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose S Vote?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for effective anonymous polling in one elegant platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1">
              {/* Hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  100% Anonymous
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  No login required. Your voters&apos; privacy is completely protected and secure.
                </p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Real-time Results
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Share token URLs to let others view live poll results instantly and securely.
                </p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Easy to Use
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Create, share, and collect votes in seconds with our intuitive interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-28 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1 rounded-full mb-4">
              Simple Process
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
              How It Works
            </h2>
          </div>

          <div className="space-y-8 relative">
            {/* Vertical line connector */}
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-blue-300 to-gray-200 sm:left-12 sm:w-1" />

            {/* Step 1 */}
            <div className="relative pl-20 sm:pl-32">
              <div className="absolute -left-3 top-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-8 ring-white">
                1
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-blue-100 p-6 sm:p-8 hover:border-blue-200 transition-colors duration-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Create Your Poll
                </h3>
                <p className="text-gray-600 text-lg">
                  Set up your poll with options. No account needed – just add your questions and choices.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-20 sm:pl-32">
              <div className="absolute -left-3 top-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-8 ring-white">
                2
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-blue-100 p-6 sm:p-8 hover:border-blue-200 transition-colors duration-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Share the Link
                </h3>
                <p className="text-gray-600 text-lg">
                  Send voters the poll link via email, chat, or social media. They can vote immediately.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-20 sm:pl-32">
              <div className="absolute -left-3 top-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-8 ring-white">
                3
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-blue-100 p-6 sm:p-8 hover:border-blue-200 transition-colors duration-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  View Results
                </h3>
                <p className="text-gray-600 text-lg">
                  Use your token URL to monitor results in real-time. Share results with participants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to Create Your Poll?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-10">
            It only takes seconds to get started. No registration required.
          </p>
          <Link
            href="/votes/create"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 ease-out hover:scale-105 active:scale-95 shadow-2xl hover:shadow-3xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Poll Now
          </Link>
        </div>
      </section>
    </main>
  )
}
