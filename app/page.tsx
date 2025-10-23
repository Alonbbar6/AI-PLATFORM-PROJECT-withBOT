import NavBar from "./components/NavBar";
import { Brain, GraduationCap, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <NavBar />


      {/* Hero */}

      <section className="relative flex justify-between items-center px-8 py-4 shadow-sm">

        <img
        // className="absolute inset-0 w-full h-full object-cover"
        // src="/hero.png"
        // alt="Hero Image"
        />

        <div className="relative z-10 max-w-xl p-15 text-white">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Unlock the Power of AI for Your Business
          </h1>
          <p className="mb-8 text-lg">
            Learn how to leverage artificial intelligence to streamline operations,
            enhance customer experiences, and drive growth. Our comprehensive
            training program is designed for entrepreneurs and small business owners.
          </p>

          <a
            href="/module1"
            className="bg-blue-600 text-white px-12 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Learning
          </a>
        </div>
      </section>

      {/* Body */}

      <section className="pt-12 pl-5 pr-5 bg-gray-50">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">
            Why Choose Our AI Training?
          </h1>

          <p className="text-sm">
            Our program is tailored to meet the needs of entrepreneurs and small businesses,
            providing practical skills and actionable insights.
          </p>

          {/* Feature Grid */}

          <div className="grid grid-cols-3 gap-10 max-w-5xl mx-auto pt-6">

            <div className="flex flex-col items-start bg-white p-6 rounded-lg shadow-sm">
              <Brain className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-lg">Practical, Hands-On Learning</h3>
              <p className="text-sm">
                Gain real-world experience through interactive exercises and case studies.
              </p>
            </div>

            <div className="flex flex-col items-start bg-white p-6 rounded-lg shadow-sm">
              <GraduationCap className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-lg">Expert-Led Training</h3>
              <p className="text-sm">
                Learn from industry-leading AI experts with a proven track record.
              </p>
            </div>

            <div className="flex flex-col items-start bg-white p-6 rounded-lg shadow-sm">
              <Clock className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-lg">Flexible, Self-Paced Modules</h3>
              <p className="text-sm">
                Access the program anytime, anywhere, and learn at your own pace.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">AI Training Platform</h3>
            <p className="text-sm leading-relaxed">
              Empowering entrepreneurs with the knowledge to use AI tools effectively in their business.
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/module1" className="hover:text-white transition">Module 1</a></li>
              <li><a href="/dashboard" className="hover:text-white transition">Dashboard</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} AI Training Platform. All rights reserved.
        </div>
      </footer>


    </main>
  );
}
