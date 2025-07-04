import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const OAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      setTimeout(() => {
        navigate("/home-logged");
      }, 100);
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Завершаем вход...</div>;
};
