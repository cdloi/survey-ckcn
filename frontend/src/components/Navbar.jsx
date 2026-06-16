import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Shield, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className="top-0 fixed z-50 w-full flex flex-wrap items-center justify-between px-2 py-3 bg-white shadow">
      <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
        <div className="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start">
          <Link to="/" className="text-blueGray-700 text-sm font-bold leading-relaxed inline-block mr-4 py-2 whitespace-nowrap uppercase">
            Khoa CKCN
          </Link>
          <button
            className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none"
            type="button"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className={`lg:flex flex-grow items-center ${open ? "flex" : "hidden"}`}>
          <ul className="flex flex-col lg:flex-row list-none ml-auto">
            {user ? (
              <>
                <li className="flex items-center">
                  <span className="text-blueGray-500 px-3 py-2 text-xs uppercase font-bold">{user.name}</span>
                </li>
                {user.role === "admin" && (
                  <li className="flex items-center">
                    <Link to="/admin" className="hover:text-blueGray-500 text-blueGray-700 px-3 py-2 flex items-center text-xs uppercase font-bold">
                      <Shield size={14} className="mr-1" /> Quản trị
                    </Link>
                  </li>
                )}
                <li className="flex items-center">
                  <button
                    onClick={() => { logout(); navigate("/"); }}
                    className="hover:text-blueGray-500 text-blueGray-700 px-3 py-2 flex items-center text-xs uppercase font-bold"
                  >
                    <LogOut size={14} className="mr-1" /> Đăng xuất
                  </button>
                </li>
              </>
            ) : (
              <li className="flex items-center">
                <Link
                  to="/login"
                  className="hover:text-blueGray-500 text-blueGray-700 px-3 py-2 flex items-center text-xs uppercase font-bold"
                >
                  <LogIn size={14} className="mr-1" /> Đăng nhập
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}