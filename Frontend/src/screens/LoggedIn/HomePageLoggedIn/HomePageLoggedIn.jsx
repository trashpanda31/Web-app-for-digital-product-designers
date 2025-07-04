import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "../../../components/UserAvatar";
import { FilterPanel } from "../../../components/FilterPanel/FilterPanel";
import { SortPanel } from "../../../components/SortPanel/SortPanel";
import { SearchBar } from "../../../components/SearchBar/SearchBar";
import axios from "axios";
import { PmMain } from '../../../components/Pm/PmMain/PmMain';
import { PmPersonal } from '../../../components/Pm/PmPersonal/PmPersonal';

export const HomePageLoggedIn = () => {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem('filterPanelFilters');
    return savedFilters ? JSON.parse(savedFilters) : {};
  });
  const [sort, setSort] = useState(() => {
    const savedSort = localStorage.getItem('homeSort');
    return savedSort || "recent";
  });
  const observer = useRef();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [isImageSearchActive, setIsImageSearchActive] = useState(false);
  const [imageFileName, setImageFileName] = useState("");
  const [pmOpen, setPmOpen] = useState(false);
  const [pmUser, setPmUser] = useState(null);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      localStorage.setItem('filterPanelFilters', JSON.stringify(filters));
    }
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('homeSort', sort);
  }, [sort]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [search, filters, sort]);

  const fetchPosts = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    let url = `/api/posts?limit=16&page=${pageToLoad}`;
    if (search) {
      if (search.startsWith('#')) {
        url = `/api/posts/filter?tags=${encodeURIComponent(search.slice(1))}&limit=16&page=${pageToLoad}`;
        if (sort) url += `&type=${sort}`;
      } else {
        url = `/api/posts/search?query=${encodeURIComponent(search)}&limit=16&page=${pageToLoad}`;
        if (sort) url += `&type=${sort}`;
      }
    } else if ((filters && Object.keys(filters).length > 0) || sort) {
      const params = new URLSearchParams({ ...filters, limit: 16, page: pageToLoad });
      if (sort) params.append('type', sort);
      url = `/api/posts/filter?${params.toString()}`;
    }
    try {
      const res = await axios.get(url);
      const data = res.data.posts || res.data;
      if (pageToLoad === 1) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 16);
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [search, filters, sort]);

  useEffect(() => {
    fetchPosts(page);
  }, [fetchPosts, page]);

  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  const contentShiftClass = isFiltersVisible ? 'translate-y-[92px]' : '';
  const transitionClass = 'transition-all duration-300 ease-in-out';

  const handleImageHashSearch = async (file) => {
    setImageSearchLoading(true);
    setIsImageSearchActive(true);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setImageFileName(file.name);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('/api/posts/search-images', formData, {
        headers: {
          'X-CSRF-Token': sessionStorage.getItem('csrfToken'),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      const data = res.data.results || [];
      setImageSearchResults(data);
      setHasMore(data.length === 16);
    } catch (e) {
      setImageSearchResults([]);
      setHasMore(false);
    } finally {
      setImageSearchLoading(false);
    }
  };


  const handleResetImageSearch = () => {
    setIsImageSearchActive(false);
    setImageSearchResults([]);
    setImageFileName("");
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
  };

  useEffect(() => {
    if (!search && !filters && !sort) {
      setIsImageSearchActive(false);
      setImageSearchResults([]);
    }
  }, [search, filters, sort]);

  return (
    <div className="bg-[#f7faff] flex flex-row justify-center w-full min-h-screen">
      <div className="bg-[#f7faff] overflow-hidden w-[1440px] min-h-screen relative">
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

        <div className="absolute w-[1280px] h-56 top-[185px] left-20">
          <p className="absolute w-[533px] top-[-22px] left-[373px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-[40px] text-center tracking-[0] leading-[normal]">
            Discover high-quality visuals for every creative need
          </p>

          <p className="absolute w-[486px] top-[111px] left-[397px] [font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal]">
            Explore a vast library of images, icons, and vectors — ready to
            elevate your next project.
          </p>

          <div className="absolute top-[175px] left-[389px] flex items-center gap-4">
            <SearchBar value={search} onChange={e => {
              setSearch(e.target.value);
              setIsImageSearchActive(false);
              setImageSearchResults([]);
              setImageFileName("");
            }} onImageHashSearch={handleImageHashSearch} />
            {isImageSearchActive && imageFileName && (
              <div
                className="flex items-center border border-black"
                style={{
                  borderRadius: '999px',
                  height: '32px',
                  paddingLeft: '10px',
                  paddingRight: '10px',
                  minWidth: '70px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: 400,
                  lineHeight: 1,
                  boxSizing: 'border-box',
                  gap: '8px',
                  boxShadow: 'none',
                  background: 'transparent',
                  border: '1px solid #000',
                }}>
                <span className="truncate max-w-[60px]" style={{fontFamily: 'inherit', fontSize: '13px'}}>{imageFileName}</span>
                <img
                  src="/img/multiplication-sign.svg"
                  alt="Сбросить поиск по изображению"
                  style={{ width: '18px', height: '18px', marginLeft: '6px', cursor: 'pointer' }}
                  onClick={handleResetImageSearch}/>
              </div>
            )}
          </div>

          <SortPanel 
            containerClassName="absolute top-[182px] left-0"
            buttonClassName="w-[109px] h-[42px] flex items-center justify-center"
            textClassName="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal] whitespace-nowrap"
            onSortChange={setSort}/>

          <div onClick={toggleFilters}
            className="absolute w-[109px] h-[42px] top-[182px] left-[1171px] bg-[#d9d9d9] rounded-xl cursor-pointer">
            <div className="absolute w-[50px] top-3 left-[17px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal] whitespace-nowrap">
              Filters
            </div>
            <img className="absolute w-[18px] h-[18px] top-3 left-[79px]"
              alt="Arrow down"
              src="/img/arrow-down-01.svg"/>
          </div>
        </div>

        <div className={`mt-[440px] px-20 transition-all duration-300 ease-in-out`}>
          <div 
            className={`transition-all duration-300 ease-in-out mb-8 ${
              isFiltersVisible 
                ? 'h-[39px] opacity-100' 
                : 'h-0 opacity-0 overflow-hidden'
            }`}>
            <FilterPanel 
              containerClassName="flex gap-[86px]"
              buttonClassName="w-[109px] h-[39px] flex items-center justify-center"
              textClassName="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm"
              onFilterChange={setFilters}
              shouldPersistFilters={true}/>
          </div>

          <div className="grid grid-cols-4 gap-x-6 gap-y-6">
            {(isImageSearchActive ? imageSearchResults : posts).map((post, idx, arr) => {
              if (arr.length === idx + 1 && !isImageSearchActive) {
                return (
                  <Link to={`/image-card-logged/${post && post._id ? post._id : ''}`} key={post && post._id ? post._id : `empty-${idx}`} ref={lastPostRef}>
                    <div className="w-[302px] h-[286px]">
                      <div className="relative w-[302px] h-[260px] bg-[#d9d9d9] rounded-[18px] overflow-hidden flex items-center justify-center group">
                        {post && post.imageUrl && (
                          <>
                            <img src={post.imageUrl} alt="Post" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end">
                              <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-white text-base font-medium truncate">{post.title}</h3>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="h-[22px] mt-4 flex items-center">
                        {post ? (
                          <>
                            <img src={post.userId?.avatarUrl || "/img/default-avatar.png"}
                              alt="Avatar" 
                              className="w-[22px] h-[22px] rounded-full object-cover"/>
                            <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">
                              {post.userId?.username || "User"}
                            </span>
                            <img className="ml-auto w-[18px] h-[18px]" alt="Like" src="/img/like-15.svg" />
                            <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">
                              {Array.isArray(post.likes) ? post.likes.length : 0}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-[22px] h-[22px] bg-[#d9d9d9] rounded-[11px]" />
                            <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">Username</span>
                            <img className="ml-auto w-[18px] h-[18px]" alt="Like" src="/img/like-15.svg" />
                            <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">0</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              } else {
                return (
                  <Link to={`/image-card-logged/${post && post._id ? post._id : ''}`} key={post && post._id ? post._id : `empty-${idx}`}>
                    <div className="w-[302px] h-[286px]">
                      <div className="relative w-[302px] h-[260px] bg-[#d9d9d9] rounded-[18px] overflow-hidden flex items-center justify-center group">
                        {post && post.imageUrl && (
                          <>
                            <img src={post.imageUrl} alt="Post" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end">
                              <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-white text-base font-medium truncate">{post.title}</h3>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                <div className="h-[22px] mt-4 flex items-center">
                        {post ? (
                          <>
                            <img src={post.userId?.avatarUrl || "/img/default-avatar.png"}
                              alt="Avatar" 
                              className="w-[22px] h-[22px] rounded-full object-cover"/>
                            <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">
                              {post.userId?.username || "User"}
                            </span>
                            <img className="ml-auto w-[18px] h-[18px]" alt="Like" src="/img/like-15.svg" />
                            <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">
                              {Array.isArray(post.likes) ? post.likes.length : 0}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-[22px] h-[22px] bg-[#d9d9d9] rounded-[11px]" />
                  <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">Username</span>
                            <img className="ml-auto w-[18px] h-[18px]" alt="Like" src="/img/like-15.svg" />
                            <span className="ml-2 [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xs">0</span>
                          </>
                        )}
                </div>
              </div>
                  </Link>
                );
              }
            })}
          </div>
          {imageSearchLoading && <div className="text-center py-8">Loading...</div>}
          {isImageSearchActive && !imageSearchLoading && imageSearchResults.length === 0 && <div className="text-center py-8">No results found</div>}
          {loading && <div className="text-center py-8">Loading...</div>}
          {!loading && !isImageSearchActive && posts.length === 0 && <div className="text-center py-8">No posts found</div>}
        </div>

        <footer className="w-full flex flex-col items-center mt-20 mb-8">
          <img className="w-[307px] h-[78px] object-cover mb-4" alt="Logo" src="/img/logo-1.png" />
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap mb-2">
            All rights recovered
          </div>
          <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            © 2025 DesignBase
          </div>
        </footer>

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
