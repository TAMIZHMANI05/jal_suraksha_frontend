import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiDroplet,
  FiUser,
} from "react-icons/fi";
import { BsFillGearFill, BsGear } from "react-icons/bs";

const links = [
  {
    to: "/",
    icon: <FiBarChart2 />,
    label: "Dashboard",
  },
  // {
  //   to: "/user",
  //   icon: <FiUser />,
  //   label: "User Management",
  // },
  {
    to: "/water",
    icon: <FiDroplet/>,
    label: "Water Source Management",
  },
  {
    to: "/device",
    icon: <BsGear/>,
    label: "Device Management",
  },
];

const Sidebar = ({ expanded, setExpanded }) => {
  const location = useLocation();
  const isActive = (to) => location.pathname === to;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 bg-light-bg dark:bg-dark-bg border-r border-light-border dark:border-dark-border transition-all duration-400
          ${expanded ? "w-56" : "w-16"}
        `}
        style={{ minWidth: expanded ? 200 : 64 }}
      >
        <div
          className={`flex items-center justify-between  md:border-b border-light-border dark:border-dark-border ${
            expanded ? "px-4" : "p-4"
          }`}
        >
          {expanded && (
            <h1 className="text-lg font-semibold text-blue-600 dark:text-dark-text-primary py-5">
              Jal Suraksha
            </h1>
          )}
          <button
            className="hidden md:block ml-auto cursor-pointer p-2 rounded-xl  bg-light-bg dark:bg-dark-bg hover:bg-gray-100 transition-colors"
            onClick={() => setExpanded((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {expanded ? (
              <FiChevronLeft size={20} />
            ) : (
              <FiChevronRight size={20} />
            )}
          </button>
        </div>
        <nav className="flex flex-col gap-1 mt-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={` flex items-center gap-3 px-4 py-2 rounded-xl transition-colors
               "text-light-text-primary dark:text-dark-text-primary hover:text-white dark:hover:bg-[#3b82f6] dark:hover:text-white"
                ${expanded ? "justify-start" : "justify-center"}
              `}
            >
              <span className="text-xl">{link.icon}</span>
              {expanded && <span className="text-base">{link.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
