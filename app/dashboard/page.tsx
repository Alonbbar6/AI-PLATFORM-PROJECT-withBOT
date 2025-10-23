import NavBar from "../components/NavBar";

export default function Dashboard() {
    return (
        <main className="min-h-screen bg-gray-100 text-gray-900">
            <NavBar />
            <section className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Modules Completed</h2>
                        <p className="text-3xl font-bold text-blue-600">1</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Quizzes Completed</h2>
                        <p className="text-3xl font-bold text-green-600">0</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Total Study Time</h2>
                        <p className="text-3xl font-bold text-purple-600">2h 15m</p>
                    </div>
                </div>
                <p className="mt-8 text-gray-600">
                    (This is a placeholder dashboard — real analytics can be connected using GA4 API.)
                </p>
            </section>
        </main>
    );
}
