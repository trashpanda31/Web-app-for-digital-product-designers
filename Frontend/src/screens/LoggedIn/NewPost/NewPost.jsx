import React, { useState, useRef, useEffect } from "react";
import { FilterPanel } from "../../../components/FilterPanel/FilterPanel";
import axios from 'axios';

window.axios = axios;

export const NewPost = ({ onClose, onPostCreated, editingPost, onPostUpdated }) => {
  const [title, setTitle] = useState(editingPost?.title || "");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(editingPost?.imageUrl || null);
  const [tags, setTags] = useState(editingPost?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [filters, setFilters] = useState(editingPost?.filters || {});
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);
  const fileInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({
    title: "",
    image: "",
    tags: "",
    submit: ""
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const [deleteActive, setDeleteActive] = useState(false);
  const deleteTimerRef = useRef(null);

  useEffect(() => {
    fetchCsrfToken();
    if (editingPost) {
      setTitle(editingPost.title);
      setImagePreview(editingPost.imageUrl);
      setTags(editingPost.tags || []);
      setFilters(editingPost.filters || {});
    }
  }, [editingPost]);
  
  useEffect(() => {
    if (showDeleteConfirm && deleteCountdown > 0) {
      deleteTimerRef.current = setTimeout(() => {
        setDeleteCountdown(c => c - 1);
      }, 1000);
    } else if (showDeleteConfirm && deleteCountdown === 0) {
      setShowDeleteConfirm(false);
      setDeleteActive(false);
    }
    return () => clearTimeout(deleteTimerRef.current);
  }, [showDeleteConfirm, deleteCountdown]);

  useEffect(() => {
    if (showDeleteConfirm && deleteCountdown === 10) {
      setDeleteActive(true);
    }
    if (showDeleteConfirm && deleteCountdown === 0) {
      setDeleteActive(false);
      setShowDeleteConfirm(false);
    }
  }, [deleteCountdown, showDeleteConfirm]);

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
        console.log('CSRF token received:', data.csrfToken);
      } else {
        console.error('CSRF token not found in response');
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  };

  const getCsrfToken = () => {
    const possibleNames = ['XSRF-TOKEN', 'X-CSRF-TOKEN'];
    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (const name of possibleNames) {
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            console.log(`Found token in cookie ${name}:`, cookieValue);
            return cookieValue;
          }
        }
      }
    }
    return cookieValue;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors(prev => ({ ...prev, image: "File size should not exceed 5MB" }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setValidationErrors(prev => ({ ...prev, image: "Please upload an image file" }));
      return;
    }

    setValidationErrors(prev => ({ ...prev, image: "" }));
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && currentTag.trim() && tags.length < 10) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !tags.length) {
      setValidationErrors({ title: '', image: '', tags: '', submit: 'Missing required field(s)' });
      return;
    }
    setValidationErrors({ title: '', image: '', tags: '', submit: '' });
    try {
      setIsLoading(true);
      const formData = new FormData();
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      formData.append('title', title);
      console.log('Перед отправкой:', { tags, filters });
      tags.forEach(tag => formData.append('tags', tag));
      formData.append('filters', JSON.stringify(filters && Object.keys(filters).length ? filters : {}));

      if (editingPost) {
        const response = await window.axios.put(`/api/posts/${editingPost._id}`, formData, {
          headers: {
            ...(csrfToken ? { 'CSRF-Token': csrfToken } : {}),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          withCredentials: true,
        });
        console.log('Post updated successfully:', response.data);
        if (onPostUpdated) onPostUpdated();
      } else {
        const response = await window.axios.post('/api/posts/create', formData, {
          headers: {
            ...(csrfToken ? { 'CSRF-Token': csrfToken } : {}),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          withCredentials: true,
        });
        console.log('Post created successfully:', response.data);
        if (onPostCreated) onPostCreated();
      }
      onClose();
    } catch (error) {
      if (error.response) {
        const data = error.response.data;
        if (data.errors && Array.isArray(data.errors)) {
          // Показываем только общее сообщение в submit
          setValidationErrors(prev => ({
            ...prev,
            submit: data.message || 'Missing required field(s)'
          }));
        } else {
          setValidationErrors(prev => ({
            ...prev,
            submit: data?.message || `Failed to ${editingPost ? 'update' : 'create'} post. See console for details.`
          }));
        }
      } else {
        setValidationErrors(prev => ({
          ...prev,
          submit: error.message || `Failed to ${editingPost ? 'update' : 'create'} post. Please try again.`
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteCountdown(15);
    setDeleteActive(false);
  };

  const handleDeleteYes = async () => {
    if (!editingPost) return;
    setIsLoading(true);
    try {
      await window.axios.delete(`/api/posts/${editingPost._id}`, {
        headers: {
          ...(csrfToken ? { 'CSRF-Token': csrfToken } : {}),
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        withCredentials: true,
      });
      if (onPostUpdated) onPostUpdated();
      onClose();
    } catch (error) {
      setValidationErrors(prev => ({
        ...prev,
        submit: error.response?.data?.message || 'Failed to delete post.'
      }));
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setDeleteActive(false);
      setDeleteCountdown(0);
    }
  };

  return (
    <div className="bg-[#f8faff] rounded-[23px] flex flex-row justify-center w-full">
      <div className="bg-[#f8faff] border border-solid border-black w-[1164px] h-[566px] rounded-[22.7px] relative">
        <img onClick={onClose}
          className="absolute w-[34px] h-[34px] top-4 left-[18px] cursor-pointer"
          alt="Multiplication sign"
          src="/img/multiplication-sign.svg"/>

        <div className="absolute w-[411px] h-[39px] top-[39px] left-[376px] bg-[#f8faff] rounded-[10.9px] border-[0.91px] border-solid border-black">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            className="absolute w-full h-full px-6 bg-transparent border-none outline-none [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-[18.2px]"
            placeholder="Title your post"
          />
        </div>

        <div className="absolute w-[499px] h-[403px] top-[111px] left-[71px] rounded-[23px] flex items-center justify-center cursor-pointer relative"
          onClick={() => fileInputRef.current?.click()}>
          {imagePreview ? (
            <>
              <img src={imagePreview}
                alt="Preview" 
                className="max-w-[499px] max-h-[403px] object-contain rounded-[23px] border border-solid border-black"/>
              <img onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute w-[28px] h-[28px] top-[-5px] right-[-14px] cursor-pointer z-10"
                alt="Delete image"
                src="/img/multiplication-sign.svg"/>
            </>
          ) : (
            <div className="w-full h-full rounded-[23px] border border-dashed border-black">
              <img className="absolute w-[68px] h-[68px] top-[94px] left-[214px]"
                alt="Upload icon"
                src="/img/upload-icon.svg"/>
              <div className="absolute w-[233px] top-[171px] left-[132px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-[21.8px] tracking-[0] leading-[normal] whitespace-nowrap">
                Upload your illustration
              </div>
              <p className="absolute w-[308px] top-[211px] left-[94px] [font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-[14.5px] text-center tracking-[0] leading-[normal]">
                Show off your best work. Get feedback, likes and be a part of a growing community
              </p>
              <button className="all-[unset] box-border absolute w-[183px] h-[39px] top-[269px] left-[157px] bg-[#f8faff] rounded-[18px] border-[1px] border-solid border-black">
                <div className="absolute top-[9px] left-[65px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-[14.5px] text-center tracking-[0] leading-[normal]">
                  Upload
                </div>
              </button>
            </div>
          )}
          {validationErrors.image && (
            <div className="absolute left-0 -bottom-8 w-full text-sm text-red-500 [font-family:'Gilroy-Medium',Helvetica] bg-white px-2 py-1 rounded-md shadow-sm text-center">
              {validationErrors.image}
            </div>
          )}
          <input type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"/>
        </div>

        <div className="absolute top-[135px] left-[616px] flex gap-4">
          <FilterPanel
            containerClassName="flex gap-4 flex-wrap w-[385px]"
            buttonClassName="w-[109px] h-[39px] flex items-center justify-center"
            textClassName="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm"
            onFilterChange={setFilters}
            initialFilters={editingPost?.filters}
            shouldPersistFilters={false}/>
        </div>

        <div className="absolute w-[109px] h-[39px] top-[301px] left-[616px]">
          <input type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={handleTagInput}
            className="w-full h-full px-4 bg-[#d9d9d9] rounded-[14px] border-none outline-none [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm text-center"
            placeholder="#Tags"/>
        </div>

        <div className="absolute top-[349px] left-[616px] flex flex-wrap gap-x-[24px] gap-y-[15px] w-[385px]">
          {tags.map((tag, index) => (
            <div key={index} className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal] cursor-pointer"
                 onClick={() => setTags(tags.filter((_, i) => i !== index))}>
              {tag}
            </div>
          ))}
        </div>

        <button onClick={handleSave}
          disabled={isLoading}
          className={`absolute w-[165px] h-[46px] top-[447px] left-[616px] bg-[#f8faff] rounded-xl overflow-hidden border border-solid border-black cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
          <div className="absolute top-[9px] left-[61px] [font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">
            {isLoading ? 'Saving...' : (editingPost ? 'Save' : 'Post')}
          </div>
        </button>
        {editingPost && (
          <div className="absolute top-[447px] left-[840px]" style={{ width: '165px', height: '46px', position: 'absolute' }}>
            {showDeleteConfirm && (
              <div style={{ position: 'absolute', top: '-22px', left: 0, width: '100%', textAlign: 'center' }} className="mb-1 text-red-600 text-sm font-semibold">Are you sure?</div>
            )}
            <button
              onClick={showDeleteConfirm && deleteActive ? handleDeleteYes : handleDeleteClick}
              disabled={isLoading || (showDeleteConfirm && !deleteActive)}
              className={`w-[165px] h-[46px] bg-[#f8faff] rounded-xl overflow-hidden border border-solid border-black cursor-pointer flex items-center justify-center [font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap ${isLoading || (showDeleteConfirm && !deleteActive) ? 'opacity-50' : ''}`}>
              {showDeleteConfirm
                ? deleteActive
                  ? `Yes${deleteCountdown > 0 ? ` (${deleteCountdown})` : ''}`
                  : `Delete (${deleteCountdown > 10 ? deleteCountdown - 10 : 0})`
                : 'Delete'}
            </button>
          </div>
        )}
        {validationErrors.submit && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[510px] w-[400px] text-center text-sm text-red-500 [font-family:'Gilroy-Medium',Helvetica] bg-white px-2 py-1 rounded-md shadow-sm">
            {validationErrors.submit}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPost;
