import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

let globalUserProfile = null;
let listeners = [];

const notifyListeners = (newProfile) => {
  globalUserProfile = newProfile;
  listeners.forEach(listener => listener(newProfile));
};

export const useUserProfile = () => {
  const [userProfile, setLocalUserProfile] = useState(globalUserProfile);
  const [loading, setLoading] = useState(!globalUserProfile);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("Access token not found");
      }

      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          navigate("/login");
          throw new Error("Session expired. Please log in again");
        }
        throw new Error("Failed to load user profile");
      }

      const data = await response.json();
      notifyListeners(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const listener = (newProfile) => {
      setLocalUserProfile(newProfile);
    };
    listeners.push(listener);

    fetchUserProfile();

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, [fetchUserProfile]);

  const setUserProfile = useCallback((profile) => {
    const newProfile = typeof profile === 'function' 
      ? profile(globalUserProfile)
      : profile;
    notifyListeners(newProfile);
  }, []);

  return { userProfile, loading, error, setUserProfile };
}; 