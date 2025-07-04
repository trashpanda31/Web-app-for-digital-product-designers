import React from "react";
import {Link, useNavigate} from "react-router-dom";

export const SignUpOauth = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#f7faff] min-h-screen flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] h-[690px] relative">
        <div onClick={() => navigate(-1)}
             className="cursor-pointer absolute w-[39px] h-[38px] top-[137px] left-[106px] bg-[#f8faff] rounded-[19.5px/19px] border border-solid border-black">
          <img className="absolute w-6 h-6 top-1.5 left-[7px]"
               alt="Arrow left"
               src="/img/arrow-left-02.svg"/>
        </div>

        <h1 className="absolute top-[145px] left-[595px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-2xl text-center tracking-[0] leading-[normal]">
          Sign up to DesignBase
        </h1>

        <section className="oauth-options">
          <a href="https://localhost:443/api/auth/google"
             className="absolute w-[443px] h-[65px] top-56 left-[498px] bg-black rounded-[28px] flex items-center justify-start pl-[94px] pr-[40px]">
            <img className="w-9 h-9 object-cover mr-[20px]"
                 alt="Google icons"
                 src="/img/google-icons-09-512-1.png"/>
            <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-white text-xl tracking-[0] leading-[normal] whitespace-nowrap">
              Log in with Google
            </span>

          </a>
          <a href="https://localhost:443/api/auth/gitlab"
             className="absolute w-[443px] h-[65px] top-[319px] left-[498px] bg-black rounded-[28px] flex items-center justify-start pl-[94px] pr-[40px]">
            <img className="w-9 h-9 object-cover mr-[20px]"
                 alt="GitLab icon"
                 src="/img/gitlab-icon-1024x942-f30d1qro-1.png"/>
            <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-white text-xl tracking-[0] leading-[normal] whitespace-nowrap">
              Log in with GitLab
            </span>
          </a>
        </section>

        <div className="divider-section">
          <img className="w-[206px] left-[500px] absolute h-px top-[416px] object-cover"
               alt="Left divider"
               src="/img/line-1.svg"/>
          <div className="absolute top-[403px] left-[713px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-[#999999] text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            or
          </div>
          <img className="w-[198px] left-[741px] absolute h-px top-[416px] object-cover"
               alt="Right divider"
               src="/img/line-2.svg"/>
        </div>

        <Link to="/register"
              className="top-[448px] left-[498px] absolute w-[443px] h-[65px] bg-[#f8faff] border border-solid border-black rounded-[28px] flex items-center justify-center">
          <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            Continue with email
          </span>
        </Link>
      </div>
    </div>
  );
};
