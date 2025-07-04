import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.includes('s3.eu-north-1.amazonaws.com')) {
    return `https://cors-anywhere.herokuapp.com/${url}`;
  }
  return url;
};

export const ImageCardNotLogged = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/posts/${id}`)
      .then(res => {
        const postData = res.data.post || res.data;
        setPost(postData);
        setLoading(false);
      })
      .catch(err => {
        setError("Error loading post");
        setLoading(false);
      });
    axios.get(`/api/posts/${id}/comments`)
      .then(res => {
        setComments(res.data);
      })
      .catch(err => {
        setError("Error loading comments");
      });
  }, [id]);

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }
  if (!post) {
    return <div className="flex justify-center items-center h-screen">Post not found</div>;
  }

  return (
    <div className="bg-[#f7faff] flex flex-row justify-center w-full min-h-screen h-full" data-model-id="67:47">
      <div className="bg-[#f7faff] w-[1440px] h-full relative">
        <header>
          <Link to="/">
            <img className="absolute w-[189px] h-12 top-[19px] left-[77px] object-cover" alt="Logo" src="/img/logo-1.png" />
          </Link>
          <nav className="inline-flex items-center justify-center gap-[15px] absolute top-[37px] left-[572px]">
            <Link to="/" className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Illustrations
            </Link>
            <Link to="/generate-image" className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Generate image
            </Link>
            <Link to="/remove-bg" className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Remove Bg
            </Link>
          </nav>
          <Link to="/signup" className="absolute top-9 left-[1196px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
            Sign up
          </Link>

          <div className="absolute w-[87px] h-[29px] top-8 left-[1275px]">
            <div className="relative w-[85px] h-[29px] bg-[#494949] rounded-[20px]">
              <Link to="/login" className="absolute w-11 top-[5px] left-[21px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-white text-base tracking-[0] leading-[normal] whitespace-nowrap">
                Log in
              </Link>
            </div>
          </div>
        </header>

        <div className="flex justify-center items-center w-full pt-[120px]">
          <div className="flex items-center justify-center mr-[60px] mt-12">
            {post.imageUrl && (
              <img src={post.imageUrl}
                alt={post.title} 
                className="object-contain max-w-[750px] max-h-[500px] rounded-[30px] border border-black shadow-lg" 
                onError={(e) => {
                  setImageError(true);
                }}/>
            )}
            {imageError && (
              <div className="text-red-500 text-center">
                Error loading image. Please refresh the page.
              </div>
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
            <div className="w-[261px] h-[54px] mt-5">
              <Link to="/login" className="w-[259px] h-[54px] bg-[#f8faff] rounded-xl border border-solid border-black flex items-center justify-center">
                <span className="[font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">Log in to Download</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center w-full mt-[40px]">
          {comments.length === 0 ? (
            <div className="mt-8 text-gray-500">No comments yet</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex items-start mt-[40px]">
                <div className="w-[38px] h-[38px] bg-[#d9d9d9] rounded-full flex items-center justify-center mr-4 overflow-hidden">
                  {comment.userId?.avatarUrl ? (
                    <img src={comment.userId.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                      onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}/>
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
                  <div className="w-[700px]  border border-solid border-black rounded-[16.63px] p-4">
                    <p className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-sm">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
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
      </div>
    </div>
  );
};
