import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {

  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();

  const startInterview = () => {

    if (!repoUrl.trim()) {
      alert("Please enter a GitHub repository URL");
      return;
    }

    navigate("/interview", {
      state: { repoUrl }
    });

  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-16 items-center animate-fadeIn">

      {/* LEFT SIDE */}
      <div>

        <h1 className="text-5xl font-bold leading-tight">
          Practice Technical Interviews Using Your
          <span className="text-indigo-500"> GitHub Projects</span>
        </h1>

        <p className="mt-6 text-slate-400 text-lg max-w-lg">
          AI analyzes your repositories and generates real
          interview questions based on your code.
        </p>

        <div className="mt-10 flex gap-4">

          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repository"
            className="px-4 py-3 w-96 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={startInterview}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
          >
            Start Interview
          </button>

        </div>

      </div>

      {/* RIGHT SIDE PRODUCT PREVIEW */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-indigo-500/20 hover:-translate-y-1">

        <p className="text-slate-400 text-sm mb-4">
          Repository: <span className="text-white">react-ecommerce</span>
        </p>

        <div className="bg-slate-800 p-4 rounded-lg">

          <p className="text-indigo-400 text-sm mb-2">
            AI Interview Question
          </p>

          <p className="text-slate-200">
            Why did you choose Context API instead of Redux
            for managing global state in this project?
          </p>

        </div>

        <div className="mt-4 text-sm text-slate-400">
          AI analyzing repository...
        </div>

      </div>

    </section>
  );
}