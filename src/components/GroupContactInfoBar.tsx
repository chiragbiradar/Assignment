'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HiSparkles } from "react-icons/hi";
import { LuSearch } from "react-icons/lu";

type Participant = {
  id: string;
  full_name: string;
  avatar_url?: string;
};

type GroupContactInfoBarProps = {
  groupName: string;
  participants: Participant[];
  isGroup: boolean;
  onViewDetails?: () => void;
};

export default function GroupContactInfoBar({
  groupName = 'Test El Centro',
  participants = [
    { id: '1', full_name: 'Roshnag Airtel', avatar_url: '' },
    { id: '2', full_name: 'Roshnag Jio', avatar_url: '' },
    { id: '3', full_name: 'Bharat Kumar Ramesh', avatar_url: '' },
    { id: '4', full_name: 'Periscope', avatar_url: '' },
  ],
  isGroup = true,
  onViewDetails,
}: GroupContactInfoBarProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      // Navigate to details page if no handler provided
      router.push(`/group-details/${encodeURIComponent(groupName)}`);
    }
  };

  return (
    <div
      className="w-full bg-white border-b px-3 py-2"
      style={{ position: 'relative', zIndex: 60 }}
    >
      {/* Main content area with group info and right side elements */}
      <div className="flex justify-between">
        {/* Left side - Group/Contact Info */}
        <div className="flex items-start">
          {/* Group/Contact Info */}
          <div className="cursor-pointer" onClick={handleViewDetails}>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 relative mr-3">
                {participants[0]?.avatar_url ? (
                  <Image
                    src={participants[0].avatar_url}
                    alt={participants[0].full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-semibold">
                    {groupName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-gray-900 mr-2">{groupName}</h3>

                  {/* Tags/Labels on the same line as the name */}
                  <div className="flex space-x-1">
                    {isGroup && (
                      <div className="px-1.5 py-0.5 rounded-md text-[9px] text-white font-medium bg-blue-500">
                        Group
                      </div>
                    )}
                  </div>
                </div>

                {isGroup && (
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {participants.map(p => p.full_name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Avatars and action icons */}
        <div className="flex items-center space-x-2">
          {/* Participant avatars - only show for group chats */}
          {isGroup && (
            <div className="flex -space-x-2 mr-1">
              {participants.slice(0, 3).map((participant) => (
                <div key={participant.id} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative">
                  {participant.avatar_url ? (
                    <Image
                      src={participant.avatar_url}
                      alt={participant.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-[10px] font-semibold">
                      {participant.full_name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
              {participants.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
                  +{participants.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Search and Sparkles icons */}
          <div className="flex space-x-1">
            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
              <LuSearch className="h-4 w-4 text-gray-600" />
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
              <HiSparkles className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
