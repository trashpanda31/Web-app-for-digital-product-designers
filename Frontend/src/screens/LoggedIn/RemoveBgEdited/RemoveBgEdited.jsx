import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserAvatar } from "../../../components/UserAvatar";
import { PmMain } from '../../../components/Pm/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal';

export const RemoveBgEdited = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);
  const [processedImageUrl, setProcessedImageUrl] = useState(() => {
    console.log("Initializing state with URL:", location.state?.processedImageUrl);
    return location.state?.processedImageUrl;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const currentObjectUrlRef = useRef(processedImageUrl);

  useEffect(() => {
    const newUrl = processedImageUrl;
    const previousUrl = currentObjectUrlRef.current;

    if (newUrl !== previousUrl) {
      console.log(`URL changed. Previous: ${previousUrl}, New: ${newUrl}`);
      if (previousUrl && previousUrl.startsWith('blob:')) {
        console.log("Revoking previous URL (sync effect):", previousUrl);
        URL.revokeObjectURL(previousUrl);
      }
      currentObjectUrlRef.current = newUrl;
    }
  }, [processedImageUrl]);

  useEffect(() => {
    if (!location.state?.processedImageUrl) {
      console.warn("Initial URL missing, redirecting.");
      navigate('/RemoveBG-logged-in');
    }

    return () => {
      const urlToRevokeOnUnmount = currentObjectUrlRef.current;
      if (urlToRevokeOnUnmount && urlToRevokeOnUnmount.startsWith('blob:')) {
        console.log("Revoking URL on unmount:", urlToRevokeOnUnmount);
        URL.revokeObjectURL(urlToRevokeOnUnmount);
      }
    };
  }, [navigate]);

  useEffect(() => {
    async function convertToBlobUrlIfNeeded() {
      if (!processedImageUrl) return;
      if (processedImageUrl.startsWith('blob:')) return;
      
      if (processedImageUrl.startsWith('data:image')) {
        try {
          const blob = await (await fetch(processedImageUrl)).blob();
          const url = URL.createObjectURL(blob);
          setProcessedImageUrl(url);
        } catch (e) {
          console.error('Error converting base64 to blob:', e);
        }
        return;
      }
      
      if (processedImageUrl.startsWith('http')) {
        try {
          const response = await fetch(processedImageUrl, {mode: 'cors'});
          if (!response.ok) throw new Error('Error loading image');
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setProcessedImageUrl(url);
        } catch (e) {
          console.error('Error converting http link to blob:', e);
        }
      }
    }
    convertToBlobUrlIfNeeded();
  }, []);

  const handleNewImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDownload = async () => {
    if (!processedImageUrl) return;
    try {
      if (processedImageUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = processedImageUrl;
        link.setAttribute('download', 'removed-background.png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(processedImageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'removed-background.png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download image. Please try again.");
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', file);
    const accessToken = localStorage.getItem("accessToken");
    const csrfToken = sessionStorage.getItem("csrfToken");

    try {
      const response = await fetch('/api/ai/remove-background', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
           try { errorMessage = await response.text(); } catch (textError) { /* Keep HTTP error */ }
        }
        throw new Error(errorMessage);
      }

      const imageBlob = await response.blob();
      if (imageBlob.type !== 'image/png') {
        throw new Error('Received unexpected file type from server.');
      }

      const newObjectURL = URL.createObjectURL(imageBlob);
      console.log("Created new Object URL:", newObjectURL);
      setProcessedImageUrl(newObjectURL);

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f7faff] min-h-screen flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] min-h-screen relative flex flex-col justify-center items-center pb-20">
        <header className="absolute w-[1440px] h-[93px] top-0 left-0">
          <img className="absolute w-[189px] h-12 top-[19px] left-[77px] object-cover"
              alt="Logo"
              src="/img/logo.png"/>
          <nav className="absolute top-10 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-[15px]">
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
          </nav>

          <img className="absolute w-6 h-6 top-[35px] left-[1268px] cursor-pointer z-50"
            alt="Message"
            src="/img/message-01.svg"
            onClick={() => setPmOpen(v => !v)}/>
          <UserAvatar />
        </header>

        <input type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: 'none' }}
            disabled={isLoading}/>

        <main className="flex flex-col items-center justify-center flex-grow w-full px-10 pt-48">
          <div className="flex flex-row items-start justify-center gap-24 w-full max-w-5xl mb-8">
            <div className="max-w-[70vw] max-h-[65vh] rounded-[20px] flex items-center justify-center overflow-hidden shadow-lg border-2 border-dashed border-gray-600 p-2 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23eee%22%20d%3D%22M0%200h10v10H0zM10%2010h10v10H10z%22%2F%3E%3C%2Fsvg%3E')]">
              {isLoading && (
                <span className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-2xl text-center p-5">
                  Processing...
                </span>
              )}
              {!isLoading && processedImageUrl && (
                <img src={processedImageUrl} alt="Processed Image" className="max-w-full max-h-full object-contain"/>
              )}
              {!isLoading && !processedImageUrl && (
                <span className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-gray-700 text-2xl text-center p-5">
                  Image Error or not found
                </span>
              )}           
            </div>

            <div className="flex flex-col gap-6 mt-[60px]">
              <div className="w-[302px] h-[241px] rounded-[20px] bg-[#e0e0e0] flex items-center justify-center shadow-lg">
                <button onClick={handleNewImageClick}
                  className="w-[174px] h-[50px] bg-white rounded-[15px] flex items-center justify-center cursor-pointer hover:bg-gray-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none"
                  disabled={isLoading}>
                  <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                    New image
                  </span>
                </button>
              </div>

              <button onClick={handleDownload}
                className="w-[161px] h-[49px] bg-[#f8faff] rounded-[15px] border border-solid border-black flex items-center justify-center hover:bg-gray-100 transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !processedImageUrl}>
                <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                  Download
                </span>
              </button>
            </div>
          </div>
        </main>
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
        {error && (
          <div className="absolute bottom-[30px] left-1/2 transform -translate-x-1/2 text-red-600 [font-family:'Gilroy-Medium',Helvetica] text-center px-4 py-2 bg-red-100 rounded shadow-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
