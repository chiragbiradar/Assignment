import React, { useState, useRef, useEffect } from 'react';
// Import the required icons
import { TbLayoutSidebarRightExpandFilled } from "react-icons/tb";
import { LuRefreshCw, LuPencilLine } from "react-icons/lu";
import { CgDetailsMore } from "react-icons/cg";
import { TfiLayoutListThumb } from "react-icons/tfi";
import { BiSolidNetworkChart } from "react-icons/bi";
import { MdGroups } from "react-icons/md";
import { CiAt } from "react-icons/ci";
import { RiFolderImageFill, RiListSettingsLine } from "react-icons/ri";
import { FiSettings, FiHelpCircle, FiLogOut } from "react-icons/fi";
import { IoInformationCircleOutline } from "react-icons/io5";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RightSidebar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    router.refresh();
  };

  return (
    <div className="w-14 bg-gray-100 flex flex-col items-center py-4 border-l" style={{ position: 'relative', zIndex: 30 }}>
      {/* Icons column - starting from the top without logo */}
      <div className="flex flex-col space-y-6 items-center pt-6">
        {/* Sidebar Toggle icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <TbLayoutSidebarRightExpandFilled className="h-4 w-4" />
        </button>

        {/* Refresh icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <LuRefreshCw className="h-4 w-4" />
        </button>

        {/* Edit/Pencil icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <LuPencilLine className="h-4 w-4" />
        </button>

        {/* More Details icon with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <CgDetailsMore className="h-4 w-4" />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute top-0 left-6 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-48">
              <ul>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <IoInformationCircleOutline className="mr-2 h-4 w-4" />
                    About
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <FiSettings className="mr-2 h-4 w-4" />
                    Settings
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <FiHelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* List Layout icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <TfiLayoutListThumb className="h-4 w-4" />
        </button>

        {/* Network Chart icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <BiSolidNetworkChart className="h-4 w-4" />
        </button>

        {/* Groups icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <MdGroups className="h-4 w-4" />
        </button>

        {/* Mention/At icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <CiAt className="h-4 w-4" />
        </button>

        {/* Image Folder icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <RiFolderImageFill className="h-4 w-4" />
        </button>

        {/* Settings List icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <RiListSettingsLine className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
