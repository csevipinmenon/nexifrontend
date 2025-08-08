import { useEffect, useState, useRef } from "react";
import { Mic, Loader2, Sun, Moon } from "lucide-react";
const apiUrl = import.meta.env.VITE_API_URL;

export default function NexiUI() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responses, setResponses] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  });

  const handleClearChat = () => {
    setResponses([]);
    setTranscript("");
  };

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support Speech Recognition. Use Chrome.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (event) => console.error(event.error);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      const combined = final || interim;
      setTranscript(combined);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (final.trim()) handleSend(final);
      }, 2000);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else {
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    synth.speak(utterance);
  };

  const handleSend = async (text = transcript) => {
    if (!text.trim()) return;
    setResponses((prev) => [...prev, { type: "user", text }]);

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      console.log(data);

      setResponses((prev) => [...prev, { type: "nexi", text: data.response }]);
      speak(data.response);
    } catch (err) {
      console.error("Error communicating with backend:", err);
      const errorMsg = "Sorry, I couldn't reach the AI engine.";
      setResponses((prev) => [...prev, { type: "nexi", text: errorMsg }]);
      speak(errorMsg);
    }
    setTranscript("");
  };

  return (
    <div
      className={`${
        darkMode ? "bg-[#0f172a] text-white" : "bg-white text-black"
      } min-h-screen transition-colors duration-500`}
    >
      <header className="w-full flex justify-between items-center p-4 shadow-md border-b border-gray-700">
        <div className="flex items-center gap-3">
          <img
            src="giphy.gif"
            alt="Nexi Logo"
            className="w-20 h-20 rounded-full"
          />
          <h1 className="text-4xl font-bold text-orange-400">
            Ne<span className="text-blue-400">xi</span>
          </h1>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full border border-gray-500"
        >
          {darkMode ? <Sun /> : <Moon />}
        </button>
      </header>

      <main className="flex flex-col items-center p-4 gap-6">
        <p className="text-xl font-bold opacity-70 text-center">
          Speak continuously and let Nexi assist you.
        </p>

        <div
          ref={chatRef}
          className={`w-full max-w-4xl h-[350px]  ${
            darkMode
              ? "bg-[#1e293b]  "
              : "bg-gray-100 border border-blue-400  shadow-lg shadow-blue-300"
          } rounded-xl  border border-gray-500 p-4 space-y-3 overflow-y-auto`}
        >
          {responses.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.type === "user" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 my-1 rounded-xl text-sm ${
                  msg.type === "user"
                    ? "bg-blue-700 text-white"
                    : darkMode
                    ? "bg-green-700 text-white"
                    : "bg-white text-black"
                }`}
              >
                <span className="font-semibold block text-center mb-1">
                  {msg.type === "user" ? "You" : "Nexi"}:
                </span>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-4xl flex justify-end">
          <button
            onClick={handleClearChat}
            className="text-sm text-red-500 hover:underline hover:text-red-700"
          >
            Clear chat History
          </button>
        </div>

        <div className="flex items-center w-full max-w-4xl gap-2 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type or speak your question..."
              className={`w-full p-3 rounded-lg border focus:outline-none ${
                darkMode
                  ? "bg-gray-800 text-white border-gray-700 focus:border-blue-400 hover:bg-gray-600"
                  : "bg-white hover:bg-gray-300 text-black border-gray-300 focus:border-blue-400"
              }`}
            />
          </div>
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full transition  ${
              isListening ? "bg-red-600 animate-pulse" : "bg-blue-600 "
            }`}
          >
            {isListening ? (
              <Loader2 className="animate-spin  " />
            ) : (
              <Mic className="animate-bounce text-white" />
            )}
          </button>
          <button
            onClick={() => handleSend(transcript)}
            className="bg-green-600 hover:bg-green-700 animate-pulse text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </main>

      <footer className="bg-black text-white py-10 px-6 md:px-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
          <div>
            <h2 className="text-3xl text-orange-400 font-bold  mb-2">
              Ne<span className="text-blue-400">xi</span>
            </h2>
          </div>

          <div className="">
            <h2 className="text-2xl font-bold    text-white mb-2">About</h2>

            <p>
              Nexi is a smart AI-powered chatbot that answers user questions.
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-4 mt-6 text-xl">
              <a
                href="https://github.com/csevipinmenon"
                target="_blank"
                aria-label="github"
              >
                <i className="fab fa-github hover:text-gray-500"></i>
              </a>
              <a href="#" aria-label="Instagram">
                <i className="fab fa-instagram hover:text-gray-500"></i>
              </a>
              <a href="#" aria-label="LinkedIn">
                <i className="fab fa-linkedin hover:text-gray-500"></i>
              </a>
            </div>
          </div>
          <div className="mt-2 text-yellow-400 text-xl">★ ★ ★ ★ ★</div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm">
          <p className="font-bold">
            &copy; 2025 Nexi AI – Built for Every Voice, Every Vision!
          </p>
        </div>
      </footer>
    </div>
  );
}
