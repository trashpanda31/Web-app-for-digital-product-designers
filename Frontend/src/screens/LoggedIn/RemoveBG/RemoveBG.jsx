import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAvatar } from "../../../components/UserAvatar";
import { useGoogleImageSearch } from '../../../components/SearchBar/useGoogleImageSearch';
import { PmMain } from '../../../components/Pm/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal';

export const RemoveBG = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { fileInputRef: googleFileInputRef, isLoading: isGoogleLoading, handleGoogleIconClick, handleFileChange } = useGoogleImageSearch();
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleUploadFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      handleUpload(file);
    } else {
      setSelectedFile(null);
      setError("Please select a valid image file.");
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          try {
            errorMessage = await response.text();
          } catch (textError) {
            // Keep the original HTTP error message
          }
        }
        throw new Error(errorMessage);
      }

      const imageBlob = await response.blob();
      
      if (imageBlob.type !== 'image/png') {
        console.error('Unexpected blob type received:', imageBlob.type);
        throw new Error('Received unexpected file type from server.');
      }

      // Преобразуем blob в base64
      const toBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const base64 = await toBase64(imageBlob);

      // Navigate to the edited page with the processed image base64
      navigate('/RemoveBG-edited', { 
        state: { 
          processedImageUrl: base64,
          fromRemoveBG: true, // Flag to indicate this is a fresh upload
          timestamp: Date.now() // Add timestamp to ensure state change is detected
        } 
      });

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="bg-[#f7faff] min-h-screen flex flex-row justify-center w-full">
      <div className="bg-[#f7faff] w-[1440px] min-h-[720px] relative pb-20">
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

          <img
            className="absolute w-6 h-6 top-[35px] left-[1268px] cursor-pointer z-50"
            alt="Message"
            src="/img/message-01.svg"
            onClick={() => setPmOpen(v => !v)}
          />
          <UserAvatar />
        </header>

        <main className="pt-[150px] flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 px-10 md:px-20 min-h-[calc(100vh-93px)]">
          <div className="w-full md:w-auto text-center md:text-left">
              <p className="w-full md:w-[390px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-4xl md:text-5xl tracking-[0] leading-[1.2em]">
                  Remove Bg <br/>
                  Ai Background Remover
              </p>
          </div>

          <div className="w-full max-w-[496px] h-[383px] rounded-[30.24px] [background:linear-gradient(180deg,rgba(230,230,230,1)_0%,rgba(197,191,191,1)_100%)] flex items-center justify-center p-5">
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={isLoading}
              />
              <button
                  onClick={handleUploadClick}
                  className="w-[247px] h-[73px] bg-white rounded-[18.15px] flex items-center justify-center cursor-pointer hover:bg-gray-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none"
                  disabled={isLoading}
              >
                  <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-[24.2px] tracking-[0] leading-[38.1px] whitespace-nowrap">
                      {isLoading ? 'Uploading...' : 'Upload image'}
                  </span>
              </button>
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
          <div className="absolute bottom-[60px] left-1/2 transform -translate-x-1/2 text-red-600 [font-family:'Gilroy-Medium',Helvetica] text-center">
            {error}
          </div>
        )}

      </div>
    </div>
  );
};