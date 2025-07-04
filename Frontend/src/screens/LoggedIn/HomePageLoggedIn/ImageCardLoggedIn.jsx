import React, { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { UserAvatar } from '../../../components/UserAvatar';
import { PmMain } from '../../../components/Pm/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal';

function formatLikes(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return num;
}

export const ImageCardLoggedIn = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const commentInputRef = useRef(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/posts/${id}`)
      .then(res => {
        console.log('Response data:', res.data);
        const postData = res.data.post || res.data;
        console.log('Image URL:', postData.imageUrl);
        setPost(postData);
        setLikes(Array.isArray(postData.likes) ? postData.likes.length : 0);

        const userId = localStorage.getItem('userId');
        if (userId && Array.isArray(postData.likes)) {
          setLiked(postData.likes.includes(userId));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading post:', err);
        setError("Error loading post");
        setLoading(false);
      });

    axios.get(`/api/posts/${id}/comments`)
      .then(res => {
        setComments(res.data);
      })
      .catch(err => {
        console.error('Error loading comments:', err);
      });

    axios.get('/api/csrf-token', { withCredentials: true })
      .then(res => setCsrfToken(res.data.csrfToken))
      .catch(err => console.error('CSRF token fetch error:', err));
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }
  if (!post) {
    return <div className="flex justify-center items-center h-screen">Пост не найден</div>;
  }

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', post.title || 'image.jpg');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download error');
    }
  };

  const handleCommentSend = async () => {
    if (!comment.trim()) return;
    setIsCommentLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `/api/posts/${id}/comments`,
        { text: comment.trim() },
        {
          headers: {
            'X-CSRF-Token': csrfToken,
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );
      setComments(prevComments => [response.data.comment, ...prevComments]);
      setComment("");
    } catch (error) {
      console.error('Error sending comment:', error);
      alert('Error sending comment');
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleCommentKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSend();
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `/api/posts/${id}/like`,
        {},
        {
          headers: {
            'X-CSRF-Token': csrfToken,
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );
      setLiked(response.data.liked);
      setLikes(response.data.totalLikes);
    } catch (error) {
      alert('Like Error');
    }
  };

  return (
    <div className="bg-[#f7faff] flex flex-row justify-center w-full min-h-screen h-full">
      <div className="bg-[#f7faff] w-[1440px] h-full relative">
        <div className="absolute w-[1440px] h-[93px] top-0 left-0">
          <img className="absolute w-[189px] h-12 top-[19px] left-[77px] object-cover"
               alt="Logo"
               src="/img/logo.png"/>
          <div className="inline-flex items-center justify-center gap-[15px] absolute top-[37px] left-[572px]">
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

        <div className="flex justify-center items-center mt-[60px] w-full pt-[32px]">
          <div className="flex items-center justify-center mr-[60px] mt-12">
            {post.imageUrl && (
              <img src={post.imageUrl}
                alt={post.title} 
                className="object-contain max-w-[750px] max-h-[500px] rounded-[30px] border border-black shadow-lg" 
                onError={(e) => {
                  console.error('Image load error:', e);
                  console.log('Failed to load image URL:', post.imageUrl);
                }}/>
            )}
          </div>
          <div className="flex flex-col items-start justify-center pt-[20px] self-center">
            <div className="[font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-4xl text-left tracking-[0] leading-[normal] mb-4">
              {post.title}
            </div>
            {post.filters && Object.entries(post.filters).map(([key, value]) => (
              <div key={key} className="[font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-xl text-left tracking-[0] leading-[normal] mb-3">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {String(value)}
              </div>
            ))}
            <div className="w-[261px] h-[54px] mt-5 flex flex-row items-center gap-3">
              <button
                onClick={handleDownload}
                className="w-[170px] h-[54px] bg-[#f8faff] rounded-xl border border-solid border-black flex items-center justify-center cursor-pointer">
                <span className="[font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">Download</span>
              </button>
              <button onClick={handleLike}
                className={`flex items-center px-3 py-2 rounded-xl border border-solid border-black bg-[#f8faff] ml-2 ${liked ? 'bg-pink-100' : ''}`}
                title={liked ? 'Unlike' : 'Like'}>
                <img src="/img/like-15.svg" alt="Like" className="w-[24px] h-[24px]" style={{ filter: liked ? 'invert(24%) sepia(99%) saturate(7472%) hue-rotate(329deg) brightness(97%) contrast(101%)' : 'none' }} />
                <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base">
                  {formatLikes(likes)}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-[700px] h-[170px] mt-[64px] rounded-[16.63px] border border-solid border-black relative flex items-center mx-auto"
          style={{ left: 30 }}>
          {isCommentLoading && (
            <div className="absolute -top-10 left-0 right-0 text-center text-black [font-family:'Gilroy-Medium',Helvetica]">
             Sending comment...
            </div>
          )}
          <textarea
            ref={commentInputRef}
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyPress={handleCommentKeyPress}
            disabled={isCommentLoading}
            placeholder={isCommentLoading ? "Please, wait..." : "Enter your comment..."}
            className={`w-full h-full bg-transparent border-none outline-none resize-none p-6 pr-16 [font-family:'Gilroy-Regular',Helvetica] text-black placeholder-gray-600 ${isCommentLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{ borderRadius: '16.63px' }}/>
          <button onClick={handleCommentSend}
            disabled={isCommentLoading || !comment.trim()}
            className={`absolute bottom-6 right-6 w-[41px] h-[41px] border border-solid border-black rounded-full flex items-center justify-center ${isCommentLoading || !comment.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg'}`}>
            <img className="w-6 h-6"
              alt="Arrow up" 
              src="/img/arrow-up-02.svg"/>
          </button>
        </div>

        <div className="flex flex-col items-center w-full mt-[20px]">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start mt-[40px]">
              <div className="w-[38px] h-[38px] bg-[#d9d9d9] rounded-full flex items-center justify-center mr-4 overflow-hidden">
                {comment.userId?.avatarUrl ? (
                  <img src={comment.userId.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"/>
                ) : (
                <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-[13px]">
                  {comment.userId?.username?.charAt(0) || 'A'}
                </div>
                )}
              </div>
              <div>
                <div className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-xl mb-2">
                  {comment.userId?.username || comment.userId?._id || 'User'}
                </div>
                <div className="w-[700px] border border-solid border-black rounded-[16.63px] p-4">
                  <p className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-sm">
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="w-full flex flex-col items-center mt-20 mb-8">
          <img className="w-[307px] h-[78px] object-cover mb-4" alt="Logo" src="/img/logo.png" />
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap mb-2">
            All rights recovered
          </div>
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            © 2025 DesignBase
          </div>
        </footer>
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