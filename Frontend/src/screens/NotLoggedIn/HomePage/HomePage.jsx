import React, { useState, useEffect } from "react";
import {Link, useNavigate} from "react-router-dom";
import { FilterPanel } from "../../../components/FilterPanel";
import { SortPanel } from "../../../components/SortPanel/SortPanel";
import { SearchBar } from "../../../components/SearchBar/SearchBar";
import axios from 'axios';

export const HomePage = () => {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem('filterPanelFilters');
    return savedFilters ? JSON.parse(savedFilters) : {};
  });
  const [sort, setSort] = useState(() => {
    const savedSort = localStorage.getItem('homeSort');
    return savedSort || "recent";
  });

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      localStorage.setItem('filterPanelFilters', JSON.stringify(filters));
    }
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('homeSort', sort);
  }, [sort]);

  useEffect(() => {
    let url = `/api/posts?limit=16`;
    if (search) {
      if (search.startsWith('#')) {
        url = `/api/posts/filter?tags=${encodeURIComponent(search.slice(1))}&limit=16`;
        if (sort) url += `&type=${sort}`;
      } else {
        url = `/api/posts/search?query=${encodeURIComponent(search)}&limit=16`;
        if (sort) url += `&type=${sort}`;
      }
    } else if ((filters && Object.keys(filters).length > 0) || sort) {
      const params = new URLSearchParams({ ...filters, limit: 16 });
      if (sort) params.append('type', sort);
      url = `/api/posts/filter?${params.toString()}`;
    } else {
      url = `/api/posts/sort?type=recent&limit=16`;
    }
    setLoading(true);
    fetch(url)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) {
            setPosts([]);
          } else {
            setPosts(data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
  }, [search, filters, sort]);

  useEffect(() => {
    axios.get('/api/csrf-token', { withCredentials: true })
        .then(res => setCsrfToken(res.data.csrfToken))
        .catch(err => console.error('CSRF-token error:', err));
  }, []);

  const handleImageHashSearch = (file) => {
    setImageSearchLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    axios.post('/api/posts/search-images', formData, {
      headers: {
        'X-CSRF-Token': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      withCredentials: true
    })
        .then(res => {
          const data = res.data;
          if (!data || !Array.isArray(data.results)) {
            console.error('Invalid response format:', data);
            setImageSearchResults([]);
          } else {
            setImageSearchResults(data.results);
          }
          setImageSearchLoading(false);
        })
        .catch(error => {
          console.error('Error searching by image:', error);
          setImageSearchResults([]);
          setImageSearchLoading(false);
        });
  };

  const sortedPosts = Array.isArray(posts) ? [...posts].sort((b, a) => new Date(b.createdAt) - new Date(a.createdAt)) : [];

  let postsForGrid;
  if (imageSearchResults.length > 0) {
    const imageIds = new Set(imageSearchResults.map(p => p._id));
    const rest = Array.isArray(posts) ? posts.filter(p => !imageIds.has(p._id)) : [];
    postsForGrid = [
      ...imageSearchResults.slice(0, 16),
      ...rest.slice(0, Math.max(0, 16 - imageSearchResults.length))
    ];
  } else if (search && searchResults.length > 0) {
    const searchIds = new Set(searchResults.map(p => p._id));
    const rest = Array.isArray(posts) ? posts.filter(p => !searchIds.has(p._id)) : [];
    postsForGrid = [
      ...searchResults.slice(0, 16),
      ...rest.slice(0, Math.max(0, 16 - searchResults.length))
    ];
  } else if (filters && Object.keys(filters).length > 0 && searchResults.length > 0) {
    const filteredIds = new Set(searchResults.map(p => p._id));
    const rest = Array.isArray(posts) ? posts.filter(p => !filteredIds.has(p._id)) : [];
    postsForGrid = [
      ...searchResults.slice(0, 16),
      ...rest.slice(0, Math.max(0, 16 - searchResults.length))
    ];
  } else {
    postsForGrid = Array.isArray(posts) ? [...posts.slice(0, 16)] : [];
  }
  postsForGrid = [
    ...postsForGrid,
    ...Array(Math.max(0, 16 - postsForGrid.length)).fill(null)
  ];

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  const contentShiftClass = isFiltersVisible ? 'translate-y-[92px]' : '';
  const transitionClass = 'transition-all duration-300 ease-in-out';

  return (
      <div className="bg-[#f7faff] flex flex-row justify-center w-full">
        <div className="bg-[#f7faff] w-[1440px] h-[2260px] relative">
          <header>
            <img className="absolute w-[189px] h-12 top-[19px] left-[77px] object-cover"
                 alt="Logo"
                 src="/img/logo.png"/>
            <nav className="inline-flex items-center justify-center gap-[15px] absolute top-[37px] left-[572px]">
              <Link to="/"
                    className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
                Illustrations
              </Link>
              <Link to="/generate-image"
                    className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
                Generate image
              </Link>
              <Link to="/remove-bg"
                    className="relative w-fit mt-[-1.00px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
                Remove Bg
              </Link>
            </nav>
            <Link to="/signup"
                  className="absolute w-11 top-[37px] left-[1196px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Sign up
            </Link>
            <div className="absolute w-[87px] h-[29px] top-8 left-[1275px]">
              <div className="relative w-[85px] h-[29px] bg-[#494949] rounded-[20px]">
                <Link to="/login"
                      className="absolute w-11 top-[5px] left-[21px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-white text-base tracking-[0] leading-[normal] whitespace-nowrap">
                  Login
                </Link>
              </div>
            </div>
          </header>
          <main>
          <section className="hero">
            <p className="absolute w-[533px] top-[163px] left-[453px] [font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-[40px] text-center tracking-[0] leading-[normal]">
              Discover high-quality visuals for every creative need
            </p>
            <p className="absolute w-[486px] top-[296px] left-[477px] [font-family:'Gilroy-Regular',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal]">
              Explore a vast library of images, icons, and vectors — ready to elevate your next project.
            </p>
          </section>
          <section className="search-and-filters">
            <div className="absolute top-[360px] left-[469px]">
              <div className="relative">
                <SearchBar value={search} onChange={e => setSearch(e.target.value)} onImageHashSearch={handleImageHashSearch} />
              </div>
            </div>

            <SortPanel
                containerClassName="absolute top-[367px] left-20"
                buttonClassName="w-[109px] h-[42px] flex items-center justify-center"
                textClassName="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal] whitespace-nowrap"
                onSortChange={setSort}/>
            <div onClick={toggleFilters}
                className="absolute w-[109px] h-[42px] top-[367px] left-[1251px] bg-[#d9d9d9] rounded-xl cursor-pointer">
              <div className="absolute w-[50px] top-3 left-[17px] [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal] whitespace-nowrap">
                Filters
              </div>

              <img className="absolute w-[18px] h-[18px] top-3 left-[79px]"
                   alt="Arrow down"
                   src="/img/arrow-down-01-1.svg"/>
            </div>
          </section>

          <div className="mt-[440px] px-20">
            <div className={`transition-all duration-300 ease-in-out mb-8 ${
                    isFiltersVisible
                        ? 'h-[39px] opacity-100'
                        : 'h-0 opacity-0 overflow-hidden'
                }`}>
              <FilterPanel containerClassName="flex gap-[86px]"
                  buttonClassName="w-[109px] h-[39px] bg-[#d9d9d9] rounded-[14px] flex items-center justify-center border-none outline-none cursor-pointer"
                  textClassName="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-sm"
                  onFilterChange={setFilters}
                  shouldPersistFilters={true}/>
            </div>

            <div className="grid grid-cols-4 gap-x-6 gap-y-6">
              {loading ? (
                  <div>Loading...</div>
              ) : (
                  postsForGrid.map((post, idx) => (
                      <Link to={`/image-card/${post && post._id ? post._id : ''}`} key={post && post._id ? post._id : `empty-${idx}`}>
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
                  ))
              )}
            </div>
          </div>

          <section className={`cta absolute w-full top-[1840px] ${transitionClass} ${contentShiftClass}`}>
            <Link to="/register">
              <div className="w-[358px] h-[65px] mx-auto bg-[#f8faff] rounded-[28px] border border-solid border-black flex items-center justify-center">
                <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                  Sign Up to Continue
                </div>
              </div>
            </Link>
          </section>
          </main>
          <footer className={`absolute w-[1440px] h-72 top-[2016px] left-0 flex flex-col items-center justify-center ${transitionClass} ${contentShiftClass}`}>
            <img className="w-[307px] h-[78px] mb-6"
                 alt="Logo"
                 src="/img/logo.png"/>
            <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl mb-4">
              All rights recovered
            </div>
            <div className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl">
              © 2025 DesignBase
            </div>
          </footer>

        </div>
      </div>
  );
};