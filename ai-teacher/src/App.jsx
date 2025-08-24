import React, { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Send, Sparkles, Settings, User } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function App() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner"); // beginner | intermediate | advanced
  const [style, setStyle] = useState("simple");   // simple | exam | with-examples
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I’m your AI teacher. What topic should we learn today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const ask = async (text) => {
    if (!text.trim()) return;
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/teach`, {
        topic: topic || text,
        level, style,
        question: text,
        history: newMsgs.slice(-12) // send recent turns
      });
      setMessages([...newMsgs, { role: "assistant", content: res.data.answer }]);
    } catch (e) {
      setMessages([...newMsgs, { role: "assistant", content: "Sorry, something went wrong." }]);
      console.error(e);
    } finally {
      setLoading(false);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const onSubmit = (e) => { e.preventDefault(); ask(input); };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-neutral-800 p-4 hidden md:block">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="w-5 h-5" />
          AI Teacher
        </div>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-neutral-400">Topic</span>
            <input
              className="mt-1 w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-700"
              placeholder="e.g., TCP vs UDP, Binary Search, Photosynthesis"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2">
              <option value="simple">Simple</option>
              <option value="exam">Exam prep</option>
              <option value="with-examples">With examples</option>
            </select>
          </div>

          <button
            onClick={() => ask(`Explain ${topic || "any topic"} in simple terms`)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-100 text-neutral-900 px-3 py-2 font-medium hover:bg-white/90"
          >
            <BookOpen className="w-4 h-4" /> Teach me
          </button>

          <div className="text-xs text-neutral-500 flex items-center gap-2">
            <Settings className="w-3 h-3" />
            Personalized by your level & style
          </div>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col">
        <header className="border-b border-neutral-800 p-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          <div className="font-semibold">Lesson: {topic || "—"}</div>
          <div className="ml-auto text-xs text-neutral-400">Mode: {level} · {style}</div>
        </header>

        <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-3xl ${m.role === "user" ? "ml-auto" : ""}`}>
              <div className={`rounded-2xl px-4 py-3 border ${m.role === "user" ? "bg-neutral-100 text-neutral-900 border-neutral-300" : "bg-neutral-900 border-neutral-800"}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-neutral-400">Thinking…</div>}
        </div>

        <form onSubmit={onSubmit} className="p-3 border-t border-neutral-800 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question… (e.g., 'Explain TCP 3-way handshake simply')"
            className="flex-1 rounded-2xl bg-neutral-900 border border-neutral-800 px-4 py-3 outline-none"
          />
          <button className="rounded-2xl bg-neutral-100 text-neutral-900 px-4 py-3 font-medium hover:bg-white/90">
            <div className="flex items-center gap-2"><Send className="w-4 h-4" /> Send</div>
          </button>
        </form>
      </main>
    </div>
  );
}
