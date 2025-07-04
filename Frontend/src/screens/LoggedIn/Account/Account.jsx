import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAvatar } from "../../../components/UserAvatar";
import { useUserProfile } from "../../../hooks/useUserProfile";
import NewPost from "../NewPost/NewPost";
import { PmMain } from '../../../components/Pm/PmMain/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal/PmPersonal';


export const Account = () => {
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const { userProfile, loading } = useUserProfile();
  const navigate = useNavigate();
  const { setUserProfile } = useUserProfile();
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);

  const [userPosts, setUserPosts] = useState([]);
  const fetchUserPosts = () => {
    const accessToken = localStorage.getItem("accessToken");
    fetch("/api/posts/my", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => setUserPosts(data))
      .catch(err => console.error("Ошибка загрузки постов:", err));
  };

  useEffect(() => {
    fetchUserPosts();
  }, []);

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const csrfToken = sessionStorage.getItem("csrfToken");

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUserProfile(null);
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("csrfToken");
      if (window.fetchCsrfToken) {
        await window.fetchCsrfToken();
      }
      
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handlePostClick = (post) => {
    setEditingPost(post);
    setShowNewPost(true);
  };

  const handlePostUpdated = async () => {
    setEditingPost(null);
    await fetchUserPosts();
    setShowNewPost(false);
  };

  return (
    <div className="bg-[#f7faff] flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] min-h-screen relative pb-24">
        <header className="w-[1440px] h-[93px] top-0 left-0">
          <img className="w-[189px] h-12 top-[19px] left-[77px] absolute object-cover"
              alt="Logo"
              src="/img/logo-1.png"/>
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
        </header>

        <section className="absolute w-[366px] h-[89px] top-[167px] left-[537px]">
          <div className="w-[85px] h-[85px] top-1 left-0 rounded-[42.5px] absolute bg-[#d9d9d9] overflow-hidden">
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl}
                alt="Profile" 
                className="w-full h-full object-cover" />
            ) : (
              <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-[28.9px] flex items-center justify-center h-full">
                {userProfile?.firstName?.[0] || 'A'}
              </div>
            )}
          </div>

          <div className="absolute -top-px left-[109px] flex flex-col gap-[15px]">
            <div className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-4xl whitespace-nowrap">
              {loading ? "Loading..." : `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`}
            </div>
            <div className="flex gap-4">
              <Link to="/account/edit">
                <button className="all-[unset] w-[111px] h-[34px] bg-[#d9d9d9] rounded-[18px] flex items-center justify-center">
                  <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base">
                    Edit Profile
                  </span>
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="all-[unset] w-[111px] h-[34px] bg-[#d9d9d9] rounded-[18px] flex items-center justify-center cursor-pointer">
                <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base">
                  Exit
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-[24px] mt-[250px] px-20">
          <div className="w-[411px] h-[322px]">
            <div className="relative w-[413px] h-[324px] -top-px -left-px bg-[#f0eeee] rounded-xl border border-dashed border-[#00000080] flex flex-col items-center justify-center">
              <img className="w-[75px] h-[75px] mb-4"
                alt="Upload illustration"
                src="/img/upload-icon.svg"/>
              <h2 className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-2xl mb-4">
                Upload your illustration
              </h2>
              <p className="w-[339px] [font-family:'Gilroy-Regular-☞',Helvetica] font-normal text-black text-base text-center mb-6">
                Show off your best work. Get feedback, likes and be a part of a growing community
              </p>
              <button
                className="all-[unset] w-[201px] h-[43px] bg-[#d9d9d9] rounded-[20px] cursor-pointer"
                onClick={() => {
                  setEditingPost(null);
                  setShowNewPost(true);
                }}>
                <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base text-center">
                  Upload
                </div>
              </button>
            </div>
          </div>
          {userPosts.map(post => (
            <div key={post._id}
              className="w-[410px] h-[322px] rounded-xl bg-[#e0e0e0] flex items-center justify-center overflow-hidden relative group cursor-pointer"
              onClick={() => handlePostClick(post)}>
              <img src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"/>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end">
                <div className="w-full p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white text-lg font-medium truncate">{post.title}</h3>
                </div>
              </div>
            </div>
          ))}
          {userPosts.length < 5 &&
            Array.from({ length: 5 - userPosts.length }).map((_, i) => (
              <div key={`placeholder-${i}`}
                className="w-[410px] h-[322px] rounded-xl [background:linear-gradient(180deg,rgba(210,210,210,1)_0%,rgba(235,235,235,1)_100%)]" />
            ))
          }
        </section>

        <footer className="w-[1440px] h-72 flex flex-col items-center justify-center mt-2">
          <img className="w-[307px] h-[78px] mb-6"
            alt="DesignBase Logo"
            src="/img/logo.png"/>
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-4">
            All rights recovered
          </div>
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl">
            © 2025 DesignBase
          </div>
        </footer>

        {showNewPost && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div>
              <NewPost 
                onClose={() => {
                  setShowNewPost(false);
                  setEditingPost(null);
                }} 
                onPostCreated={async () => {
                  await fetchUserPosts();
                  setShowNewPost(false);
                }}
                editingPost={editingPost}
                onPostUpdated={handlePostUpdated}
              />
            </div>
          </div>
        )}

        {pmOpen && (
          <div
            className="fixed inset-0 z-50"
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

export default Account;