import React, { useState } from "react";
import {Link, useNavigate} from "react-router-dom";

export const Registration = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        return value.trim() ? '' : 'First name is required';
      case 'lastName':
        return value.trim() ? '' : 'Last name is required';
      case 'username':
        return value.trim().length >= 3 ? '' : 'Username must be at least 3 characters';
      case 'email':
        return value ? (validateEmail(value) ? '' : 'Invalid email format') : 'Email is required';
      case 'password':
        return value.length >= 6 ? '' : 'Password must be at least 6 characters';
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
      setValidationErrors(errors);
      return;
    }

    try {
      const csrfToken = sessionStorage.getItem("csrfToken");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setValidationErrors(prev => ({
        ...prev,
        submit: err.message
      }));
    }
  };

  const renderField = (name, label, type = "text") => (
    <div className="form-group relative">
      <label 
        htmlFor={name} 
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
    <div className="bg-[#f7faff] min-h-screen flex flex-col items-center justify-center w-full py-10">
      <div className="bg-[#f7faff] w-[1440px] max-w-full px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-[40px] left-[40px] sm:top-[60px] sm:left-[60px] lg:top-[137px] lg:left-[106px]">
          <div onClick={() => navigate(-1)}
              className="cursor-pointer w-[39px] h-[38px] bg-[#f8faff] rounded-[19.5px/19px] border border-solid border-black flex items-center justify-center">
            <img className="w-6 h-6"
                alt="Arrow left"
                src="/img/arrow-left-02.svg"/>
          </div>
        </div>

        <div className="text-center mb-10 mt-10 sm:mt-16 lg:mt-0">
          <div className="[font-family:'Gilroy-SemiBold',Helvetica] font-normal text-black text-2xl tracking-[0] leading-[normal]">
            Sign up to DesignBase
          </div>
        </div>

        <form onSubmit={handleSubmit}
          className="registration-form max-w-xl mx-auto space-y-6"
          noValidate>
          <div className="flex flex-col sm:flex-row sm:space-x-4">
            <div className="flex-1">
              {renderField("firstName", "Name")}
            </div>
            <div className="flex-1 mt-6 sm:mt-0">
              {renderField("lastName", "Surname")}
            </div>
          </div>

          {renderField("username", "Username")}
          {renderField("email", "E-mail", "email")}
          {renderField("password", "Password", "password")}
          {renderField("confirmPassword", "Confirm password", "password")}

          <section className="verification-submit flex flex-col items-center mt-8 space-y-4">
            <button type="submit"
              className="w-[300px] sm:w-[443px] h-[65px] rounded-[32.5px] flex items-center justify-center text-white text-xl bg-black cursor-pointer">
              <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal">Sign Up</span>
            </button>
          </section>

          {validationErrors.submit && (
            <div className="text-center mt-4">
              <div className="text-sm text-red-500 [font-family:'Gilroy-Medium',Helvetica] bg-white px-2 py-1 rounded-md shadow-sm inline-block">
                {validationErrors.submit}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
