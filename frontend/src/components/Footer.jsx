import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative bg-blueGray-200 pt-8 pb-6">
      <div className="bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20" style={{ transform: "translateZ(0)" }}>
        <svg className="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0">
          <polygon className="text-blueGray-200 fill-current" points="2560 0 2560 100 0 100"></polygon>
        </svg>
      </div>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap text-center lg:text-left">
          <div className="w-full lg:w-6/12 px-4">
            <h4 className="text-3xl font-semibold">Khảo sát Khoa CKCN</h4>
            <h5 className="text-lg mt-0 mb-2 text-blueGray-600">
              Trường Đại học Nông Lâm TP.HCM
            </h5>
          </div>
          <div className="w-full lg:w-6/12 px-4">
            <div className="flex flex-wrap items-top mb-6">
              <div className="w-full lg:w-6/12 px-4 ml-auto">
                <span className="block uppercase text-blueGray-500 text-sm font-semibold mb-2">Liên kết</span>
                <ul className="list-unstyled">
                  <li>
                    <Link to="/" className="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm">Trang chủ</Link>
                  </li>
                  <li>
                    <Link to="/respond" className="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm">Tham gia khảo sát</Link>
                  </li>
                  <li>
                    <Link to="/login" className="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm">Đăng nhập</Link>
                  </li>
                </ul>
              </div>
              <div className="w-full lg:w-6/12 px-4">
                <span className="block uppercase text-blueGray-500 text-sm font-semibold mb-2">Khoa CKCN</span>
                <ul className="list-unstyled">
                  <li>
                    <a href="https://ckcn.hcmuaf.edu.vn" target="_blank" className="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm">Website Khoa</a>
                  </li>
                  <li>
                    <a href="https://hcmuaf.edu.vn" target="_blank" className="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm">ĐH Nông Lâm</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-6 border-blueGray-300" />
        <div className="flex flex-wrap items-center md:justify-between justify-center">
          <div className="w-full px-4 mx-auto text-center">
            <div className="text-sm text-blueGray-500 font-semibold py-1">
              &copy; {new Date().getFullYear()} Khoa Cơ Khí - Công Nghệ, ĐH Nông Lâm TP.HCM
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}