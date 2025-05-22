import React from 'react';
// Import the required icons
import { TbLayoutSidebarRightExpandFilled } from "react-icons/tb";
import { LuRefreshCw, LuPencilLine } from "react-icons/lu";
import { CgDetailsMore } from "react-icons/cg";
import { TfiLayoutListThumb } from "react-icons/tfi";
import { BiSolidNetworkChart } from "react-icons/bi";
import { MdGroups } from "react-icons/md";
import { CiAt } from "react-icons/ci";
import { RiFolderImageFill, RiListSettingsLine } from "react-icons/ri";

export default function RightSidebar() {
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

        {/* More Details icon */}
        <button className="text-gray-400 hover:text-gray-600">
          <CgDetailsMore className="h-4 w-4" />
        </button>

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
