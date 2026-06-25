import React from "react";
import { 
  ArrowRight,
  Image,
  Video,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { ActivityLogItem } from "../../types";

interface RightPanelProps {
  activityLogs: ActivityLogItem[];
  onNavigate: (view: string) => void;
  onClearLogs?: () => void;
}

export default function RightPanel({
  activityLogs,
  onNavigate,
  onClearLogs,
}: RightPanelProps) {
  
  // Icon selector mapping
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Image":
        return Image;
      case "Video":
        return Video;
      case "FileText":
        return FileText;
      case "MessageSquare":
        return MessageSquare;
      case "CheckCircle2":
        return CheckCircle2;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="hidden lg:flex w-80 h-full border-l border-gray-150 bg-white/60 dark:border-gray-800 dark:bg-[#0B0F19]/60 p-5 overflow-y-auto flex flex-col transition-colors duration-200">
      
      {/* Title Header with Red hover */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-850">
        <h3 className="font-display font-bold text-gray-900 dark:text-white text-sm tracking-tight flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-red-500" />
          Recent Activity
        </h3>
        <button 
          onClick={() => onNavigate("activity_logs")}
          className="text-transform text-xs font-semibold text-red-600 hover:text-red-750 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-0.5 group cursor-pointer"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Activity Logs content stream */}
      <div className="mt-4 flex-1 space-y-4">
        {activityLogs.length === 0 ? (
          <div className="py-24 text-center">
            <span className="text-xs text-gray-400 dark:text-gray-500">No activity yet. Start posing requests!</span>
          </div>
        ) : (
          activityLogs.map((log) => {
            const LogIcon = getIcon(log.iconName);
            return (
              <div 
                key={log.id}
                className="flex gap-3 text-left items-start group hover:bg-gray-50/50 dark:hover:bg-gray-900/30 p-1.5 rounded-xl transition-colors cursor-pointer"
              >
                {/* Visual badge sphere */}
                <div className={`p-2.5 rounded-xl border shrink-0 ${log.badgeColor} transition-transform group-hover:scale-105 duration-205`}>
                  <LogIcon className="h-4.5 w-4.5" />
                </div>

                {/* Summary textual node */}
                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white leading-none">
                      {log.title}
                    </span>
                    <span className="text-[10px] text-gray-450 dark:text-gray-500 font-mono scale-[0.85] origin-right whitespace-nowrap">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {log.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Visual Workspace statistics/hint accent at bottom */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-4 text-white shadow-md shadow-red-500/10">
        <Sparkles className="h-5 w-5 mb-2" />
        <h4 className="font-display font-bold text-xs">Eurosia OS Pro Suite</h4>
        <p className="text-[10.5px] text-red-100 mt-1 leading-normal">
          Enjoy unlimited server-side Gemini iterations, custom sandbox webpage creation, and ultra-high video resolution limits.
        </p>
      </div>

    </div>
  );
}
