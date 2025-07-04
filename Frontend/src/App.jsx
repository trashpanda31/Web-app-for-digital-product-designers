import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OAuthRedirect } from "./screens/OAuthRedirect/OAuthRedirect.jsx";
import PrivateRoute from "./PrivateRoute";
import { NonAuthRoute } from "./components/NonAuthRoute";
import axios from 'axios';

import { HomePage } from "./screens/NotLoggedIn/HomePage/HomePage.jsx";
import { SignUpOauth } from "./screens/NotLoggedIn/SignUpOauth/SignUpOauth.jsx";
import { Registration } from "./screens/NotLoggedIn/Registration/Registration.jsx";
import { LogInOauth } from "./screens/NotLoggedIn/Login/LogInOauth.jsx";
import { LogInEmail } from "./screens/NotLoggedIn/LogInEmail/LogInEmail.jsx";
import { RemoveBgNonLogged } from "./screens/NotLoggedIn/RemoveBgNonLogged/RemoveBgNonLogged.jsx";
import { GenerateImageNonLoggedIn } from "./screens/NotLoggedIn/GenerateImageNonLoggedIn/GenerateImageNonLoggedIn.jsx";
import { ImageCardNotLogged } from "./screens/NotLoggedIn/ImageCardNotLogged/ImageCardNotLogged.jsx";

import { HomePageLoggedIn } from "./screens/LoggedIn/HomePageLoggedIn/HomePageLoggedIn.jsx";
import { GenerateImage } from "./screens/LoggedIn/GenerateImage/GenerateImage.jsx";
import { RemoveBG } from "./screens/LoggedIn/RemoveBG/RemoveBG.jsx";
import { RemoveBgEdited } from "./screens/LoggedIn/RemoveBgEdited/RemoveBgEdited.jsx";
import Account from "./screens/LoggedIn/Account/Account.jsx";
import { AccountEdit } from "./screens/LoggedIn/AccountEdit/AccountEdit.jsx";
import { AccountEditPersonal } from "./screens/LoggedIn/AccountEditPersonal/AccountEditPersonal.jsx";
import { AccountEditPassword } from "./screens/LoggedIn/AccountEditPassword/AccountEditPassword.jsx";
import { ImageCardLoggedIn } from "./screens/LoggedIn/HomePageLoggedIn/ImageCardLoggedIn.jsx";

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default function App() {
  const fetchCsrfToken = async () => {
    try {
      const response = await fetch("/api/csrf-token", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      sessionStorage.setItem("csrfToken", data.csrfToken);
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
    }
  };

  useEffect(() => {
    window.fetchCsrfToken = fetchCsrfToken;
    fetchCsrfToken();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NonAuthRoute><HomePage /></NonAuthRoute>} />
        <Route path="/signup" element={<NonAuthRoute><SignUpOauth /></NonAuthRoute>} />
        <Route path="/register" element={<NonAuthRoute><Registration /></NonAuthRoute>} />
        <Route path="/login" element={<NonAuthRoute><LogInOauth /></NonAuthRoute>} />
        <Route path="/login/email" element={<NonAuthRoute><LogInEmail /></NonAuthRoute>} />
        <Route path="/remove-bg" element={<NonAuthRoute><RemoveBgNonLogged /></NonAuthRoute>} />
        <Route path="/generate-image" element={<NonAuthRoute><GenerateImageNonLoggedIn /></NonAuthRoute>} />
        <Route path="/image-card/:id" element={<NonAuthRoute><ImageCardNotLogged /></NonAuthRoute>} />
        <Route path="/dashboard" element={<OAuthRedirect />} />

        <Route path="/home-logged" element={<PrivateRoute><HomePageLoggedIn /></PrivateRoute>} />
        <Route path="/Generate-image-logged-in" element={<PrivateRoute><GenerateImage /></PrivateRoute>} />
        <Route path="/RemoveBG-logged-in" element={<PrivateRoute><RemoveBG /></PrivateRoute>} />
        <Route path="/RemoveBG-edited" element={<PrivateRoute><RemoveBgEdited /></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
        <Route path="/account/edit" element={<PrivateRoute><AccountEdit /></PrivateRoute>} />
        <Route path="/account/edit/personal" element={<PrivateRoute><AccountEditPersonal /></PrivateRoute>} />
        <Route path="/account/edit/password" element={<PrivateRoute><AccountEditPassword /></PrivateRoute>} />
        <Route path="/image-card-logged/:id" element={<PrivateRoute><ImageCardLoggedIn /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}