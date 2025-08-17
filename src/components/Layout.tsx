import { useState } from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { canAccessRoute } from "../utils/rbac";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const Layout = () => {
  const { user, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
    { name: "Group Chat", href: "/group-chat", icon: ChatBubbleLeftRightIcon },
    { name: "Notices", href: "/notices", icon: ExclamationTriangleIcon },
    { name: "Journal", href: "/journal", icon: BookOpenIcon },
    { name: "Todos", href: "/todos", icon: ClipboardDocumentListIcon },
    { name: "Log Book", href: "/log-book", icon: DocumentTextIcon },
    {
      name: "Group Accounting",
      href: "/group-accounting",
      icon: CalculatorIcon,
    },
    {
      name: "Agency Chat",
      href: "/agency-chat",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: "Agency Accounting",
      href: "/agency-accounting",
      icon: BuildingOfficeIcon,
    },
  ];

  // Filter navigation based on user role and permissions
  const filteredNavigation = navigation.filter((item) => {
    const route = item.href.replace("/", "");
    return canAccessRoute(user, route);
  });

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-white/5">
      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-64 bg-[#232323] shadow-lg z-50 hidden md:block">
        <div className="flex items-center justify-between h-16 my-2.5 px-6 border-b border-white/20">
          <h1 className="text-lg font-semibold text-blue-600">
            Business Teamspace
          </h1>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-700 border-r-2 border-blue-600"
                        : "text-white/70 hover:bg-white/10 hover:text-white/90"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? "text-blue-600" : "text-white/40"
                    }`}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/5 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  <img
                    src="https://i.ibb.co/B2h7g9Fb/Chat-GPT-Image-Aug-17-2025-01-06-00-PM.png"
                    alt=""
                    className="rounded-full"
                  />
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white/70">
                  {user?.name}
                </p>
                <p className="text-xs text-white/50">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-white/40 hover:text-white/60 hover:bg-white/20 rounded-md transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-white/60 bg-opacity-75" />
        </div>
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-screen w-64 bg-[#232323] shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
          <h1 className="text-xl font-bold text-blue-600">
            Business Teamspace
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-white/40 hover:text-white/60 hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-700 border-r-2 border-blue-600"
                        : "text-white/70 hover:bg-white/10 hover:text-white/90"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? "text-blue-600" : "text-white/40"
                    }`}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/5 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  <img
                    src="https://i.ibb.co/B2h7g9Fb/Chat-GPT-Image-Aug-17-2025-01-06-00-PM.png"
                    alt=""
                    className="rounded-full"
                  />
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white/70">
                  {user?.name}
                </p>
                <p className="text-xs text-white/50">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-white/40 hover:text-white/60 hover:bg-white/20 rounded-md transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:ml-64 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-[#111111] shadow border-b border-white/20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-md text-white/40 hover:text-white/60 hover:bg-white/10 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="ml-4 md:ml-0">
                <h2 className="text-lg font-semibold text-white/90">
                  {filteredNavigation.find(
                    (item) => item.href === location.pathname
                  )?.name || "Dashboard"}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden sm:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 pl-10 pr-4 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-white/40 text-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-white/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white/70">
                    {user?.name}
                  </p>
                  <p className="text-xs text-white/50">{user?.role}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    <img
                      src="https://i.ibb.co/B2h7g9Fb/Chat-GPT-Image-Aug-17-2025-01-06-00-PM.png"
                      alt=""
                      className="rounded-full"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main
          className={`p-6`}
          style={{
            backgroundImage: `url(./src/assets/background/bg-blob-dark.gif)`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            // backgroundRepeat: 'no-repeat',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
