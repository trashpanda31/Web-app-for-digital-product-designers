import { useRef, useState, useEffect } from 'react';
import axios from 'axios';

export function useGoogleImageSearch() {
  const fileInputRef = useRef(null);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return { fileInputRef, isLoading, handleGoogleIconClick, handleFileChange };
} 