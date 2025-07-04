import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import { useUserProfile } from '../../../hooks/useUserProfile';

export const PmMain = ({ onSelectUser }) => {
  const { userProfile } = useUserProfile();
  const currentUserId = userProfile?._id;
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeUserId, setActiveUserId] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/messages/chats", { withCredentials: true });
      setChats(res.data);
    } catch (err) {
      setError('Failed to load chats. Please try again later.');
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchTerm) => {
        if (!searchTerm.trim()) {
          setSearchResults([]);
          return;
        }
        try {
          setSearchLoading(true);
          const res = await axios.get(
            `/api/messages/search-users?username=${encodeURIComponent(searchTerm)}`,
            { withCredentials: true }
          );
          setSearchResults(res.data);
        } catch (err) {
          console.error('Error searching users:', err);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search, debouncedSearch]);

  const handleUserClick = useCallback((user) => {
    setActiveUserId(user._id);
    if (onSelectUser) onSelectUser(user);
  }, [onSelectUser]);

  const usersToShow = useMemo(() => 
    search.trim() ? searchResults : chats.map(c => c.user),
    [search, searchResults, chats]
  );

  if (error) {
    return (
      <div className="bg-[#f8faff] rounded-[22px] p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchChats}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f8faff] rounded-[22px] flex flex-row justify-center w-full">
      <div className="bg-[#f8faff] rounded-[22px] border-[2px] border-solid border-black shadow-[0px_8px_8px_#00000040] overflow-x-hidden w-[300px] h-[438px] relative p-4">

        <div className="flex items-center mt-2 mb-4 relative">
          <input type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search username"
            className="w-full h-8 pl-3 pr-8 rounded-lg border border-black bg-[#f8faff] text-sm"/>

          <img src="/img/search.svg" alt="Search" className="absolute right-2 top-1 w-5 h-5" />
          {searchLoading && (
            <div className="absolute right-8 top-1 w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          )}
        </div>

        <div className="overflow-y-auto max-h-[270px]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
          ) : usersToShow.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">
              {search.trim() ? 'No users found' : 'No chats yet'}
            </div>
          ) : (
            usersToShow.map(user => {
              const chat = chats.find(c => c.user._id === user._id);
              const showUnread = (
                user._id !== currentUserId &&
                chat &&
                chat.unreadCount > 0 &&
                chat.lastMessage &&
                chat.lastMessage.sender === user._id
              );
              return (
                <div
                  key={user._id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#ececec] ${activeUserId === user._id ? 'bg-[#e0eaff]' : ''}`}
                  onClick={() => handleUserClick(user)}>

                  <div className="w-10 h-10 rounded-full bg-[#d9d9d9] flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-base font-bold text-black">{user.username[0]}</span>
                    )}
          </div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-black text-sm">{user.username}</div>
                    {showUnread && (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 ml-1"></span>
                    )}
          </div>
        </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

PmMain.propTypes = {
  onSelectUser: PropTypes.func.isRequired
};
