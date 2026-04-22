export default function ExampleQuestion() {
  return (
    <section className="py-28 bg-slate-950 text-center">

      <h2 className="text-3xl font-bold mb-12">
        Example AI Interview Question
      </h2>

      <div className="max-w-3xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-8 text-left
      transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

        <p className="text-slate-400 text-sm mb-4">
          Repository: <span className="text-white">react-ecommerce</span>
        </p>

        <h3 className="text-xl font-semibold mb-6">
          Why did you choose Context API instead of Redux for managing global
          state in this project?
        </h3>

        <div className="bg-slate-900 p-4 rounded-lg text-slate-400">
          Context API was sufficient because the application state was small
          and didn’t require complex middleware...
        </div>

      </div>

    </section>
  );
}