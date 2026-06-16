import Sidebar from "./Sidebar";
import { LogOut, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <Sidebar />
      <div className="relative md:ml-64 bg-blueGray-100 min-h-screen">
        <nav className="absolute top-0 left-0 w-full z-10 bg-transparent md:flex-row md:flex-nowrap md:justify-start flex items-center p-4">
          <div className="w-full mx-auto items-center flex justify-between md:flex-nowrap flex-wrap md:px-10 px-4">
            <span className="text-white text-sm uppercase hidden lg:inline-block font-semibold">
              Trang quản trị
            </span>
            <div className="flex items-center gap-3 ml-auto">
              {user && (
                <>
                  <span className="text-white text-xs hidden md:inline-block opacity-80">
                    <Shield size={14} className="inline mr-1" />
                    {user.name}
                  </span>
                  <button
                    onClick={() => { logout(); navigate("/login"); }}
                    className="text-white text-xs uppercase font-bold hover:opacity-80"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
        <div className="px-4 md:px-10 mx-auto w-full -m-24 pt-24">
          {children}
        </div>
      </div>
    </div>
  );
}