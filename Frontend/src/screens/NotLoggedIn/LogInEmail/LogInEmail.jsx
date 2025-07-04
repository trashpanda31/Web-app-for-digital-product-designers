import React, { useState } from "react";
import {Link, useNavigate} from "react-router-dom";

export const LogInEmail = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    submit: ""
  });
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return value ? (validateEmail(value) ? '' : 'Invalid email format') : 'Email is required';
      case 'password':
        return value ? '' : 'Password is required';
      case 'confirmPassword':
        return value === formData.password ? '' : 'Passwords do not match';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));

    if (name === 'password' && formData.confirmPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: value === formData.confirmPassword ? '' : 'Passwords do not match'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        ...errors
      }));
      return;
    }

    try {
      let csrfToken = sessionStorage.getItem("csrfToken");

      if (!csrfToken && window.fetchCsrfToken) {
        csrfToken = await window.fetchCsrfToken();
      }
      
      if (!csrfToken) {
        throw new Error("Security token not found. Please refresh the page");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }

      localStorage.setItem("accessToken", data.accessToken);
      setTimeout(() => {
        navigate("/home-logged");
      }, 1500);
    } catch (err) {
      console.error("Login error:", err);
      setValidationErrors(prev => ({
        ...prev,
        submit: err.message
      }));
    }
  };

  const renderField = (name, label, type = "text") => (
    <div className="form-group relative">
      <label htmlFor={name}
        className="block [font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        className={`w-full h-[50px] bg-[#f8faff] rounded-[15px] border border-solid ${
          validationErrors[name] ? 'border-red-500' : 'border-black'
        } px-4 transition-colors duration-200`}
        autoComplete="off"/>
      {validationErrors[name] && (
        <div className="absolute -bottom-6 left-0 text-sm text-red-500 [font-family:'Gilroy-Medium',Helvetica] bg-white px-2 py-1 rounded-md shadow-sm">
          {validationErrors[name]}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-[#f7faff] min-h-screen flex flex-col items-center w-full py-10 pt-40">
      <div className="bg-[#f7faff] w-[1440px] max-w-full px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-[30px] left-[106px]">
          <div onClick={() => navigate(-1)}
               className="cursor-pointer w-[39px] h-[38px] bg-[#f8faff] rounded-[19.5px/19px] border border-solid border-black flex items-center justify-center">
            <img className="w-6 h-6"
                 alt="Arrow left"
                 src="/img/arrow-left-02.svg"/>
          </div>
        </div>

        <div className="text-center mb-10 mt-10 sm:mt-16 lg:mt-0">
          <div className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-2xl tracking-[0] leading-[normal]">
            Log in to DesignBase
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form max-w-xl mx-auto space-y-6" noValidate>
          {renderField("email", "E-mail", "email")}
          {renderField("password", "Password", "password")}
          {renderField("confirmPassword", "Confirm Password", "password")}

          <section className="verification-submit flex flex-col items-center mt-8 space-y-4">
            <button
              type="submit"
              className="w-[300px] sm:w-[443px] h-[65px] rounded-[32.5px] flex items-center justify-center text-white text-xl bg-black cursor-pointer">
              <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal">Log In</span>
            </button>

            {validationErrors.submit && (
              <div className="text-center mt-4">
                <div className="text-sm text-red-500 [font-family:'Gilroy-Medium',Helvetica] bg-white px-2 py-1 rounded-md shadow-sm inline-block">
                  {validationErrors.submit}
                </div>
              </div>
            )}
          </section>
        </form>
      </div>
    </div>
  );
};

