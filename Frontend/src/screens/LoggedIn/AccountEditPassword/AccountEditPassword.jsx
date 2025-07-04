import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAvatar } from "../../../components/UserAvatar";
import { useUserProfile } from "../../../hooks/useUserProfile";
import { PmMain } from '../../../components/Pm/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal';

export const AccountEditPassword = () => {
  const { userProfile, loading } = useUserProfile();
  const navigate = useNavigate();
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const errorTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (errorTimer.current) {
        clearTimeout(errorTimer.current);
      }
    };
  }, []);

  const showError = (message) => {
    setError(message);
    if (errorTimer.current) {
      clearTimeout(errorTimer.current);
    }
    errorTimer.current = setTimeout(() => {
      setError("");
    }, 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    if (errorTimer.current) {
      clearTimeout(errorTimer.current);
    }
    errorTimer.current = setTimeout(() => {
      setSuccess("");
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        showError("Please fill in all password fields");
        return;
      }

      const passwordPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordPattern.test(formData.newPassword)) {
        showError("New password must be at least 8 characters long, contain at least one uppercase letter and one digit");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        showError("New passwords do not match");
        return;
      }

      if (formData.newPassword === formData.currentPassword) {
        showError("New password cannot be the same as your current password");
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
      const csrfToken = sessionStorage.getItem("csrfToken");

      const response = await fetch("/api/users/me/update-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to update password");
      }

      showSuccess("Password updated successfully. You will be logged out in 3 seconds...");

      setTimeout(async () => {
        try {
          const logoutResponse = await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-CSRF-Token': csrfToken,
            },
            credentials: 'include'
          });

          if (!logoutResponse.ok) {
            throw new Error("Logout failed");
          }

          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("csrfToken");

          if (window.fetchCsrfToken) {
            await window.fetchCsrfToken();
          }
          
          navigate("/login");
        } catch (error) {
          console.error("Error during logout:", error);
          navigate("/login");
        }
      }, 3000);

    } catch (err) {
      showError(err.message || "Failed to update password");
    }
  };

  return (
    <div className="bg-[#f7faff] flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] h-[1110px] relative">
        <div className="absolute w-[1440px] h-[93px] top-0 left-0">
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
            onClick={() => setPmOpen(v => !v)}/>
          <UserAvatar />
        </div>

        <div className="absolute w-[489px] h-24 top-[145px] left-[475px]">
          <div className="absolute -top-px left-[114px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-4xl tracking-[0] leading-[normal]">
            {loading ? "Loading..." : `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`}
          </div>

          <div className="absolute w-[87px] h-[87px] top-[9px] left-0 bg-[#d9d9d9] rounded-[43.29px] overflow-hidden">
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl}
                alt="Profile" 
                className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center [font-family:'Gilroy-Medium',Helvetica] text-[29.5px]">
                {userProfile?.firstName?.[0]}
              </div>
            )}
          </div>

          <div className="absolute w-[374px] h-[21px] top-[61px] left-[115px]">
            <Link to="/account/edit"
                  className="absolute w-[85px] -top-px left-0 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
              General
            </Link>
            <Link to="/account/edit/personal"
                  className="absolute w-[85px] top-0 left-[138px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap cursor-pointer">
              Personal
            </Link>
            <Link to="/account/edit/password"
                  className="absolute w-[98px] top-0 left-[276px] [font-family:'Gilroy-Bold',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap cursor-pointer">
              Password
            </Link>
          </div>
        </div>

        {(error || success) && (
          <div className="absolute w-full top-[275px] left-0 flex justify-center">
            <div className={`px-4 py-2 rounded-md ${error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} [font-family:'Gilroy-Medium',Helvetica]`}>
              {error || success}
            </div>
          </div>
        )}

        <div className="absolute w-[571px] h-[105px] top-[310px] left-[427px]">
          <div className="absolute -top-px left-0 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">
            Current password
          </div>
          <input type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="absolute w-[571px] h-16 top-[41px] left-0 bg-[#f8faff] rounded-[15px] border border-solid border-black px-6 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl"
            placeholder="Enter current password"/>
        </div>

        <div className="absolute w-[571px] h-[105px] top-[441px] left-[427px]">
          <div className="absolute -top-px left-0 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">
            New password
          </div>
          <input type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="absolute w-[571px] h-16 top-[41px] left-0 bg-[#f8faff] rounded-[15px] border border-solid border-black px-6 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl"
            placeholder="Enter new password" />
        </div>

        <div className="absolute w-[571px] h-[105px] top-[572px] left-[427px]">
          <div className="absolute -top-px left-0 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">
            Confirm new password
          </div>
          <input type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="absolute w-[571px] h-16 top-[41px] left-0 bg-[#f8faff] rounded-[15px] border border-solid border-black px-6 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl"
            placeholder="Confirm new password"/>
        </div>

        <button onClick={handleSave}
          className="absolute w-[125px] h-[43px] top-[722px] left-[873px] bg-[#d9d9d9] rounded-[20px] cursor-pointer outline-none border-none">
          <div className="absolute top-[11px] left-11 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal] whitespace-nowrap">
            Save
          </div>
        </button>

        <div className="absolute w-[1440px] h-72 top-[822px] left-0">
          <img className="absolute w-[307px] h-[78px] top-16 left-[566px] object-cover"
            alt="Logo"
            src="/img/logo-1.png"/>
          <div className="absolute top-40 left-[576px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            All rights recovered
          </div>
          <div className="absolute top-[198px] left-[576px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            © 2025 DesignBase
          </div>
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
