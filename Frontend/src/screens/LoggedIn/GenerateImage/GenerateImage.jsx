import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "../../../components/UserAvatar";

import { PmMain } from '../../../components/Pm/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal';

export const GenerateImage = () => {
  const [prompt, setPrompt] = useState("");
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);
  const [messages, setMessages] = useState([
    {
      type: 'system',
      content: {
        title: "Hello! I'm your AI-image generator!",
        description: "Please enter your prompt as detailed and as much as possible! Specify what you expect from the result, style, mood, color palette, desired elements or atmosphere of the image. The more precisely you formulate the request, the better the final result will be."
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    const userMessage = { type: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': sessionStorage.getItem('csrfToken'),
        },
        body: JSON.stringify({ prompt }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      console.log('API Response:', data);

      const aiMessage = { 
        type: 'ai', 
        content: data.image || data.imageUrl || data.url || data 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating image:', error);

      const errorMessage = { 
        type: 'error', 
        content: `Failed to generate image. Error: ${error.message}. Please try again.` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-[#f7faff] min-h-screen flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] h-screen relative">

        <div className="absolute w-[1440px] h-[93px] top-0 left-0 z-10 bg-[#f7faff]">
          <img className="absolute w-[189px] h-12 top-[19px] left-[77px] object-cover"
              alt="Logo"
              src="/img/logo.png"/>

          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-[15px]">
            <Link to="/home-logged"
                  className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Illustrations
            </Link>

            <Link to="/Generate-image-logged-in"
                  className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Generate image
            </Link>

            <Link to="/RemoveBG-logged-in"
                  className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Remove Bg
            </Link>
          </div>

          <img className="absolute w-6 h-6 top-[35px] left-[1268px] cursor-pointer z-50"
            alt="Message"
            src="/img/message-01.svg"
            onClick={() => setPmOpen(v => !v)} />
          <UserAvatar />
        </div>

        <div className="absolute inset-0 pt-[110px] pb-[200px] px-[75px] overflow-hidden">
          <div className="h-[calc(100vh-310px)] overflow-y-auto scrollbar-hide">
            <div className="flex flex-col gap-[16px]">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${
                    message.type === 'user' 
                      ? 'justify-end' 
                      : message.type === 'system'
                      ? 'justify-center'
                      : 'justify-start'
                  } animate-slideUp`}>
                  {message.type === 'system' ? (
                    <div className="flex flex-col items-center w-full gap-[48px]">
                      <p className="w-[533px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-5xl text-center tracking-[0] leading-[normal] ">
                        {message.content.title}
                      </p>
                      <p className="max-w-[800px] [font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal]">
                        {message.content.description}
                      </p>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-[16.63px] ${ 
                      message.type === 'user' 
                        ? 'bg-[#d9d9d9] text-black max-w-lg' 
                        : message.type === 'error'
                        ? 'bg-[#FFE5E5] text-red-600 max-w-lg'
                        : 'bg-white shadow-lg'
                    }`}>
                      {message.type === 'ai' ? (
                        <img src={message.content} alt="Generated" className="max-w-full rounded-lg" />
                      ) : (
                        <p className="[font-family:'Gilroy-Regular',Helvetica] text-sm break-words">{message.content}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="fixed w-[584px] h-[118px] bottom-8 inset-x-0 mx-auto border border-solid border-black rounded-[16.63px]">
          {isLoading && (
            <div className="absolute -top-10 left-0 right-0 text-center text-black [font-family:'Gilroy-Medium',Helvetica]">
              Generating your image...
            </div>
          )}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            placeholder={isLoading ? "Please wait while the image is being generated..." : "Type your prompt here..."}
            className={`absolute w-[500px] top-4 left-[20px] bg-transparent border-none outline-none resize-none h-[80px] [font-family:'Gilroy-Regular',Helvetica] text-black placeholder-gray-600 scrollbar-hide ${
              isLoading ? 'cursor-not-allowed opacity-50' : ''
            }`}
          />
          <button onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className={`absolute w-[41px] h-[41px] top-[38px] right-4 border border-solid border-black rounded-full flex items-center justify-center ${
              isLoading || !prompt.trim() ? 'opacity-50 cursor-not-allowed' : 'hover'
            }`}>
            <img className="w-6 h-6"
              alt="Arrow up" 
              src="/img/arrow-up-02.svg"/>
          </button>
        </div>

        {pmOpen && (
          <div className="fixed inset-0 z-50"
            onClick={() => { setPmOpen(false); setPmUser(null); }}>
            <div className="absolute top-[93px] right-[292px] shadow-lg rounded-[20px] border border-black bg-[#f8faff]"
                 style={{ width: 300.38, minHeight: 438 }}
                 onClick={e => e.stopPropagation()}>
              {!pmUser ? (
                <PmMain onSelectUser={user => setPmUser(user)} />
              ) : (
                <PmPersonal user={pmUser} onBack={() => setPmUser(null)} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};