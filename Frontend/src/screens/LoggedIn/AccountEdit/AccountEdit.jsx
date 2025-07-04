import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAvatar } from "../../../components/UserAvatar";
import { useUserProfile } from "../../../hooks/useUserProfile";
import { PmMain } from '../../../components/Pm/PmMain/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal/PmPersonal';

export const AccountEdit = () => {
  const { userProfile, loading, error: profileError, setUserProfile } = useUserProfile();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);

  const errorTimer = useRef(null);
  const successTimer = useRef(null);


  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username);
    }
  }, [userProfile]);

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
    if (successTimer.current) {
      clearTimeout(successTimer.current);
    }
    successTimer.current = setTimeout(() => {
      setSuccess("");
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const accessToken = localStorage.getItem("accessToken");
      const csrfToken = sessionStorage.getItem("csrfToken");
      
      const response = await fetch("/api/users/me/update-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Server error response:', text);
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      const timestamp = new Date().getTime();
      const newAvatarUrl = `${data.avatarUrl}?t=${timestamp}`;
      setUserProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      showSuccess("Avatar uploaded successfully");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showError(error.message || "Failed to upload avatar");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const csrfToken = sessionStorage.getItem("csrfToken");

      const response = await fetch("/api/users/me/delete-avatar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Server error response:', text);
        throw new Error('Failed to delete avatar');
      }

      const data = await response.json();
      setUserProfile(prev => ({ ...prev, avatarUrl: null }));
      showSuccess("Avatar deleted successfully");
    } catch (error) {
      console.error("Error deleting avatar:", error);
      showError(error.message || "Failed to delete avatar");
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      showError("Please enter a new email");
      return;
    }

    if (!userProfile?.isOAuth && (!password || !confirmPassword)) {
      showError("Please fill in all fields");
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      const csrfToken = sessionStorage.getItem("csrfToken");
      
      const requestBody = {
        newEmail,
        ...(userProfile?.isOAuth ? {} : {
          currentPassword: password,
          confirmPassword: confirmPassword
        })
      };

      const response = await fetch("/api/users/me/update-email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update email");
      }

      showSuccess("Email updated successfully");
      setUserProfile(prev => ({ ...prev, email: newEmail }));
      setNewEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsEditingEmail(false);
    } catch (error) {
      console.error("Error updating email:", error);
      showError(error.message || "Failed to update email");
    }
  };

  return (
    <div className="bg-[#f7faff] flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] relative min-h-screen">
        <input type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleAvatarUpload}/>

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

          <img
            className="absolute w-6 h-6 top-[35px] left-[1268px] cursor-pointer z-50"
            alt="Message"
            src="/img/message-01.svg"
            onClick={() => setPmOpen(v => !v)} />
          <UserAvatar />
        </div>

        <div className="absolute w-[489px] h-24 top-[142px] left-[475px]">
          <div className="absolute -top-px left-[114px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-4xl tracking-[0] leading-[normal]">
            {loading ? "Loading..." : `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`}
          </div>

          <div className="w-[87px] h-[87px] top-[9px] left-0 rounded-[43.29px] absolute bg-[#d9d9d9] overflow-hidden">
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
                className="absolute w-[85px] -top-px left-0 [font-family:'Gilroy-Bold',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
              General
            </Link>

            <Link to="/account/edit/personal"
                className="absolute w-[85px] top-0 left-[138px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap cursor-pointer">
              Personal
            </Link>

            {!userProfile?.isOAuth && (
              <Link to="/account/edit/password"
                  className="absolute w-[98px] top-0 left-[276px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap cursor-pointer">
                Password
              </Link>
            )}
          </div>
        </div>

        <div className="absolute w-[110px] h-[110px] top-[302px] left-[441px] bg-[#d9d9d9] rounded-[55.02px] overflow-hidden">
          {userProfile?.avatarUrl ? (
            <img src={userProfile.avatarUrl}
              alt="Profile" 
              className="w-full h-full object-cover"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center [font-family:'Gilroy-Medium',Helvetica] text-[37.5px]">
              {userProfile?.firstName?.[0]}
            </div>
          )}
        </div>

        <button onClick={() => fileInputRef.current?.click()}
          className="absolute w-56 h-[43px] top-[335px] left-[593px] cursor-pointer all-[unset] bg-[#d9d9d9] rounded-[20px] z-10">
          <div className="absolute top-[11px] left-[41px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal] whitespace-nowrap">
            Upload new avatar
          </div>
        </button>

        <button 
          onClick={handleDeleteAvatar}
          className="absolute top-[335px] left-[841px] cursor-pointer all-[unset] w-[182px] h-[43px] bg-[#d9d9d9] rounded-[20px]">
          <div className="absolute top-[11px] left-10 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal] whitespace-nowrap">
            Delete avatar
          </div>
        </button>

        <div className="w-[571px] mx-auto pt-[432px] space-y-4">
          <div className="w-full">
            <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-2">
              Username
            </div>
            <div className="w-full h-16 bg-[#f8faff] rounded-[15px] border border-solid border-black flex items-center px-6">
              <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl">
                {userProfile?.username || ''}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-2">
              E-mail
            </div>
            <div className="w-full h-16 bg-[#f8faff] rounded-[15px] border border-solid border-black flex items-center px-6">
              <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl">
                {userProfile?.email || ''}
              </div>
            </div>
          </div>

          <div className="w-full">
            <button
              onClick={() => setIsEditingEmail(true)}
              className={`w-[182px] h-[43px] bg-[#d9d9d9] rounded-[20px] cursor-pointer mt-8 all-[unset] ${isEditingEmail ? 'hidden' : 'block'}`}>
              <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base text-center">
                Change E-mail
              </div>
            </button>

            {isEditingEmail && (
              <div className="w-[571px] mx-auto space-y-4 mt-4">
                <div className="w-full">
                  <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-2">
                    New E-mail
                  </div>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full h-16 bg-[#f8faff] rounded-[15px] border border-solid border-black px-6 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl"
                    placeholder="Enter new email"
                  />
                </div>

                {!userProfile?.isOAuth && (
                  <>
                    <div className="w-full">
                      <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-2">
                        Current Password
                      </div>
                      <input type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-16 bg-[#f8faff] rounded-[15px] border border-solid border-black px-6 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl"
                        placeholder="Enter current password"/>
                    </div>

                    <div className="w-full">
                      <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-2">
                        Confirm Password
                      </div>
                      <input type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-16 bg-[#f8faff] rounded-[15px] border border-solid border-black px-6 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl"
                        placeholder="Confirm current password"/>
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-4 mt-4">
                  <button onClick={() => {
                      setIsEditingEmail(false);
                      setNewEmail("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-[125px] h-[43px] bg-[#d9d9d9] rounded-[20px] cursor-pointer all-[unset]">
                    <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base text-center">
                      Cancel
                    </div>
                  </button>
                  <button onClick={handleUpdateEmail}
                    className="w-[125px] h-[43px] bg-[#d9d9d9] rounded-[20px] cursor-pointer all-[unset]">
                    <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base text-center">
                      Save
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {(error || success) && (
          <div className="absolute w-full top-[280px] left-0 flex justify-center">
            <div className={`px-4 py-2 rounded-md ${error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} [font-family:'Gilroy-Medium',Helvetica]`}>
              {error || success}
            </div>
          </div>
        )}

        <div className={`w-full mt-[60px] mb-[32px] flex flex-col items-center justify-center transition-all duration-300`}>
          <img className="w-[307px] h-[78px] mb-6"
            alt="Logo"
            src="/img/logo-1.png"/>
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-2">
            All rights recovered
          </div>
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl">
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

export default AccountEdit;