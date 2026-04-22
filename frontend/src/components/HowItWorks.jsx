export default function HowItWorks() {
  return (
    <section className="py-28 bg-slate-900 text-center">

      <h2 className="text-3xl font-bold mb-16">
        How It Works
      </h2>

      <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 
        transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500">

          <h3 className="text-xl font-semibold mb-2">
  Paste Repository URL
</h3>
<p className="text-slate-400">
  Provide the GitHub repository you want to practice with.
</p>

        </div>

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 
        transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500">

          <h3 className="text-xl font-semibold mb-2">
  AI Analyzes Code
</h3>
<p className="text-slate-400">
  The AI reviews project structure and important files.
</p>

        </div>

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 
        transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500">

          <h3 className="text-xl font-semibold mb-2">
  Start Interview
</h3>
<p className="text-slate-400">
  Answer interview questions based on your project.
</p>

        </div>

      </div>

    </section>
  );
}