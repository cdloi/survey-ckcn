export default function StatCard({ icon: Icon, title, value, color = "bg-red-600", subtitle, children }) {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white rounded mb-6 xl:mb-0 shadow-lg">
      <div className="flex-auto p-4">
        <div className="flex flex-wrap">
          <div className="relative w-full pr-4 max-w-full flex-grow flex-1">
            <h5 className="text-blueGray-400 uppercase font-bold text-xs">{title}</h5>
            <span className="font-semibold text-xl text-blueGray-700">{value}</span>
            {subtitle && (
              <p className="text-sm text-blueGray-400 mt-2">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="relative w-auto pl-4 flex-initial">
              <div className={`text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full ${color}`}>
                <Icon size={22} />
              </div>
            </div>
          )}
        </div>
        {children && (
          <p className="text-sm text-blueGray-400 mt-4">{children}</p>
        )}
      </div>
    </div>
  );
}