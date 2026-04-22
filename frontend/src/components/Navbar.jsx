export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800">
      
      <h1 className="text-xl font-bold">
        AI GitHub Interviewer
      </h1>

      <div className="flex gap-6 items-center">
        <a
  href="#"
  className="text-slate-400 hover:text-white transition-colors duration-300"
>
  How it works
</a>

        <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg">
          Connect GitHub
        </button>
      </div>

    </nav>
  );
}