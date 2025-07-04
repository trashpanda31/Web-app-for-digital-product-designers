import React from "react";
import { Link } from "react-router-dom";

export const RemoveBgNonLogged = () => {
  return (
    <div className="bg-[#f7faff] min-h-screen flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] h-[720px] relative">
        <header className="absolute w-[1440px] h-[93px] top-0 left-0">
          <img className="absolute w-[189px] h-12 top-[19px] left-[77px] object-cover"
              alt="Logo"
              src="/img/logo.png"/>

          <nav className="inline-flex items-center justify-center gap-[15px] absolute top-[37px] left-[572px]">
            <Link to="/" className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Illustrations
            </Link>
            <Link to="/generate-image"
                  className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Generate image
            </Link>
            <Link to="/remove-bg"
                  className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Remove Bg
            </Link>
          </nav>
          <Link to="/signup" className="absolute w-11 top-[37px] left-[1196px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
            Sign up
          </Link>
          <div className="absolute w-[87px] h-[29px] top-8 left-[1275px]">
            <div className="relative w-[85px] h-[29px] bg-[#494949] rounded-[20px]">
              <Link to="/login"
                    className="absolute w-11 top-[5px] left-[21px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-white text-base tracking-[0] leading-[normal] whitespace-nowrap">
                Login
              </Link>
            </div>
          </div>
        </header>

        <main>
          <p className="absolute w-[533px] top-[160px] left-[453px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-5xl text-center tracking-[0] leading-[normal]">
            Hello! I'm your AI-image background remover
          </p>
          <p className="absolute w-[528px] top-[320px] left-[456px] [font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-2xl text-center tracking-[0] leading-[normal]">
            You must be logged in to use this function
          </p>
          <div className="auth-buttons">
            <Link to="/login">
              <img className="absolute w-[451px] h-[73px] top-[410px] left-[494px]"
                  alt="Log in button"
                  src="/img/log-in-button.png"/>
            </Link>
            <Link to="/signup">
              <img className="absolute w-[443px] h-[65px] top-[500px] left-[498px]"
                alt="Sign up button"
                src="/img/sign-up-button.png"/>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};
