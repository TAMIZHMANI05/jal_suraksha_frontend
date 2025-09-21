import { useState, useRef, useEffect } from "react";

const TopBar = ({ sidebarExpanded }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-30 h-16 flex items-center justify-between bg-light-bg dark:bg-dark-bg border-b border-x  border-light-border dark:border-dark-border px-4 transition-all rounded-b-2xl shadow-md duration-400
        ${sidebarExpanded ? "md:ml-58" : "md:ml-18"} ml-0
        ${!sidebarExpanded ? "sm:ml-0" : ""}
      `}
    ></div>
  );
};

export default TopBar;
