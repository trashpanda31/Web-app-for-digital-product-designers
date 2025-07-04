import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export const PmPersonal = ({ user, onBack, onReadMessagesDone }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    axios.get(`/api/messages/${user._id}`, { withCredentials: true })
      .then(res => setMessages(res.data))
      .finally(() => setLoading(false));
    const csrfToken = sessionStorage.getItem('csrfToken');
    axios.patch(`/api/messages/${user._id}/read`, {}, {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true
    }).then(() => {
      if (onReadMessagesDone) onReadMessagesDone();
    });
  }, [user, onReadMessagesDone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const csrfToken = sessionStorage.getItem('csrfToken');
    await axios.post("/api/messages", {
      receiverId: user._id,
      text: input
    }, {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true
    });
    setInput("");
    axios.get(`/api/messages/${user._id}`, { withCredentials: true })
      .then(res => {
        console.log('messages after send:', res.data);
        setMessages(res.data);
      });
  };

  return (
    <div className="bg-[#f8faff] rounded-[22px] flex flex-row justify-center w-full">
      <div className="bg-[#f8faff] rounded-[22px] border-[2px] border-solid border-black shadow-[0px_8px_8px_#00000040] overflow-x-hidden w-[300.38px] h-[438px] relative flex flex-col">

        <div className="flex items-center justify-between px-5 py-5">
          <img className="w-5 h-5 cursor-pointer"
            alt="Arrow left"
            src="/img/arrow-left-02.svg"
            onClick={onBack}/>
          <div className="w-[37px] h-[37px] bg-[#d9d9d9] rounded-full flex items-center justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-base font-bold text-black">{user?.username?.[0]}</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 custom-scrollbar-hide min-h-24">
          {loading ? <div>Loading...</div> : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`mb-2 flex ${msg.sender === user._id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-lg ${msg.sender === user._id ? 'bg-[#f8faff] text-black' : 'bg-[#f8faff] text-black'}`}>
                    {msg.text}
                  </div>
          </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="w-[92%] max-w-[265px] h-[50px] mx-auto mb-3 rounded-[16.06px] border border-solid border-black flex items-center px-3 bg-[#f8faff] shadow-md">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Type a message..."
            className="flex-1 h-10 border-none outline-none bg-transparent text-sm"/>

          <button onClick={handleSend} className="ml-2 w-8 h-8 flex items-center justify-center rounded-full border border-solid border-black bg-[#f8faff] hover:bg-[#d1e7ff]">
            <img className="w-5 h-5"
              alt="Arrow up"
              src="/img/arrow-up-02.svg"/>
          </button>

        </div>
      </div>
    </div>
  );
};
