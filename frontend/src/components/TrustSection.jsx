export default function TrustSection() {
  return (
    <section className="py-28 bg-slate-900 text-center">

      <h2 className="text-3xl font-bold mb-16">
        Built for Developer Trust
      </h2>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700
        transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500">
          <h3 className="text-lg font-semibold mb-2">
  No Repository Storage
</h3>
<p className="text-slate-400">
  Your code is analyzed temporarily and never stored.
</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700
        transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500">
          <h3 className="text-lg font-semibold mb-2">
            Read-Only Repository Access
          </h3>
          <p className="text-slate-400">
            We only read repository files required to generate questions.
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700
        transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500">
          <h3 className="text-lg font-semibold mb-2">
            No Code Stored
          </h3>
          <p className="text-slate-400">
            Your source code is never permanently stored on our servers.
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700
        transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500">
          <h3 className="text-lg font-semibold mb-2">
            Private & Secure
          </h3>
          <p className="text-slate-400">
            Repository analysis happens securely during the interview session.
          </p>
        </div>

      </div>

    </section>
  );
}