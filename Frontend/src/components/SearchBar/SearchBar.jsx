import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

export const SearchBar = ({ value, onChange, onImageHashSearch }) => {
  const fileInputRef = useRef(null);
  const hashFileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get('/api/csrf-token');
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  const handleGoogleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsLoading(true);

      const response = await axios.post('/api/posts/search-google', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRF-Token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });

      if (response.data.redirectUrl) {
        window.open(response.data.redirectUrl, '_blank');
      } else {
        console.error('No redirectUrl in response:', response.data);
      }
    } catch (error) {
      console.error('Error uploading image for Google search:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleHashFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (onImageHashSearch) onImageHashSearch(file);
    if (hashFileInputRef.current) hashFileInputRef.current.value = '';
  };

  return (
    <div className="relative">
      <input type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"/>

      <input type="file"
        ref={hashFileInputRef}
        onChange={handleHashFileChange}
        accept="image/*"
        className="hidden"/>

      <div className="w-[501px] h-[49px] bg-[#dbdde2] rounded-[36px] relative flex items-center">
        <img className="absolute w-[23px] h-[27px] top-1.5 left-4"
          alt="Search"
          src="/img/search.svg"/>

        <input type="text"
          value={value}
          onChange={onChange}
          placeholder="Search photos and illustrations"
          className="absolute top-0 left-[53px] w-[360px] h-full bg-transparent border-none outline-none [font-family:'Gilroy-Medium',Helvetica] text-[#000000a6] text-sm"
          style={{ background: 'none' }}/>

        <img className="absolute w-[23px] h-7 top-1.5 left-[432px] cursor-pointer"
          alt="By image hash"
          src="/img/by-image.svg"
          onClick={() => hashFileInputRef.current?.click()}/>

        <img className={`absolute w-[23px] h-[27px] top-[7px] left-[459px] cursor-pointer ${isLoading ? 'opacity-50' : ''}`}
          alt="Google"
          src="/img/google.svg"
          onClick={handleGoogleIconClick}
          style={{ pointerEvents: isLoading ? 'none' : 'auto' }}/>

      </div>
    </div>
  );
}; 