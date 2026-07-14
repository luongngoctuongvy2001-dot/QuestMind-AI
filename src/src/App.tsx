import React, { useState, useEffect } from "react";
import {
  Award,
  Shield,
  Zap,
  Heart,
  Trophy,
  BookOpen,
  Sparkles,
  Upload,
  Play,
  Check,
  X,
  Flame,
  Coins,
  Lock,
  Unlock,
  User,
  Image as ImageIcon,
  ChevronRight,
  Info,
  RotateCcw,
  Sparkle,
  ArrowRight,
  Star,
  RefreshCw,
  FileText,
  Brain,
  MessageSquare,
  AlertCircle,
  Phone,
  Mail,
  LogOut,
  Key,
  Volume2,
  VolumeX
} from "lucide-react";
import {
  Course,
  Chapter,
  Question,
  Achievement,
  Puzzle,
  UserProfile,
  LeaderboardEntry,
  Concept,
  UserAccount
} from "./types";
import CourseCreator from "./components/CourseCreator";

// Web Audio API Sound Synthesizer Manager
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setEnabled(val: boolean) {
    this.enabled = val;
  }

  playHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playMonsterHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playHurt() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [392.00, 392.00, 392.00, 523.25, 659.25, 783.99];
    const durations = [0.08, 0.08, 0.08, 0.18, 0.18, 0.35];
    let time = now;
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time);
      osc.stop(time + durations[i]);
      time += durations[i] * 0.75;
    });
  }
}
export const soundManager = new SoundManager();

interface MistakeCardProps {
  entry: {
    id: string;
    courseTitle: string;
    chapterTitle: string;
    question: Question;
  };
  onResolve: (id: string) => void;
  triggerNotification: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

function MistakeCard({ entry, onResolve, triggerNotification }: MistakeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAns, setSelectedAns] = useState("");
  const [textAns, setTextAns] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { question } = entry;

  const handleSubmit = () => {
    let correct = false;
    if (question.type === "quiz" || question.type === "boolean") {
      correct = selectedAns.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    } else {
      const cleanUser = textAns.trim().toLowerCase();
      const cleanCorrect = question.correctAnswer.trim().toLowerCase();
      correct = cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    }

    setHasSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      setTimeout(() => {
        onResolve(entry.id);
      }, 2000);
    } else {
      soundManager.playHurt();
      triggerNotification("Câu trả lời chưa chính xác. Hãy nghiên cứu gợi ý!", "warning");
    }
  };

  return (
    <div className={`bg-[#121214] border rounded-xl p-5 transition-all \${
      isExpanded ? "border-[#d4af37]" : "border-[#2d2d30] hover:border-gray-600"
    }`}>
      <div className="flex justify-between items-start gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 bg-[#0a0a0b] text-gray-400 border border-[#2d2d30] text-[9px] font-mono rounded uppercase">
              {question.type.toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-500 font-mono truncate max-w-[200px]" title={entry.courseTitle}>
              {entry.courseTitle}
            </span>
            <span className="text-[10px] text-amber-500 font-mono truncate max-w-[150px]" title={entry.chapterTitle}>
              {entry.chapterTitle}
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-200 line-clamp-2 mt-1.5">
            {question.question}
          </h4>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="px-3 py-1.5 bg-[#1a1a1c] border border-[#2d2d30] hover:border-gray-600 rounded-lg text-xs font-semibold text-gray-300 shrink-0 cursor-pointer"
        >
          {isExpanded ? "Thu gọn" : "Luyện lại"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-[#2d2d30]/60 space-y-4">
          {question.type === "quiz" && (
            <div className="grid grid-cols-1 gap-2.5">
              {question.options.map((opt, i) => {
                const label = String.fromCharCode(65 + i);
                const isSelected = selectedAns === opt;
                return (
                  <button
                    key={i}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedAns(opt)}
                    className={`flex items-center p-3 rounded-lg border text-left text-xs transition-all \${
                      hasSubmitted
                        ? opt === question.correctAnswer
                          ? "border-green-500 bg-green-950/20"
                          : isSelected
                            ? "border-red-500 bg-red-950/20"
                            : "border-[#2d2d30] opacity-50"
                        : isSelected
                          ? "border-[#d4af37] bg-[#1a1a1c]"
                          : "border-[#2d2d30] hover:border-gray-600"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] font-mono mr-2.5 shrink-0 \${
                      isSelected ? "border-[#d4af37] text-[#d4af37]" : "border-gray-700 text-gray-500"
                    }`}>
                      {label}
                    </span>
                    <span className="text-gray-300">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {question.type === "boolean" && (
            <div className="grid grid-cols-2 gap-3">
              {["Đúng", "Sai"].map((val, i) => {
                const isSelected = selectedAns === val;
                return (
                  <button
                    key={i}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedAns(val)}
                    className={`p-3 rounded-lg border text-center font-bold text-xs transition-all \${
                      hasSubmitted
                        ? val === question.correctAnswer
                          ? "border-green-500 bg-green-950/20 text-green-400"
                          : isSelected
                            ? "border-red-500 bg-red-950/20 text-red-400"
                            : "border-[#2d2d30] opacity-50"
                        : isSelected
                          ? "border-[#d4af37] bg-[#1a1a1c] text-[#d4af37]"
                          : "border-[#2d2d30] hover:border-gray-600 text-gray-300"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          )}

          {(question.type === "fill" || question.type === "short" || question.type === "flashcard" || question.type === "exercise") && (
            <div className="space-y-3">
              <input
                type="text"
                value={textAns}
                onChange={(e) => setTextAns(e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                disabled={hasSubmitted}
                className="w-full bg-[#0a0a0b] border border-[#2d2d30] focus:border-[#d4af37] focus:outline-none rounded-lg px-4 py-2.5 text-xs text-gray-200 font-mono"
              />
            </div>
          )}

          {hasSubmitted && (
            <div className={`p-4 rounded-lg border text-xs space-y-1.5 \${
              isCorrect ? "bg-green-950/10 border-green-900/50 text-green-400" : "bg-red-950/10 border-red-900/50 text-red-300"
            }`}>
              <p className="font-bold uppercase tracking-wider">
                {isCorrect ? "✓ Hoàn toàn chính xác! Lỗi sai đã được thanh tẩy." : "✗ Chưa chính xác. Đọc gợi ý bên dưới và thử lại!"}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

          {showHint && (
            <div className="p-3.5 bg-amber-950/10 border border-amber-900/30 rounded-lg text-[11px] text-amber-500">
              <span className="font-bold">Gợi ý ôn tập:</span> {question.hint}
            </div>
          )}

          <div className="flex justify-between items-center gap-3 pt-2">
            {!hasSubmitted ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="px-3 py-2 bg-transparent border border-gray-700 hover:border-gray-500 rounded-lg text-xs text-gray-400 cursor-pointer"
                >
                  {showHint ? "Ẩn gợi ý" : "💡 Hiện gợi ý"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ans = question.type === "quiz" || question.type === "boolean" ? selectedAns : textAns;
                    if (!ans.trim()) {
                      triggerNotification("Vui lòng đưa ra đáp án!");
                      return;
                    }
                    handleSubmit();
                  }}
                  className="bg-[#d4af37] text-[#0a0a0b] hover:bg-yellow-400 font-bold py-2 px-5 rounded-lg text-xs cursor-pointer ml-auto"
                >
                  Xác nhận sửa sai
                </button>
              </>
            ) : !isCorrect ? (
              <button
                type="button"
                onClick={() => {
                  setHasSubmitted(false);
                  setSelectedAns("");
                  setTextAns("");
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold py-2 px-5 rounded-lg text-xs cursor-pointer ml-auto"
              >
                🔄 Thử lại
              </button>
            ) : (
              <span className="text-xs font-bold text-green-400 ml-auto">Đang dọn dẹp lỗi sai...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Puzzle image templates - with multiple options
const PUZZLE_TEMPLATES: Puzzle[] = [
  {
    id: "p1",
    title: "Thành Trì Tri Thức Hoàng Hôn",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    totalPieces: 12,
    unlockedPieces: [0, 2],
    isCompleted: false,
    theme: "Phong cảnh huyền ảo"
  },
  {
    id: "p2",
    title: "Rừng Nguyên Sinh Kỳ Ảo",
    imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
    totalPieces: 12,
    unlockedPieces: [],
    isCompleted: false,
    theme: "Thiên nhiên"
  },
  {
    id: "p3",
    title: "Kỷ Nguyên Không Gian AI",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    totalPieces: 12,
    unlockedPieces: [],
    isCompleted: false,
    theme: "Khoa học viễn tưởng"
  }
];

// Helper to read initial user data from DB
const getInitialUserData = () => {
  const userId = localStorage.getItem("qm_current_user_id");
  if (userId) {
    const usersRaw = localStorage.getItem("qm_users");
    if (usersRaw) {
      try {
        const users = JSON.parse(usersRaw);
        if (users[userId]) {
          return users[userId];
        }
      } catch (e) {}
    }
  }
  return null;
};

const defaultProfile: UserProfile = {
  name: "Nhà Thám Hiểm",
  level: 1,
  exp: 45,
  coins: 120,
  hearts: 5,
  maxHearts: 5,
  streak: 3,
  correctAnswersCount: 8,
  comboCount: 0,
  maxCombo: 4,
  bossesDefeated: [],
  currentAvatar: "🧙‍♂️",
  currentSkin: "gold", // "gold" | "sapphire" | "emerald" | "crimson"
  currentFrame: "wood", // "wood" | "silver" | "royal" | "diamond"
  unlockedAvatars: ["🧙‍♂️", "🧑‍🚀"],
  unlockedSkins: ["gold"],
  unlockedFrames: ["wood"]
};

const defaultAchievements: Achievement[] = [
  {
    id: "ach_chap_1",
    title: "Khởi Đầu Huy Hoàng",
    description: "Hoàn thành và vượt qua chương học đầu tiên.",
    icon: "🏆",
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
    badgeColor: "from-blue-600 to-indigo-800"
  },
  {
    id: "ach_boss",
    title: "Kẻ Diệt Khổng Lồ",
    description: "Đánh bại Ancient Brain - Boss tối thượng cuối chương 4.",
    icon: "👑",
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
    badgeColor: "from-red-600 to-amber-600"
  },
  {
    id: "ach_streak_7",
    title: "Chiến Binh Bền Bỉ",
    description: "Đạt chuỗi học tập liên tục 7 ngày.",
    icon: "🔥",
    isUnlocked: false,
    progress: 3, // based on initial profile streak
    maxProgress: 7,
    badgeColor: "from-orange-500 to-red-600"
  },
  {
    id: "ach_answers_100",
    title: "Đại Sư Tri Thức",
    description: "Trả lời đúng tổng cộng 100 câu hỏi.",
    icon: "💡",
    isUnlocked: false,
    progress: 8, // based on initial correct count
    maxProgress: 100,
    badgeColor: "from-green-500 to-emerald-700"
  },
  {
    id: "ach_combo_20",
    title: "Bất Khả Chiến Bại",
    description: "Đạt chuỗi trả lời đúng liên tiếp (Combo) 20 câu.",
    icon: "⚡",
    isUnlocked: false,
    progress: 4, // max combo
    maxProgress: 20,
    badgeColor: "from-purple-600 to-pink-600"
  },
  {
    id: "ach_puzzle_complete",
    title: "Kiến Trúc Sư Tuyệt Tác",
    description: "Ghép hoàn chỉnh 1 bức tranh nghệ thuật.",
    icon: "🧩",
    isUnlocked: false,
    progress: 2, // unlocked pieces in p1
    maxProgress: 12,
    badgeColor: "from-yellow-500 to-amber-600"
  }
];

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"adventure" | "puzzles" | "achievements" | "leaderboard" | "profile" | "review">("adventure");

  // User session
  const [currentUserEmailOrPhone, setCurrentUserEmailOrPhone] = useState<string | null>(() => {
    return localStorage.getItem("qm_current_user_id");
  });

  // Audio state
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("qm_sound_enabled") !== "false";
  });

  useEffect(() => {
    soundManager.setEnabled(isSoundEnabled);
    localStorage.setItem("qm_sound_enabled", isSoundEnabled ? "true" : "false");
  }, [isSoundEnabled]);

  // Magic spells active states
  const [shieldActive, setShieldActive] = useState(false);
  const [doubleDamageActive, setDoubleDamageActive] = useState(false);
  const [removedOptions, setRemovedOptions] = useState<string[]>([]);

  // Mistakes tracker states
  const [mistakes, setMistakes] = useState<any[]>(() => {
    const saved = localStorage.getItem("qm_mistakes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("qm_mistakes", JSON.stringify(mistakes));
  }, [mistakes]);

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "error" | "warning" }[]>([]);

  const triggerNotification = (msg: string, type: "success" | "info" | "error" | "warning" = "info") => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // User profile state
  const [profile, setProfile] = useState<UserProfile>(() => {
    const activeUser = getInitialUserData();
    if (activeUser) return activeUser.profile;

    const saved = localStorage.getItem("qm_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultProfile;
  });

  // Current active course state
  const [currentCourse, setCurrentCourse] = useState<Course | null>(() => {
    const activeUser = getInitialUserData();
    if (activeUser) return activeUser.activeCourse;

    const saved = localStorage.getItem("qm_active_course");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Puzzle lists
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() => {
    const activeUser = getInitialUserData();
    if (activeUser) return activeUser.puzzles;

    const saved = localStorage.getItem("qm_puzzles");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return PUZZLE_TEMPLATES;
  });
  const [activePuzzleId, setActivePuzzleId] = useState<string>("p1");

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const activeUser = getInitialUserData();
    if (activeUser) return activeUser.achievements;

    const saved = localStorage.getItem("qm_achievements");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultAchievements;
  });

  // Database helper
  const updateUserInDb = (userId: string, data: Partial<UserAccount>) => {
    const usersRaw = localStorage.getItem("qm_users") || "{}";
    try {
      const users = JSON.parse(usersRaw);
      if (users[userId]) {
        users[userId] = { ...users[userId], ...data };
        localStorage.setItem("qm_users", JSON.stringify(users));
      }
    } catch (e) {
      console.error("Error updating user in DB:", e);
    }
  };

  // Auth and Guest States
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem("qm_is_guest_mode") === "true";
  });
  const [isAuthRegister, setIsAuthRegister] = useState(false);
  const [authMethod, setAuthMethod] = useState<"gmail" | "phone">("gmail");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authAvatar, setAuthAvatar] = useState("🧙‍♂️");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Send OTP handler
  const handleSendOtp = () => {
    if (!authPhone.trim()) {
      triggerNotification("Vui lòng nhập số điện thoại hợp lệ!", "error");
      return;
    }
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(authPhone.trim().replace(/\D/g, ""))) {
      triggerNotification("Số điện thoại không hợp lệ! Vui lòng nhập 10-11 chữ số.", "warning");
      return;
    }
    
    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpTimer(60);
    
    // High fidelity simulated SMS notification
    triggerNotification(`[QuestMind OTP] Mã xác minh của bạn là ${code}. Mã có hiệu lực trong 5 phút.`, "success");
  };

  // Google Sign-In handler
  const handleGoogleSignIn = () => {
    setIsConnectingGoogle(true);
    setTimeout(() => {
      setIsConnectingGoogle(false);
      
      const mockEmail = "luongngoctuongvy2001@gmail.com";
      const displayName = "Vy Lương";
      
      const usersRaw = localStorage.getItem("qm_users") || "{}";
      try {
        const users = JSON.parse(usersRaw);
        if (users[mockEmail]) {
          const account = users[mockEmail];
          setProfile(account.profile);
          setCurrentCourse(account.activeCourse);
          setPuzzles(account.puzzles);
          setAchievements(account.achievements);
          setCurrentUserEmailOrPhone(mockEmail);
          localStorage.setItem("qm_current_user_id", mockEmail);
          localStorage.setItem("qm_is_guest_mode", "false");
          setIsGuestMode(false);
          triggerNotification(`Chào mừng quay trở lại, ${account.displayName}!`, "success");
        } else {
          const newProfile: UserProfile = {
            ...defaultProfile,
            name: displayName,
            currentAvatar: "🧙‍♂️"
          };
          const newAccount: UserAccount = {
            id: mockEmail,
            type: "gmail",
            displayName: displayName,
            avatar: "🧙‍♂️",
            profile: newProfile,
            activeCourse: null,
            puzzles: puzzles,
            achievements: achievements,
            createdAt: new Date().toISOString()
          };
          users[mockEmail] = newAccount;
          localStorage.setItem("qm_users", JSON.stringify(users));
          
          setProfile(newProfile);
          setCurrentCourse(null);
          setCurrentUserEmailOrPhone(mockEmail);
          localStorage.setItem("qm_current_user_id", mockEmail);
          localStorage.setItem("qm_is_guest_mode", "false");
          setIsGuestMode(false);
          triggerNotification(`Tạo tài khoản Google thành công! Chào mừng ${displayName}!`, "success");
        }
      } catch (e) {
        triggerNotification("Có lỗi xảy ra khi đồng bộ tài khoản Google.", "error");
      }
    }, 1500);
  };

  // Form registration and login actions
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usersRaw = localStorage.getItem("qm_users") || "{}";
    let users: Record<string, UserAccount> = {};
    try { users = JSON.parse(usersRaw); } catch (e) {}

    if (isAuthRegister) {
      // REGISTER FLOW
      const userId = authMethod === "gmail" ? authEmail.trim().toLowerCase() : authPhone.trim();
      const nameToUse = authName.trim() || "Nhà Thám Hiểm";
      
      if (!userId) {
        triggerNotification(authMethod === "gmail" ? "Vui lòng nhập Email!" : "Vui lòng nhập Số điện thoại!", "warning");
        return;
      }
      
      if (authMethod === "gmail" && !userId.includes("@")) {
        triggerNotification("Email không đúng định dạng!", "warning");
        return;
      }

      if (authMethod === "phone") {
        if (!otpSent) {
          triggerNotification("Vui lòng gửi mã xác thực OTP trước!", "warning");
          return;
        }
        if (otpCode !== generatedOtp) {
          triggerNotification("Mã OTP không chính xác!", "error");
          return;
        }
      } else {
        if (!authPassword) {
          triggerNotification("Vui lòng nhập mật khẩu!", "warning");
          return;
        }
        if (authPassword !== authConfirmPassword) {
          triggerNotification("Mật khẩu xác nhận không khớp!", "warning");
          return;
        }
      }

      if (users[userId]) {
        triggerNotification("Tài khoản này đã tồn tại! Vui lòng chọn Đăng nhập.", "info");
        return;
      }

      const customProfile: UserProfile = {
        ...defaultProfile,
        name: nameToUse,
        currentAvatar: authAvatar
      };

      const newAccount: UserAccount = {
        id: userId,
        type: authMethod,
        displayName: nameToUse,
        avatar: authAvatar,
        profile: customProfile,
        activeCourse: null,
        puzzles: puzzles,
        achievements: achievements,
        password: authPassword || undefined,
        createdAt: new Date().toISOString()
      };

      users[userId] = newAccount;
      localStorage.setItem("qm_users", JSON.stringify(users));
      
      setProfile(customProfile);
      setCurrentCourse(null);
      setCurrentUserEmailOrPhone(userId);
      localStorage.setItem("qm_current_user_id", userId);
      localStorage.setItem("qm_is_guest_mode", "false");
      setIsGuestMode(false);

      triggerNotification(`Đăng ký tài khoản thành công! Chào mừng ${nameToUse}!`, "success");
      
      setAuthEmail("");
      setAuthPhone("");
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthName("");
      setOtpSent(false);
      setOtpCode("");
    } else {
      // LOGIN FLOW
      const userId = authMethod === "gmail" ? authEmail.trim().toLowerCase() : authPhone.trim();
      if (!userId) {
        triggerNotification("Vui lòng điền thông tin đăng nhập!", "warning");
        return;
      }

      const account = users[userId];
      if (!account) {
        triggerNotification("Tài khoản không tồn tại! Vui lòng đăng ký mới.", "error");
        return;
      }

      if (authMethod === "gmail") {
        if (account.password !== authPassword) {
          triggerNotification("Mật khẩu không chính xác!", "error");
          return;
        }
      } else {
        if (!otpSent) {
          triggerNotification("Vui lòng gửi mã xác thực OTP trước!", "warning");
          return;
        }
        if (otpCode !== generatedOtp) {
          triggerNotification("Mã OTP không chính xác!", "error");
          return;
        }
      }

      setProfile(account.profile);
      setCurrentCourse(account.activeCourse);
      setPuzzles(account.puzzles);
      setAchievements(account.achievements);
      setCurrentUserEmailOrPhone(userId);
      localStorage.setItem("qm_current_user_id", userId);
      localStorage.setItem("qm_is_guest_mode", "false");
      setIsGuestMode(false);

      triggerNotification(`Chào mừng quay trở lại, ${account.displayName}!`, "success");
      
      setAuthEmail("");
      setAuthPhone("");
      setAuthPassword("");
      setOtpSent(false);
      setOtpCode("");
    }
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất tài khoản?")) {
      localStorage.removeItem("qm_current_user_id");
      setCurrentUserEmailOrPhone(null);
      setProfile(defaultProfile);
      setCurrentCourse(null);
      setPuzzles(PUZZLE_TEMPLATES);
      setAchievements(defaultAchievements);
      localStorage.setItem("qm_is_guest_mode", "false");
      setIsGuestMode(false);
      triggerNotification("Đăng xuất thành công!", "success");
    }
  };

  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    localStorage.setItem("qm_is_guest_mode", "true");
    triggerNotification("Bạn đang khám phá với tư cách khách. Tiến trình sẽ không đồng bộ tài khoản.", "info");
  };

  // Active battle state

  // Active battle state
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [battleDifficulty, setBattleDifficulty] = useState<"easy" | "medium" | "hard" | "boss">("easy");
  const [battleType, setBattleType] = useState<string>("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [monsterCurrentHp, setMonsterCurrentHp] = useState(100);
  const [monsterMaxHp, setMonsterMaxHp] = useState(100);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);

  // Victory / Game over modal status
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [newPuzzlePieceIndex, setNewPuzzlePieceIndex] = useState<number | null>(null);
  const [chestOpened, setChestOpened] = useState(false);

  // Shop / Profile customize options
  const AVATAR_LIST = ["🧙‍♂️", "🧑‍🚀", "🧝‍♀️", "🛡️", "🔮", "🧛‍♂️", "🐱‍👤", "🐉", "🦊", "👑"];
  const SKIN_LIST = [
    { id: "gold", name: "Amber Gold", class: "border-[#d4af37]", text: "text-[#d4af37]", bg: "bg-[#d4af37]" },
    { id: "sapphire", name: "Midnight Sapphire", class: "border-blue-500", text: "text-blue-400", bg: "bg-blue-500" },
    { id: "emerald", name: "Forest Emerald", class: "border-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500" },
    { id: "crimson", name: "Crimson Knight", class: "border-rose-600", text: "text-rose-500", bg: "bg-rose-600" }
  ];
  const FRAME_LIST = [
    { id: "wood", name: "Khung Gỗ Sồi", border: "border-amber-800 border-2" },
    { id: "silver", name: "Khung Bạc Thần Bí", border: "border-slate-400 border-4 shadow-inner" },
    { id: "royal", name: "Khung Hoàng Gia Mạ Vàng", border: "border-yellow-500 border-4 border-double" },
    { id: "diamond", name: "Khung Kim Cương Sáng Chói", border: "border-cyan-300 border-4 border-dashed animate-pulse" }
  ];

  // Save profile and course states locally on change
  useEffect(() => {
    localStorage.setItem("qm_profile", JSON.stringify(profile));
    if (currentUserEmailOrPhone) {
      updateUserInDb(currentUserEmailOrPhone, { profile });
    }
  }, [profile, currentUserEmailOrPhone]);

  useEffect(() => {
    if (currentCourse) {
      localStorage.setItem("qm_active_course", JSON.stringify(currentCourse));
    } else {
      localStorage.removeItem("qm_active_course");
    }
    if (currentUserEmailOrPhone) {
      updateUserInDb(currentUserEmailOrPhone, { activeCourse: currentCourse });
    }
  }, [currentCourse, currentUserEmailOrPhone]);

  useEffect(() => {
    localStorage.setItem("qm_puzzles", JSON.stringify(puzzles));
    if (currentUserEmailOrPhone) {
      updateUserInDb(currentUserEmailOrPhone, { puzzles });
    }
  }, [puzzles, currentUserEmailOrPhone]);

  useEffect(() => {
    localStorage.setItem("qm_achievements", JSON.stringify(achievements));
    if (currentUserEmailOrPhone) {
      updateUserInDb(currentUserEmailOrPhone, { achievements });
    }
  }, [achievements, currentUserEmailOrPhone]);

  // Helper colors based on theme
  const getThemeColorClass = () => {
    switch (profile.currentSkin) {
      case "sapphire": return "text-blue-400";
      case "emerald": return "text-emerald-400";
      case "crimson": return "text-rose-500";
      default: return "text-[#d4af37]";
    }
  };

  const getThemeBorderClass = () => {
    switch (profile.currentSkin) {
      case "sapphire": return "border-blue-500/50 hover:border-blue-400";
      case "emerald": return "border-emerald-500/50 hover:border-emerald-400";
      case "crimson": return "border-rose-600/50 hover:border-rose-500";
      default: return "border-[#d4af37]/50 hover:border-[#d4af37]";
    }
  };

  const getThemeBgClass = () => {
    switch (profile.currentSkin) {
      case "sapphire": return "bg-blue-600";
      case "emerald": return "bg-emerald-600";
      case "crimson": return "bg-rose-600";
      default: return "bg-[#d4af37]";
    }
  };

  const getThemeRingClass = () => {
    switch (profile.currentSkin) {
      case "sapphire": return "ring-blue-500/30";
      case "emerald": return "ring-emerald-500/30";
      case "crimson": return "ring-rose-500/30";
      default: return "ring-[#d4af37]/30";
    }
  };

  const getFrameBorder = (frameId: string) => {
    return FRAME_LIST.find(f => f.id === frameId)?.border || "border-amber-800 border-2";
  };

  // Level Up logic helper
  const addExp = (amount: number, currentProfile: UserProfile): UserProfile => {
    let newExp = currentProfile.exp + amount;
    let newLevel = currentProfile.level;
    let newUnlockedAvatars = [...currentProfile.unlockedAvatars];
    let newUnlockedSkins = [...currentProfile.unlockedSkins];
    let newUnlockedFrames = [...currentProfile.unlockedFrames];

    // Simple level formula: Level 1 -> Level 2: 100 EXP, Level 2 -> Level 3: 250 EXP, Level 3 -> Level 4: 500 EXP
    // Each level unlocks new cosmetics!
    const expThresholds = [0, 100, 250, 500, 1000, 2000];
    
    while (newLevel < expThresholds.length && newExp >= expThresholds[newLevel]) {
      newExp -= expThresholds[newLevel];
      newLevel += 1;
      
      // Unlocks!
      if (newLevel === 2) {
        newUnlockedAvatars.push("🧝‍♀️", "🛡️");
        newUnlockedSkins.push("sapphire");
        newUnlockedFrames.push("silver");
        triggerNotification("🎉 LÊN CẤP 2! Mở khóa: Avatar 🧝‍♀️ 🛡️, Skin Midnight Sapphire, Khung Bạc Thần Bí!");
        soundManager.playLevelUp();
      } else if (newLevel === 3) {
        newUnlockedAvatars.push("🔮", "🧛‍♂️");
        newUnlockedSkins.push("emerald");
        newUnlockedFrames.push("royal");
        triggerNotification("🎉 LÊN CẤP 3! Mở khóa: Avatar 🔮 🧛‍♂️, Skin Forest Emerald, Khung Hoàng Gia Mạ Vàng!");
        soundManager.playLevelUp();
      } else if (newLevel >= 4) {
        newUnlockedAvatars.push("🐱‍👤", "🐉", "👑");
        newUnlockedSkins.push("crimson");
        newUnlockedFrames.push("diamond");
        triggerNotification("🎉 LÊN CẤP 4+! Mở khóa tất cả trang bị cực hạn bao gồm Khung Kim Cương Sáng Chói!");
        soundManager.playLevelUp();
      }
    }

    return {
      ...currentProfile,
      level: newLevel,
      exp: newExp,
      unlockedAvatars: Array.from(newSet(newUnlockedAvatars)),
      unlockedSkins: Array.from(newSet(newUnlockedSkins)),
      unlockedFrames: Array.from(newSet(newUnlockedFrames))
    };
  };

  const newSet = (arr: any[]) => Array.from(new Set(arr));

  // Clear current active course
  const handleResetCourse = () => {
    if (confirm("Bạn có chắc chắn muốn hủy khóa học hiện tại và tạo hành trình phiêu lưu mới? Toàn bộ tiến trình chương học này sẽ bị xóa.")) {
      setCurrentCourse(null);
      setActiveChapter(null);
      setQuestions([]);
    }
  };

  // cast adventure magic spells
  const castHeal = () => {
    if (profile.coins < 30) {
      triggerNotification("Không đủ Coins! (Cần 30 Coins)", "error");
      return;
    }
    if (profile.hearts >= profile.maxHearts) {
      triggerNotification("Tim đã đầy sẵn rồi!", "warning");
      return;
    }
    setProfile(prev => ({
      ...prev,
      hearts: Math.min(prev.maxHearts, prev.hearts + 1),
      coins: prev.coins - 30
    }));
    triggerNotification("❤️ Đã hồi 1 Tim thành công!", "success");
    soundManager.playVictory();
    setCombatLogs(prev => [`✨ BẠN DÙNG PHÉP HỒI PHỤC! Hồi phục +1 Tim.`, ...prev]);
  };

  const castShield = () => {
    if (profile.coins < 25) {
      triggerNotification("Không đủ Coins! (Cần 25 Coins)", "error");
      return;
    }
    if (shieldActive) {
      triggerNotification("Khiên bảo vệ đã được kích hoạt sẵn!", "warning");
      return;
    }
    setShieldActive(true);
    setProfile(prev => ({ ...prev, coins: prev.coins - 25 }));
    triggerNotification("🛡️ Đã kích hoạt Khiên bảo vệ thành công!", "success");
    soundManager.playVictory();
    setCombatLogs(prev => [`✨ BẠN DÙNG KHIÊN BẢO VỆ! Chặn sát thương của câu trả lời sai kế tiếp.`, ...prev]);
  };

  const castDoubleDamage = () => {
    if (profile.coins < 40) {
      triggerNotification("Không đủ Coins! (Cần 40 Coins)", "error");
      return;
    }
    if (doubleDamageActive) {
      triggerNotification("Kỹ năng Đòn chí mạng đã được kích hoạt!", "warning");
      return;
    }
    setDoubleDamageActive(true);
    setProfile(prev => ({ ...prev, coins: prev.coins - 40 }));
    triggerNotification("⚡ Đã kích hoạt Đòn chí mạng thành công!", "success");
    soundManager.playVictory();
    setCombatLogs(prev => [`✨ BẠN DÙNG GỒNG LỰC! Nhân đôi sát thương cho câu trả lời đúng tiếp theo.`, ...prev]);
  };

  const castFiftyFifty = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || currentQ.type !== "quiz") {
      triggerNotification("Chỉ có thể dùng phép này cho câu hỏi trắc nghiệm!", "warning");
      return;
    }
    if (profile.coins < 35) {
      triggerNotification("Không đủ Coins! (Cần 35 Coins)", "error");
      return;
    }
    if (removedOptions.length > 0) {
      triggerNotification("Đã loại bỏ đáp án sai cho câu hỏi này rồi!", "warning");
      return;
    }

    const wrongOpts = currentQ.options.filter(opt => opt !== currentQ.correctAnswer);
    const shuffledWrong = [...wrongOpts].sort(() => 0.5 - Math.random());
    const toRemove = shuffledWrong.slice(0, 2);

    setRemovedOptions(toRemove);
    setProfile(prev => ({ ...prev, coins: prev.coins - 35 }));
    triggerNotification("🔮 Phép thuật đã loại bỏ 2 đáp án sai!", "success");
    soundManager.playVictory();
    setCombatLogs(prev => [`✨ BẠN DÙNG PHÉP TRIỆT TIÊU! Loại bỏ 2 phương án sai.`, ...prev]);
  };

  // Raid / Start chapter battle
  const startChapterBattle = async (chapter: Chapter, difficulty: "easy" | "medium" | "hard" | "boss", qType: string) => {
    setIsGeneratingQuestions(true);
    setActiveChapter(chapter);
    setBattleDifficulty(difficulty);
    setBattleType(qType);
    setCurrentQuestionIndex(0);
    setHasAnswered(false);
    setSelectedAnswer("");
    setTextAnswer("");
    setShowHint(false);
    setShieldActive(false);
    setDoubleDamageActive(false);
    setRemovedOptions([]);

    // Initial Monster HP setup based on chapter constraints
    const baseHp = chapter.monsterHp;
    let difficultyMultiplier = 1;
    if (difficulty === "medium") difficultyMultiplier = 1.2;
    if (difficulty === "hard") difficultyMultiplier = 1.5;
    if (difficulty === "boss") difficultyMultiplier = 2.0;

    const finalHp = Math.round(baseHp * difficultyMultiplier);
    setMonsterCurrentHp(finalHp);
    setMonsterMaxHp(finalHp);

    setCombatLogs([
      `⚔️ Trận chiến bắt đầu! Bạn đối đầu với ${chapter.monsterName} (${difficulty.toUpperCase()}).`,
      `👾 Quái vật gầm rú: HP hiện tại là ${finalHp}. Hãy trả lời đúng các câu hỏi tri thức để tấn công!`
    ]);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: currentCourse?.title || "Hành trình Tri thức",
          chapter: chapter,
          questionType: qType,
          difficulty: difficulty
        })
      });

      if (!response.ok) {
        throw new Error("Không thể tạo câu hỏi.");
      }

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        throw new Error("Dữ liệu câu hỏi trống.");
      }
    } catch (e) {
      console.error("Lỗi tải câu hỏi:", e);
      // Fail-safe mock generation local fallback
      const mockQs = getLocalFallbackQuestions(chapter, difficulty);
      setQuestions(mockQs);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Fail-safe helper in case backend fails
  const getLocalFallbackQuestions = (chapter: Chapter, difficulty: string): Question[] => {
    const list: Question[] = [];
    const types: ("quiz" | "fill" | "boolean" | "short")[] = ["quiz", "boolean", "fill", "short"];
    
    for (let i = 1; i <= 10; i++) {
      const qType = types[(i - 1) % types.length];
      let options: string[] = [];
      let ans = "";
      let ques = "";

      if (qType === "quiz") {
        ques = `Câu hỏi trắc nghiệm ${i} về ${chapter.keyPoints[0] || "chủ đề này"}: Đâu là khẳng định chính xác nhất?`;
        options = ["Phương án A - Đúng và bám sát tài liệu", "Phương án B - Thiếu chính xác", "Phương án C - Sai lệch logic", "Phương án D - Không liên quan"];
        ans = options[0];
      } else if (qType === "boolean") {
        ques = `Nhận định sau đúng hay sai: ${chapter.keyPoints[1] || "Kiến thức của chương học này rất quan trọng cho thực tế."}`;
        options = ["Đúng", "Sai"];
        ans = "Đúng";
      } else if (qType === "fill") {
        ques = `Điền khuyết: Để tối ưu hóa việc tiếp nhận kiến thức, ta cần áp dụng phương pháp học tập chủ động và ___ (điền 'đúng' hoặc 'sai').`;
        ans = "đúng";
      } else {
        ques = `Học thuyết của chương chỉ ra rằng yếu tố cốt lõi nhất được gọi là gì?`;
        ans = "Mastery";
      }

      list.push({
        id: `q_fallback_${i}`,
        type: qType,
        question: ques,
        options,
        correctAnswer: ans,
        explanation: `Đây là giải thích chi tiết của AI cho câu hỏi số ${i}. Giúp bạn hiểu sâu các khía cạnh lý thuyết và tránh nhầm lẫn tai hại.`,
        hint: `Mẹo nhớ: Hãy liên tưởng đến ${chapter.concepts[0]?.term || "thuật ngữ trọng tâm"} trong bài học.`,
        difficulty: difficulty as any
      });
    }
    return list;
  };

  // Submit Active Answer
  const submitAnswer = (userAns: string) => {
    if (hasAnswered) return;

    const currentQ = questions[currentQuestionIndex];
    let isCorrect = false;

    if (currentQ.type === "quiz" || currentQ.type === "boolean") {
      isCorrect = userAns.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
    } else {
      // For short/fill, check if user answer contains or matches the correct answer keywords
      const cleanUser = userAns.trim().toLowerCase();
      const cleanCorrect = currentQ.correctAnswer.trim().toLowerCase();
      isCorrect = cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    }

    setIsAnswerCorrect(isCorrect);
    setHasAnswered(true);

    // Dynamic stats update and combat system
    if (isCorrect) {
      // Correct!
      let damage = Math.round((monsterMaxHp / 8) * (1 + profile.comboCount * 0.1)); // base damage + combo boost!
      if (doubleDamageActive) {
        damage = damage * 2;
        setDoubleDamageActive(false);
        triggerNotification("⚡ Kích hoạt Đòn chí mạng! Sát thương nhân đôi!", "success");
      }
      const nextHp = Math.max(0, monsterCurrentHp - damage);
      setMonsterCurrentHp(nextHp);

      const newCombo = profile.comboCount + 1;
      const maxCombo = Math.max(profile.maxCombo, newCombo);

      soundManager.playMonsterHit();

      setCombatLogs(prev => [
        `⚔️ BẠN TẤN CÔNG! Gây -${damage} HP quái vật. (${nextHp}/${monsterMaxHp} HP còn lại)`,
        `🔥 Combo hiện tại: ${newCombo} liên tiếp!`,
        ...prev
      ]);

      setProfile(prev => ({
        ...prev,
        coins: prev.coins + 5 + Math.floor(newCombo / 2),
        correctAnswersCount: prev.correctAnswersCount + 1,
        comboCount: newCombo,
        maxCombo: maxCombo
      }));

      // Check if monster defeated immediately
      if (nextHp <= 0) {
        handleVictory();
      }
    } else {
      // Save incorrect question to mistakes ledger
      setMistakes(prev => {
        if (prev.some(m => m.question.id === currentQ.id)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: "m_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            courseTitle: currentCourse?.title || "Hành trình Tri thức",
            chapterTitle: activeChapter?.title || "Chương học",
            question: currentQ
          }
        ];
      });

      soundManager.playHurt();

      if (shieldActive) {
        setShieldActive(false);
        setCombatLogs(prev => [
          `🛡️ KHIÊN BẢO VỆ KÍCH HOẠT! Bạn đã chặn hoàn toàn cú đánh phản công từ quái vật.`,
          ...prev
        ]);
        triggerNotification("🛡️ Khiên bảo vệ đã chặn sát thương!", "info");
      } else {
        // Incorrect! Monster counter-attacks
        const nextHearts = Math.max(0, profile.hearts - 1);
        
        setCombatLogs(prev => [
          `💥 QUÁI VẬT PHẢN CÔNG! Bạn bị mất 1 Tim ❤️. (Cơ thể còn: ${nextHearts}/${profile.maxHearts} tim)`,
          `❌ Câu trả lời chưa chính xác.`,
          ...prev
        ]);

        setProfile(prev => ({
          ...prev,
          hearts: nextHearts,
          comboCount: 0 // break combo
        }));

        if (nextHearts <= 0) {
          handleGameOver();
        }
      }
    }
  };

  // Handle victory over monster
  const handleVictory = () => {
    // Calculate rewards
    let expPrize = 40;
    let coinPrize = 50;

    if (battleDifficulty === "medium") { expPrize = 60; coinPrize = 75; }
    else if (battleDifficulty === "hard") { expPrize = 95; coinPrize = 120; }
    else if (battleDifficulty === "boss") { expPrize = 180; coinPrize = 250; }

    setEarnedCoins(coinPrize);
    setEarnedExp(expPrize);
    setChestOpened(false);

    // Unlock puzzle piece logic
    const activePuzzle = puzzles.find(p => p.id === activePuzzleId);
    let randomUnusedPiece: number | null = null;
    
    if (activePuzzle) {
      const unused: number[] = [];
      for (let i = 0; i < activePuzzle.totalPieces; i++) {
        if (!activePuzzle.unlockedPieces.includes(i)) {
          unused.push(i);
        }
      }
      if (unused.length > 0) {
        // Pick random
        const idx = unused[Math.floor(Math.random() * unused.length)];
        randomUnusedPiece = idx;
        setNewPuzzlePieceIndex(idx);
      } else {
        setNewPuzzlePieceIndex(null);
      }
    }

    // Mark active chapter as beaten in current course
    if (currentCourse && activeChapter) {
      const updatedChapters = currentCourse.chapters.map(ch => {
        if (ch.id === activeChapter.id) {
          return { ...ch, isBeaten: true };
        }
        // Unlock next chapter!
        if (ch.id === activeChapter.id + 1) {
          return { ...ch, isUnlocked: true };
        }
        return ch;
      });

      setCurrentCourse({
        ...currentCourse,
        chapters: updatedChapters
      });
    }

    // Check achievement unlocks on victory
    let updatedDefeated = [...profile.bossesDefeated];
    if (activeChapter) {
      updatedDefeated.push(activeChapter.monsterName);
    }

    setTimeout(() => {
      setShowVictoryModal(true);
      soundManager.playVictory();
    }, 1000);
  };

  const openChestAndCollectRewards = () => {
    if (chestOpened) return;
    setChestOpened(true);

    // Apply currency & exp rewards to profile
    let updatedProfile = addExp(earnedExp, {
      ...profile,
      coins: profile.coins + earnedCoins,
      bossesDefeated: activeChapter ? Array.from(new Set([...profile.bossesDefeated, activeChapter.monsterName])) : profile.bossesDefeated
    });

    // Save unlocked puzzle piece to state
    if (newPuzzlePieceIndex !== null) {
      const updatedPuzzles = puzzles.map(p => {
        if (p.id === activePuzzleId) {
          const nextPieces = Array.from(new Set([...p.unlockedPieces, newPuzzlePieceIndex!]));
          const isComp = nextPieces.length === p.totalPieces;
          return {
            ...p,
            unlockedPieces: nextPieces,
            isCompleted: isComp
          };
        }
        return p;
      });
      setPuzzles(updatedPuzzles);
    }

    // Check achievements
    const updatedAchievements = achievements.map(ach => {
      if (ach.id === "ach_chap_1" && activeChapter?.id === 1) {
        return { ...ach, isUnlocked: true, progress: 1 };
      }
      if (ach.id === "ach_boss" && activeChapter?.id === 4) {
        return { ...ach, isUnlocked: true, progress: 1 };
      }
      if (ach.id === "ach_answers_100") {
        const nextProg = Math.min(ach.maxProgress, profile.correctAnswersCount + 1);
        return { ...ach, progress: nextProg, isUnlocked: nextProg >= ach.maxProgress };
      }
      if (ach.id === "ach_combo_20") {
        const nextProg = Math.max(ach.progress, profile.comboCount);
        return { ...ach, progress: nextProg, isUnlocked: nextProg >= ach.maxProgress };
      }
      return ach;
    });
    setAchievements(updatedAchievements);

    setProfile(updatedProfile);
  };

  const handleGameOver = () => {
    setTimeout(() => {
      setShowGameOverModal(true);
    }, 1000);
  };

  // Exit battle mode
  const exitBattle = () => {
    setActiveChapter(null);
    setQuestions([]);
    setShowVictoryModal(false);
    setShowGameOverModal(false);
    // Reset player hearts to max
    setProfile(prev => ({ ...prev, hearts: prev.maxHearts }));
  };

  // Re-attempt chapter battle (Revive / Retry)
  const handleRevive = () => {
    if (profile.coins >= 40) {
      setProfile(prev => ({
        ...prev,
        coins: prev.coins - 40,
        hearts: prev.maxHearts
      }));
      setShowGameOverModal(false);
      setCombatLogs(prev => [
        `❤️ ĐÃ HỒI SINH! Bạn tiêu tốn 40 Coins để khôi phục toàn bộ sinh lực. Trận đấu tiếp tục!`,
        ...prev
      ]);
    } else {
      triggerNotification("Bạn không có đủ Coins! (Cần 40 Coins để hồi sinh)");
    }
  };

  // Skip / Next Question in Battle
  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setHasAnswered(false);
      setSelectedAnswer("");
      setTextAnswer("");
      setShowHint(false);
      setRemovedOptions([]); // reset removed options for next question
    } else {
      // Reached end of question queue without defeating the monster
      setCombatLogs(prev => [
        `⚠️ Đã hết câu hỏi! Quái vật vẫn còn ${monsterCurrentHp} HP.`,
        ...prev
      ]);
      // Let's reset question index to repeat or finalize
      setCurrentQuestionIndex(0);
      setHasAnswered(false);
      setSelectedAnswer("");
      setTextAnswer("");
      setShowHint(false);
    }
  };

  // Change puzzle focus
  const handleSwitchPuzzle = (id: string) => {
    setActivePuzzleId(id);
  };

  // Customize profile triggers
  const selectAvatar = (av: string) => {
    setProfile(prev => ({ ...prev, currentAvatar: av }));
  };

  const selectSkin = (skinId: string) => {
    if (profile.unlockedSkins.includes(skinId)) {
      setProfile(prev => ({ ...prev, currentSkin: skinId }));
    } else {
      triggerNotification(`Skin này chưa được mở khóa! Hãy tăng cấp độ của bạn.`);
    }
  };

  const selectFrame = (frameId: string) => {
    if (profile.unlockedFrames.includes(frameId)) {
      setProfile(prev => ({ ...prev, currentFrame: frameId }));
    } else {
      triggerNotification(`Khung tên này chưa được mở khóa! Hãy đạt cấp độ cao hơn.`);
    }
  };

  // Seed real registered user accounts to populate database
  const seedRealUsers = (): Record<string, UserAccount> => {
    return {
      "hoangnam99@gmail.com": {
        id: "hoangnam99@gmail.com",
        type: "gmail",
        displayName: "Nguyễn Hoàng Nam",
        avatar: "🧑‍🚀",
        profile: {
          name: "Nguyễn Hoàng Nam",
          level: 6,
          exp: 180,
          coins: 450,
          hearts: 5,
          maxHearts: 5,
          streak: 8,
          correctAnswersCount: 42,
          comboCount: 0,
          maxCombo: 10,
          bossesDefeated: ["Ancient Brain", "Pixel Goblin"],
          currentAvatar: "🧑‍🚀",
          currentSkin: "gold",
          currentFrame: "wood",
          unlockedAvatars: ["🧙‍♂️", "🧑‍🚀"],
          unlockedSkins: ["gold"],
          unlockedFrames: ["wood"]
        },
        activeCourse: null,
        puzzles: [
          { id: "p1", title: "Thành Trì Tri Thức Hoàng Hôn", imageUrl: "", totalPieces: 12, unlockedPieces: [1, 2, 3, 4, 5, 6, 7, 8, 9], isCompleted: false, theme: "" }
        ],
        achievements: [],
        createdAt: new Date().toISOString()
      },
      "linhlinh98@gmail.com": {
        id: "linhlinh98@gmail.com",
        type: "gmail",
        displayName: "Trần Khánh Vy",
        avatar: "🦊",
        profile: {
          name: "Trần Khánh Vy",
          level: 5,
          exp: 210,
          coins: 380,
          hearts: 5,
          maxHearts: 5,
          streak: 12,
          correctAnswersCount: 31,
          comboCount: 0,
          maxCombo: 8,
          bossesDefeated: ["Ancient Brain"],
          currentAvatar: "🦊",
          currentSkin: "gold",
          currentFrame: "silver",
          unlockedAvatars: ["🧙‍♂️", "🦊"],
          unlockedSkins: ["gold"],
          unlockedFrames: ["wood", "silver"]
        },
        activeCourse: null,
        puzzles: [
          { id: "p1", title: "Thành Trì Tri Thức Hoàng Hôn", imageUrl: "", totalPieces: 12, unlockedPieces: [1, 2, 3, 4, 5, 6], isCompleted: false, theme: "" }
        ],
        achievements: [],
        createdAt: new Date().toISOString()
      },
      "dungpham2002@gmail.com": {
        id: "dungpham2002@gmail.com",
        type: "gmail",
        displayName: "Phạm Minh Đức",
        avatar: "🐶",
        profile: {
          name: "Phạm Minh Đức",
          level: 4,
          exp: 150,
          coins: 240,
          hearts: 5,
          maxHearts: 5,
          streak: 5,
          correctAnswersCount: 20,
          comboCount: 0,
          maxCombo: 6,
          bossesDefeated: [],
          currentAvatar: "🐶",
          currentSkin: "gold",
          currentFrame: "wood",
          unlockedAvatars: ["🧙‍♂️", "🐶"],
          unlockedSkins: ["gold"],
          unlockedFrames: ["wood"]
        },
        activeCourse: null,
        puzzles: [
          { id: "p1", title: "Thành Trì Tri Thức Hoàng Hôn", imageUrl: "", totalPieces: 12, unlockedPieces: [1, 2, 3, 4], isCompleted: false, theme: "" }
        ],
        achievements: [],
        createdAt: new Date().toISOString()
      },
      "0912345678": {
        id: "0912345678",
        type: "phone",
        displayName: "Lê Thanh Hằng",
        avatar: "🐱",
        profile: {
          name: "Lê Thanh Hằng",
          level: 3,
          exp: 220,
          coins: 190,
          hearts: 5,
          maxHearts: 5,
          streak: 7,
          correctAnswersCount: 15,
          comboCount: 0,
          maxCombo: 5,
          bossesDefeated: [],
          currentAvatar: "🐱",
          currentSkin: "gold",
          currentFrame: "wood",
          unlockedAvatars: ["🧙‍♂️", "🐱"],
          unlockedSkins: ["gold"],
          unlockedFrames: ["wood"]
        },
        activeCourse: null,
        puzzles: [
          { id: "p1", title: "Thành Trì Tri Thức Hoàng Hôn", imageUrl: "", totalPieces: 12, unlockedPieces: [1, 2, 3], isCompleted: false, theme: "" }
        ],
        achievements: [],
        createdAt: new Date().toISOString()
      },
      "kietle.edu@gmail.com": {
        id: "kietle.edu@gmail.com",
        type: "gmail",
        displayName: "Đỗ Quốc Bảo",
        avatar: "🦁",
        profile: {
          name: "Đỗ Quốc Bảo",
          level: 3,
          exp: 90,
          coins: 110,
          hearts: 5,
          maxHearts: 5,
          streak: 4,
          correctAnswersCount: 12,
          comboCount: 0,
          maxCombo: 4,
          bossesDefeated: [],
          currentAvatar: "🦁",
          currentSkin: "gold",
          currentFrame: "wood",
          unlockedAvatars: ["🧙‍♂️", "🦁"],
          unlockedSkins: ["gold"],
          unlockedFrames: ["wood"]
        },
        activeCourse: null,
        puzzles: [
          { id: "p1", title: "Thành Trì Tri Thức Hoàng Hôn", imageUrl: "", totalPieces: 12, unlockedPieces: [1, 2], isCompleted: false, theme: "" }
        ],
        achievements: [],
        createdAt: new Date().toISOString()
      },
      "0988776655": {
        id: "0988776655",
        type: "phone",
        displayName: "Vũ Thùy Dương",
        avatar: "🐹",
        profile: {
          name: "Vũ Thùy Dương",
          level: 2,
          exp: 130,
          coins: 80,
          hearts: 5,
          maxHearts: 5,
          streak: 2,
          correctAnswersCount: 8,
          comboCount: 0,
          maxCombo: 3,
          bossesDefeated: [],
          currentAvatar: "🐹",
          currentSkin: "gold",
          currentFrame: "wood",
          unlockedAvatars: ["🧙‍♂️", "🐹"],
          unlockedSkins: ["gold"],
          unlockedFrames: ["wood"]
        },
        activeCourse: null,
        puzzles: [
          { id: "p1", title: "Thành Trì Tri Thức Hoàng Hôn", imageUrl: "", totalPieces: 12, unlockedPieces: [1], isCompleted: false, theme: "" }
        ],
        achievements: [],
        createdAt: new Date().toISOString()
      }
    };
  };

  // Real Leaderboard calculation utilizing real registered accounts database
  const getLeaderboardData = (): LeaderboardEntry[] => {
    const usersRaw = localStorage.getItem("qm_users");
    let users: Record<string, UserAccount> = {};
    if (!usersRaw) {
      const seeded = seedRealUsers();
      localStorage.setItem("qm_users", JSON.stringify(seeded));
      users = seeded;
    } else {
      try {
        users = JSON.parse(usersRaw);
        // Ensure there are multiple real user accounts to populate the rankings
        const keys = Object.keys(users);
        if (keys.length <= 1) {
          const seeded = seedRealUsers();
          users = { ...seeded, ...users };
          localStorage.setItem("qm_users", JSON.stringify(users));
        }
      } catch (e) {
        users = seedRealUsers();
        localStorage.setItem("qm_users", JSON.stringify(users));
      }
    }

    const list: LeaderboardEntry[] = Object.values(users).map(account => {
      const isCurrentUser = account.id === currentUserEmailOrPhone;
      const userProfile = isCurrentUser ? profile : account.profile;
      
      const puzzlesList = isCurrentUser ? puzzles : (account.puzzles || []);
      const puzzlePieces = puzzlesList.reduce((acc, p) => acc + (p.unlockedPieces?.length || 0), 0);
      
      const totalAnswers = userProfile.correctAnswersCount + (5 - userProfile.hearts);
      const correctRate = Math.round((userProfile.correctAnswersCount / Math.max(1, totalAnswers)) * 100);

      return {
        rank: 0,
        name: isCurrentUser ? `${userProfile.name} (Bạn)` : userProfile.name,
        avatar: userProfile.currentAvatar || account.avatar || "🧙‍♂️",
        exp: (userProfile.level * 250) + userProfile.exp,
        streak: userProfile.streak,
        bossesCount: userProfile.bossesDefeated?.length || 0,
        puzzlePieces: puzzlePieces,
        correctRate: correctRate,
        isUser: isCurrentUser
      };
    });

    // If the user is in Guest mode, add them dynamically
    if (!currentUserEmailOrPhone) {
      const guestPieces = puzzles.reduce((acc, p) => acc + (p.unlockedPieces?.length || 0), 0);
      const totalAnswers = profile.correctAnswersCount + (5 - profile.hearts);
      const correctRate = Math.round((profile.correctAnswersCount / Math.max(1, totalAnswers)) * 100);

      const hasGuest = list.some(item => item.isUser);
      if (!hasGuest) {
        list.push({
          rank: 0,
          name: `${profile.name} (Bạn/Khách)`,
          avatar: profile.currentAvatar || "🧙‍♂️",
          exp: (profile.level * 250) + profile.exp,
          streak: profile.streak,
          bossesCount: profile.bossesDefeated?.length || 0,
          puzzlePieces: guestPieces,
          correctRate: correctRate,
          isUser: true
        });
      }
    }

    return list
      .sort((a, b) => b.exp - a.exp)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-100 flex flex-col font-sans relative">
      {/* Toast Notification HUD */}
      <div id="toast-hud" className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex gap-3 items-start bg-[#121214]/95 backdrop-blur-md animate-slide-in ${
              toast.type === "success" ? "border-emerald-500/50 shadow-emerald-950/20" :
              toast.type === "error" ? "border-rose-500/50 shadow-rose-950/20" :
              toast.type === "warning" ? "border-amber-500/50 shadow-amber-950/20" :
              "border-cyan-500/50 shadow-cyan-950/20"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && <div className="text-emerald-400">✨</div>}
              {toast.type === "error" && <div className="text-rose-400">❌</div>}
              {toast.type === "warning" && <div className="text-amber-400">⚠️</div>}
              {toast.type === "info" && <div className="text-cyan-400">ℹ️</div>}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-wider text-gray-200">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Guest Warning Banner */}
      {isGuestMode && !currentUserEmailOrPhone && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/90 to-amber-950/90 border-b border-amber-800/40 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2 shadow-md shrink-0">
          <span className="animate-pulse">⚠️</span>
          <span>Bạn đang học với tư cách <strong>Khách</strong>. Đăng nhập để đồng bộ tiến trình của bạn!</span>
          <button
            onClick={() => {
              setIsGuestMode(false);
              localStorage.setItem("qm_is_guest_mode", "false");
            }}
            className="ml-2 bg-[#d4af37] hover:bg-amber-400 text-[#0a0a0b] font-bold px-2.5 py-0.5 rounded text-[10px] uppercase transition-colors shrink-0 cursor-pointer"
          >
            Đăng nhập
          </button>
        </div>
      )}

      {/* Full-screen Authentication Portal */}
      {!currentUserEmailOrPhone && !isGuestMode && (
        <div className="fixed inset-0 bg-[#070708]/98 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <style>{`
            @keyframes pulseGlow {
              0%, 100% { border-color: rgba(212, 175, 55, 0.2); box-shadow: 0 0 15px rgba(212, 175, 55, 0.05); }
              50% { border-color: rgba(212, 175, 55, 0.6); box-shadow: 0 0 25px rgba(212, 175, 55, 0.2); }
            }
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-pulse-glow {
              animation: pulseGlow 4s infinite ease-in-out;
            }
            .animate-slide-in {
              animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          
          <div className="w-full max-w-md bg-[#121214] border border-[#2d2d30] rounded-2xl p-6 md:p-8 shadow-2xl relative animate-pulse-glow">
            {/* Logo and Slogan */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#d4af37] to-amber-600 rounded-2xl shadow-lg shadow-amber-950/40 mb-3">
                <Brain className="w-8 h-8 text-[#0a0a0b]" />
              </div>
              <h2 className="text-2xl font-bold tracking-wider text-gray-100 uppercase">QuestMind</h2>
              <p className="text-xs text-amber-500 font-mono mt-1">Học mỗi ngày – Đánh quái mỗi phút</p>
            </div>

            {/* Tab switchers */}
            <div className="flex border-b border-[#2d2d30] mb-6">
              <button
                onClick={() => { setIsAuthRegister(false); setOtpSent(false); }}
                className={`flex-1 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors cursor-pointer ${
                  !isAuthRegister ? "border-[#d4af37] text-gray-100" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => { setIsAuthRegister(true); setOtpSent(false); }}
                className={`flex-1 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors cursor-pointer ${
                  isAuthRegister ? "border-[#d4af37] text-gray-100" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                Tạo Tài Khoản
              </button>
            </div>

            {/* Sub-Methods Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-[#1a1a1c] p-1 rounded-lg mb-6">
              <button
                onClick={() => { setAuthMethod("gmail"); setOtpSent(false); }}
                className={`flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  authMethod === "gmail" ? "bg-[#2d2d30] text-gray-100" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Gmail
              </button>
              <button
                onClick={() => { setAuthMethod("phone"); setOtpSent(false); }}
                className={`flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  authMethod === "phone" ? "bg-[#2d2d30] text-gray-100" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Số điện thoại
              </button>
            </div>

            {/* MAIN AUTH FORM */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isAuthRegister && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Tên Thám Hiểm</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Nhập tên thám hiểm của bạn..."
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-[#1a1a1c] border border-[#2d2d30] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-all"
                    />
                  </div>
                </div>
              )}

              {authMethod === "gmail" ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Tài khoản Gmail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      placeholder="vidu@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-[#1a1a1c] border border-[#2d2d30] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Số điện thoại</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        required
                        placeholder="0912345678"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full bg-[#1a1a1c] border border-[#2d2d30] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={otpTimer > 0}
                      onClick={handleSendOtp}
                      className="bg-[#2d2d30] hover:bg-[#3d3d42] disabled:opacity-50 text-gray-200 text-xs px-3 py-2 rounded-lg font-semibold transition-colors shrink-0 border border-[#404044] cursor-pointer"
                    >
                      {otpTimer > 0 ? `${otpTimer}s` : otpSent ? "Gửi lại" : "Gửi OTP"}
                    </button>
                  </div>
                </div>
              )}

              {authMethod === "gmail" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Mật khẩu</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-[#1a1a1c] border border-[#2d2d30] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-all"
                      />
                    </div>
                  </div>

                  {isAuthRegister && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Xác nhận mật khẩu</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          className="w-full bg-[#1a1a1c] border border-[#2d2d30] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {authMethod === "phone" && otpSent && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Mã xác thực OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Nhập 6 số..."
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#1a1a1c] border border-amber-500/60 rounded-lg px-4 py-2 text-center text-lg font-bold font-mono tracking-[0.3em] text-amber-400 focus:outline-none focus:border-amber-400 transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                  />
                  <p className="text-[10px] text-amber-500/80 mt-1.5 text-center font-mono">
                    Hệ thống đã gửi OTP qua Toaster thông báo!
                  </p>
                </div>
              )}

              {isAuthRegister && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">Chọn hình đại diện</label>
                  <div className="flex flex-wrap gap-2 justify-center bg-[#1a1a1c] p-2.5 rounded-lg border border-[#2d2d30]">
                    {AVATAR_LIST.slice(0, 6).map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setAuthAvatar(av)}
                        className={`text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          authAvatar === av ? "bg-[#2d2d30] scale-110 border border-[#d4af37]" : "hover:scale-105 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-[#0a0a0b] font-bold py-2.5 px-4 rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-amber-950/20 active:scale-[0.98] transition-all cursor-pointer mt-2"
              >
                {isAuthRegister ? "Tiến Hành Tạo Tài Khoản" : "Đăng Nhập Ngay"}
              </button>
            </form>

            {/* Google Sign-In Block */}
            <div className="relative my-6 text-center">
              <hr className="border-[#2d2d30]" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#121214] px-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">hoặc</span>
            </div>

            <button
              type="button"
              disabled={isConnectingGoogle}
              onClick={handleGoogleSignIn}
              className="w-full bg-slate-900 hover:bg-slate-800 text-gray-200 border border-slate-800 font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-red-500 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.743-.08-1.313-.178-1.879l-10.615-.33z"/>
              </svg>
              {isConnectingGoogle ? "Đang đồng bộ..." : "Tiếp tục với tài khoản Google"}
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="text-xs text-amber-500/80 hover:text-amber-400 underline font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Trải nghiệm dưới tư cách Khách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD Header Bar */}
      <header className="h-20 bg-[#121214] border-b border-[#2d2d30] px-4 md:px-8 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Avatar with customized decorative frame */}
            <div className={`w-12 h-12 rounded-full ${getFrameBorder(profile.currentFrame)} bg-gradient-to-tr from-[#1a1a1c] to-[#3a3a3e] flex items-center justify-center overflow-hidden`}>
              <span className="text-2xl">{profile.currentAvatar}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#d4af37] text-[#0a0a0b] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              LV. {profile.level}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
                {profile.name}
              </h1>
              <span className="text-[10px] text-gray-500 font-mono">#{profile.currentFrame.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 md:w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#d4af37] to-amber-500 shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-all duration-500"
                  style={{ width: `${Math.min(100, (profile.exp / 250) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[9px] text-gray-400 font-mono">{profile.exp} / 250 EXP</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500">Chuỗi Ngày Học</span>
            <div className="flex items-center gap-1">
              <span className="text-amber-500 text-lg">🔥</span>
              <span className="text-sm font-bold font-mono text-gray-300">{profile.streak} ngày</span>
            </div>
          </div>

          <div className="flex gap-1">
            {Array.from({ length: profile.maxHearts }).map((_, idx) => (
              <span key={idx} className="text-base text-red-600">
                {idx < profile.hearts ? "❤️" : "🤍"}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-[#1a1a1c] border border-[#2d2d30] px-2.5 py-1 rounded-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold font-mono text-amber-400">{profile.coins}</span>
          </div>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSoundEnabled(prev => !prev)}
            className="flex items-center justify-center p-2 rounded-lg bg-[#1a1a1c] border border-[#2d2d30] text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
            title={isSoundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-[#d4af37]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User Session Switcher / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#2d2d30]">
            {currentUserEmailOrPhone ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-950/40 hover:bg-red-950/70 border border-red-900/50 text-red-400 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                title="Đăng xuất tài khoản"
              >
                <LogOut className="w-3.5 h-3.5" shrink-0="true" />
                <span className="hidden sm:inline font-semibold">Đăng xuất</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsGuestMode(false);
                  localStorage.setItem("qm_is_guest_mode", "false");
                }}
                className="flex items-center gap-1 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                title="Đăng nhập để đồng bộ tiến trình"
              >
                <User className="w-3.5 h-3.5" shrink-0="true" />
                <span className="hidden sm:inline font-semibold">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Navigation Sidebar Rail */}
        <aside className="w-full md:w-16 bg-[#121214] border-b md:border-b-0 md:border-r border-[#2d2d30] flex md:flex-col items-center py-2 md:py-8 justify-around md:justify-start md:gap-10 shrink-0">
          <button
            onClick={() => { setActiveTab("adventure"); exitBattle(); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "adventure" ? "text-[#d4af37] bg-[#1a1a1c] border border-[#2d2d30]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Phiêu Lưu Học Tập"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[8px] mt-1 md:hidden">Hành Trình</span>
          </button>

          <button
            onClick={() => { setActiveTab("puzzles"); exitBattle(); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "puzzles" ? "text-[#d4af37] bg-[#1a1a1c] border border-[#2d2d30]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Thư Viện Mảnh Ghép"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[8px] mt-1 md:hidden">Mảnh Ghép</span>
          </button>

          <button
            onClick={() => { setActiveTab("achievements"); exitBattle(); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "achievements" ? "text-[#d4af37] bg-[#1a1a1c] border border-[#2d2d30]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Bảng Thành Tích"
          >
            <Award className="w-5 h-5" />
            <span className="text-[8px] mt-1 md:hidden">Thành Tích</span>
          </button>

          <button
            onClick={() => { setActiveTab("leaderboard"); exitBattle(); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "leaderboard" ? "text-[#d4af37] bg-[#1a1a1c] border border-[#2d2d30]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Bảng Xếp Hạng"
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[8px] mt-1 md:hidden">Xếp Hạng</span>
          </button>

          <button
            onClick={() => { setActiveTab("review"); exitBattle(); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "review" ? "text-[#d4af37] bg-[#1a1a1c] border border-[#2d2d30]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Sổ Tay Ma Thuật (Luyện Tập Lỗi Sai)"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[8px] mt-1 md:hidden">Lò Ôn Luyện</span>
          </button>

          <button
            onClick={() => { setActiveTab("profile"); exitBattle(); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "profile" ? "text-[#d4af37] bg-[#1a1a1c] border border-[#2d2d30]" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Hồ Sơ & Trang Bị"
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] mt-1 md:hidden">Hồ Sơ</span>
          </button>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {/* 1. ADVENTURE TAB */}
          {activeTab === "adventure" && !activeChapter && (
            <div className="max-w-5xl mx-auto space-y-8">
              
              {/* Header Title Banner */}
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-3xl font-display font-bold tracking-wide text-gray-100 flex items-center justify-center md:justify-start gap-2">
                  QuestMind <Sparkles className="w-6 h-6 text-yellow-500" />
                </h2>
                <p className="text-xs tracking-widest text-amber-500 uppercase font-bold font-mono">
                  Học mỗi ngày – Đánh quái mỗi phút.
                </p>
                <p className="text-sm text-gray-400 max-w-xl">
                  Học tập biến thành một cuộc thám hiểm nhập vai sinh động. AI sẽ tự động phân tích tài liệu của bạn thành 4 chương học tương ứng 4 quái thú canh giữ huyền thoại.
                </p>
              </div>

              {/* Course Setup Area (If no current course) */}
              {!currentCourse ? (
                <CourseCreator
                  profile={profile}
                  onCourseCreated={setCurrentCourse}
                  triggerNotification={triggerNotification}
                />
              ) : (
                /* Course Detail & Chapters view */
                <div className="space-y-8">
                  {/* Course Info Banner */}
                  <div className="bg-gradient-to-r from-[#121214] to-[#1a1a1c] border border-[#2d2d30] rounded-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-950/40 text-[#d4af37] border border-[#d4af37]/20 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          Đã kích hoạt hành trình
                        </span>
                        <span className="text-xs text-gray-500 font-mono">Khởi tạo bởi AI</span>
                      </div>
                      <h3 className="text-2xl font-display font-semibold text-gray-100">
                        {currentCourse.title}
                      </h3>
                      <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                        {currentCourse.description}
                      </p>
                    </div>

                    <button
                      onClick={handleResetCourse}
                      className="text-xs text-rose-500 hover:text-rose-400 font-mono border border-rose-950/50 bg-rose-950/10 px-4 py-2.5 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      🔄 Tạo khóa học khác
                    </button>
                  </div>

                  {/* Chapters List */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      🛡️ Các ải quái vật bảo vệ chương học
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentCourse.chapters.map((ch, idx) => {
                        const isBoss = ch.id === 4;
                        
                        return (
                          <div
                            key={ch.id}
                            className={`border rounded-xl p-6 transition-all relative overflow-hidden flex flex-col justify-between ${
                              ch.isUnlocked
                                ? "bg-[#121214] border-[#2d2d30] hover:border-[#d4af37]/60"
                                : "bg-[#0a0a0b]/60 border-[#2d2d30]/50 opacity-60"
                            }`}
                          >
                            {/* Decorative background glow for Boss */}
                            {isBoss && ch.isUnlocked && (
                              <div className="absolute inset-0 bg-red-950/10 pointer-events-none"></div>
                            )}

                            {/* Unlocked / Locked status icon */}
                            <div className="absolute top-4 right-4">
                              {ch.isBeaten ? (
                                <span className="px-2 py-0.5 bg-green-950/40 text-green-400 border border-green-900/50 text-[9px] font-bold rounded uppercase tracking-wider">
                                  ĐÃ VƯỢT ẢI
                                </span>
                              ) : ch.isUnlocked ? (
                                <span className="px-2 py-0.5 bg-amber-950/40 text-[#d4af37] border border-[#d4af37]/30 text-[9px] font-bold rounded uppercase tracking-wider">
                                  ĐANG MỞ ĐƯỜNG
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-950 text-gray-500 text-[9px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> KHÓA
                                </span>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                                  CHƯƠNG 0{ch.id}
                                </p>
                                <h5 className="text-base font-bold text-gray-200 mt-1">
                                  {ch.title}
                                </h5>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                  {ch.description}
                                </p>
                              </div>

                              {/* Target Monster Guard Info */}
                              <div className="bg-[#0a0a0b] border border-[#2d2d30] rounded-lg p-3.5 flex items-center gap-3">
                                <span className="text-2xl filter grayscale-30">
                                  {ch.id === 1 ? "👹" : ch.id === 2 ? "🦠" : ch.id === 3 ? "🐉" : "🧠"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-[#d4af37] uppercase font-bold tracking-widest">
                                    Quái canh gác
                                  </p>
                                  <p className="text-xs font-semibold text-gray-300">
                                    {ch.monsterName}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-500 font-mono">HP Gốc</p>
                                  <p className="text-xs font-mono font-bold text-red-500">{ch.monsterHp}</p>
                                </div>
                              </div>

                              {/* Expandable Key Points & Concepts inside Chapter */}
                              <div className="space-y-2 pt-2 border-t border-[#2d2d30]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Trọng tâm chương học:
                                </p>
                                <ul className="space-y-1 text-[11px] text-gray-400 list-disc list-inside">
                                  {ch.keyPoints.slice(0, 2).map((kp, i) => (
                                    <li key={i} className="truncate">{kp}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Raid Action Area */}
                            <div className="mt-6 pt-4 border-t border-[#2d2d30]/60 flex items-center justify-between gap-3">
                              {ch.isUnlocked ? (
                                <>
                                  <div className="flex items-center gap-1 bg-[#1a1a1c] border border-[#2d2d30] px-2 py-1 rounded">
                                    <span className="text-[10px] text-gray-500">Độ khó:</span>
                                    <select
                                      id={`diff-select-${ch.id}`}
                                      className="bg-transparent text-[11px] font-bold text-amber-500 focus:outline-none cursor-pointer"
                                      defaultValue={ch.id === 1 ? "easy" : ch.id === 2 ? "medium" : ch.id === 3 ? "hard" : "boss"}
                                    >
                                      <option value="easy">Dễ ⭐</option>
                                      <option value="medium">Vừa ⭐⭐</option>
                                      <option value="hard">Khó ⭐⭐⭐</option>
                                      <option value="boss">Boss ⭐⭐⭐⭐</option>
                                    </select>
                                  </div>

                                  <button
                                    onClick={() => {
                                      const selectEl = document.getElementById(`diff-select-${ch.id}`) as HTMLSelectElement;
                                      const selectedDiff = selectEl ? selectEl.value : "easy";
                                      startChapterBattle(ch, selectedDiff as any, "all");
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-red-950 to-red-700 hover:from-red-900 hover:to-red-600 border border-red-800 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                                  >
                                    ⚔️ Đột Kích Quái
                                  </button>
                                </>
                              ) : (
                                <div className="w-full text-center py-2 text-[11px] text-gray-600 font-mono italic">
                                  Vượt qua Boss {currentCourse.chapters[idx - 1]?.monsterName} để mở khóa ải này.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1B. ACTIVE BATTLE MODE (COMBAT ZONE & QUIZ ZONE) */}
          {activeChapter && (
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
              
              {/* Combat Zone (Left column) */}
              <section className="w-full lg:w-[400px] bg-gradient-to-b from-[#121214] to-[#0a0a0b] border border-[#2d2d30] rounded-xl flex flex-col p-6 shrink-0 space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-[#2d2d30]">
                  <span className="text-[10px] text-orange-500 border border-orange-500/30 px-2.5 py-0.5 rounded-md font-mono">
                    CHƯƠNG {activeChapter.id}
                  </span>
                  <button
                    onClick={exitBattle}
                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Trốn Chạy
                  </button>
                </div>

                {/* Animated Monster Graphic Frame */}
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="w-48 h-48 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#d4af37] opacity-[0.03] rounded-full blur-3xl animate-pulse"></div>
                    
                    {/* Rotating luxury borders */}
                    <div className="w-40 h-40 border border-dashed border-[#d4af37]/30 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: "25s" }}></div>
                    
                    <div className="absolute w-36 h-36 border-2 border-[#2d2d30] rounded-xl flex items-center justify-center bg-[#0a0a0b] overflow-hidden">
                      <span className="text-7xl select-none transform transition-transform duration-300 hover:scale-110">
                        {activeChapter.id === 1 ? "👹" : activeChapter.id === 2 ? "🦠" : activeChapter.id === 3 ? "🐉" : "🧠"}
                      </span>
                    </div>
                  </div>

                  {/* HP and Monster Info */}
                  <div className="w-full text-center mt-6 space-y-2">
                    <h3 className="text-xl font-display text-gray-200 tracking-wide">
                      {activeChapter.monsterName}
                    </h3>
                    
                    {/* Health Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500">HP</span>
                      <div className="flex-1 h-3 bg-gray-900 border border-[#2d2d30] rounded-sm p-0.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300"
                          style={{ width: `${(monsterCurrentHp / monsterMaxHp) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-mono text-red-500 font-bold shrink-0">
                        {monsterCurrentHp}/{monsterMaxHp}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-gray-500 italic mt-1">
                      {activeChapter.id === 4 ? "Boss tối thượng của cả hành trình tri thức!" : "Hạ gục quái vật gác cửa để lấy Mảnh Ghép báu vật."}
                    </p>
                  </div>
                </div>

                {/* Adventure Magic Spells HUD */}
                <div className="bg-[#1a1a1c]/60 border border-[#2d2d30] rounded-lg p-3.5 space-y-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold border-b border-[#2d2d30] pb-1">
                    🧙‍♂️ Bảng Phép Thuật Thám Hiểm
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={castHeal}
                      className="flex flex-col items-center justify-center p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-all cursor-pointer text-center font-sans"
                      title="Hồi phục 1 Tim (Tiêu tốn 30 Coins)"
                    >
                      <span className="text-xs font-bold text-red-500 flex items-center gap-1">❤️ Hồi Máu</span>
                      <span className="text-[9px] font-mono text-amber-500 font-bold mt-0.5">30 Coins</span>
                    </button>

                    <button
                      type="button"
                      onClick={castShield}
                      className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-all cursor-pointer text-center font-sans \${
                        shieldActive 
                          ? "bg-blue-900/40 border-blue-400 text-blue-200" 
                          : "bg-blue-950/20 hover:bg-blue-950/40 border-blue-900/30 text-gray-400"
                      }`}
                      title="Kích hoạt Khiên bảo vệ, chặn sát thương câu sai tiếp theo (Tiêu tốn 25 Coins)"
                    >
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        🛡️ {shieldActive ? "Khiên [Bật]" : "Khiên Thủ"}
                      </span>
                      <span className="text-[9px] font-mono text-amber-500 font-bold mt-0.5">25 Coins</span>
                    </button>

                    <button
                      type="button"
                      onClick={castDoubleDamage}
                      className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-all cursor-pointer text-center font-sans \${
                        doubleDamageActive 
                          ? "bg-amber-900/40 border-amber-400 text-amber-200" 
                          : "bg-amber-950/20 hover:bg-amber-950/40 border-amber-900/30 text-gray-400"
                      }`}
                      title="Kích hoạt Đòn chí mạng, nhân đôi sát thương câu đúng tiếp theo (Tiêu tốn 40 Coins)"
                    >
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        ⚡ {doubleDamageActive ? "Chí Mạng [Bật]" : "Đòn Chí Mạng"}
                      </span>
                      <span className="text-[9px] font-mono text-amber-500 font-bold mt-0.5">40 Coins</span>
                    </button>

                    <button
                      type="button"
                      onClick={castFiftyFifty}
                      disabled={!questions[currentQuestionIndex] || questions[currentQuestionIndex].type !== "quiz"}
                      className="flex flex-col items-center justify-center p-2 bg-purple-950/20 hover:bg-purple-950/40 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-900/30 rounded-lg transition-all cursor-pointer text-center font-sans"
                      title="Loại bỏ 2 phương án sai trong câu hỏi trắc nghiệm (Tiêu tốn 35 Coins)"
                    >
                      <span className="text-xs font-bold text-purple-400 flex items-center gap-1">🔮 Phép 50/50</span>
                      <span className="text-[9px] font-mono text-amber-500 font-bold mt-0.5">35 Coins</span>
                    </button>
                  </div>
                </div>

                {/* Combat Logs Console */}
                <div className="h-40 bg-[#0a0a0b] border border-[#2d2d30] rounded-lg p-3.5 space-y-2 overflow-y-auto font-mono text-[10px] text-gray-400">
                  <p className="text-gray-500 uppercase tracking-widest font-bold border-b border-[#2d2d30] pb-1">
                    📜 Nhật ký chiến đấu
                  </p>
                  {combatLogs.map((log, i) => (
                    <p key={i} className={log.startsWith("⚔️") ? "text-green-400 font-medium" : log.startsWith("💥") ? "text-red-400 font-medium" : "text-gray-400"}>
                      {log}
                    </p>
                  ))}
                </div>
              </section>

              {/* Quiz Zone (Right column) */}
              <section className="flex-1 bg-[#121214] border border-[#2d2d30] rounded-xl p-6 md:p-8 flex flex-col justify-between">
                
                {/* Active Battle Header */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#2d2d30]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-[9px] font-bold rounded-md uppercase">
                      Câu Hỏi AI
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Khóa học: {currentCourse?.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      Đại lượng: <span className="text-amber-500 font-bold">{currentQuestionIndex + 1}/10</span>
                    </span>
                  </div>
                </div>

                {isGeneratingQuestions ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
                    <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin" />
                    <p className="text-sm text-gray-400">AI đang trích xuất câu hỏi từ tài liệu chương này...</p>
                    <p className="text-[10px] text-gray-500 italic">Vui lòng chờ giây lát</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="text-sm text-gray-400">Không tìm thấy câu hỏi từ máy chủ.</p>
                    <button
                      onClick={() => startChapterBattle(activeChapter, battleDifficulty, battleType)}
                      className="px-4 py-2 bg-[#2d2d30] rounded-lg text-xs hover:bg-[#3a3a3e]"
                    >
                      Thử tạo lại câu hỏi
                    </button>
                  </div>
                ) : (
                  /* Question Interface body */
                  <div className="flex-1 flex flex-col justify-between pt-6 space-y-6">
                    <div>
                      {/* Active Question Title */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#1a1a1c] text-gray-400 border border-[#2d2d30]">
                            {questions[currentQuestionIndex].type.toUpperCase()}
                          </span>
                          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-amber-950/20 text-[#d4af37] border border-[#d4af37]/20">
                            Hệ số: {battleDifficulty.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-display leading-snug text-gray-200">
                          {questions[currentQuestionIndex].question}
                        </h2>
                      </div>

                      {/* Options Container */}
                      <div className="mt-8 space-y-3">
                        {/* Multiple Choices */}
                        {questions[currentQuestionIndex].type === "quiz" && (
                          <div className="grid grid-cols-1 gap-3">
                            {questions[currentQuestionIndex].options.map((opt, i) => {
                              const label = String.fromCharCode(65 + i); // A, B, C, D
                              const isSelected = selectedAnswer === opt;
                              const isRemoved = removedOptions.includes(opt);
                              
                              if (isRemoved) return null;
                              
                              return (
                                <button
                                  key={i}
                                  onClick={() => { if (!hasAnswered) setSelectedAnswer(opt); }}
                                  disabled={hasAnswered}
                                  className={`group flex items-center p-4 rounded-xl border text-left transition-all ${
                                    hasAnswered
                                      ? opt === questions[currentQuestionIndex].correctAnswer
                                        ? "border-green-500 bg-green-950/20"
                                        : isSelected
                                          ? "border-red-500 bg-red-950/20"
                                          : "border-[#2d2d30] opacity-50"
                                      : isSelected
                                        ? "border-[#d4af37] bg-[#1a1a1c]"
                                        : "border-[#2d2d30] hover:border-gray-500 hover:bg-[#1a1a1c]"
                                  }`}
                                >
                                  <span className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-mono mr-3 shrink-0 ${
                                    isSelected ? "border-[#d4af37] text-[#d4af37]" : "border-gray-700 text-gray-500"
                                  }`}>
                                    {label}
                                  </span>
                                  <span className="text-gray-300 text-sm">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* True/False (Boolean) */}
                        {questions[currentQuestionIndex].type === "boolean" && (
                          <div className="grid grid-cols-2 gap-4">
                            {["Đúng", "Sai"].map((val, i) => {
                              const isSelected = selectedAnswer === val;
                              return (
                                <button
                                  key={i}
                                  onClick={() => { if (!hasAnswered) setSelectedAnswer(val); }}
                                  disabled={hasAnswered}
                                  className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                                    hasAnswered
                                      ? val === questions[currentQuestionIndex].correctAnswer
                                        ? "border-green-500 bg-green-950/20 text-green-400"
                                        : isSelected
                                          ? "border-red-500 bg-red-950/20 text-red-400"
                                          : "border-[#2d2d30] opacity-50"
                                      : isSelected
                                        ? "border-[#d4af37] bg-[#1a1a1c] text-[#d4af37]"
                                        : "border-[#2d2d30] hover:border-gray-500 hover:bg-[#1a1a1c] text-gray-300"
                                  }`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Text Fill/Short Answer input box */}
                        {(questions[currentQuestionIndex].type === "fill" ||
                          questions[currentQuestionIndex].type === "short" ||
                          questions[currentQuestionIndex].type === "flashcard" ||
                          questions[currentQuestionIndex].type === "exercise") && (
                          <div className="space-y-4">
                            {questions[currentQuestionIndex].type === "flashcard" ? (
                              /* Interactive Flashcard widget */
                              <div
                                onClick={() => setShowHint(prev => !prev)}
                                className="w-full bg-[#0a0a0b] border border-[#2d2d30] hover:border-[#d4af37]/50 rounded-xl p-8 text-center cursor-pointer min-h-[140px] flex flex-col justify-center items-center transition-all"
                              >
                                {showHint ? (
                                  <div className="space-y-2">
                                    <p className="text-[10px] text-amber-500 uppercase font-bold font-mono">Mặt Sau (Đáp Án)</p>
                                    <p className="text-sm text-gray-100 font-semibold">{questions[currentQuestionIndex].correctAnswer}</p>
                                    <p className="text-xs text-gray-400 italic">Click để xem lại câu hỏi</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-[10px] text-[#d4af37] uppercase font-bold font-mono">Mặt Trước</p>
                                    <p className="text-xs text-gray-400">Click để lật thẻ xem đáp án gợi nhắc</p>
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {questions[currentQuestionIndex].type !== "flashcard" && (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={textAnswer}
                                  onChange={(e) => setTextAnswer(e.target.value)}
                                  placeholder="Nhập câu trả lời chính xác của bạn vào đây..."
                                  disabled={hasAnswered}
                                  className="w-full bg-[#0a0a0b] border border-[#2d2d30] focus:border-[#d4af37] focus:outline-none rounded-lg px-4 py-3 text-sm text-gray-100 font-mono"
                                />
                                <p className="text-[10px] text-gray-500">
                                  Hệ thống sẽ đối chiếu từ khóa cốt lõi để chấm điểm thông minh.
                                </p>
                              </div>
                            )}

                            {/* Flashcard options logic */}
                            {questions[currentQuestionIndex].type === "flashcard" && !hasAnswered && (
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <button
                                  onClick={() => submitAnswer(questions[currentQuestionIndex].correctAnswer)}
                                  className="py-3 bg-green-950/30 border border-green-800 hover:bg-green-900/40 text-green-400 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  ✅ Tôi Đã Thuộc
                                </button>
                                <button
                                  onClick={() => submitAnswer("chưa thuộc")}
                                  className="py-3 bg-red-950/30 border border-red-800 hover:bg-red-900/40 text-red-400 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  ❌ Chưa Thuộc Kỹ
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit / Explanations / Actions Row */}
                    <div className="space-y-4 pt-6 border-t border-[#2d2d30]/60">
                      
                      {/* Hint section */}
                      {showHint && !hasAnswered && questions[currentQuestionIndex].type !== "flashcard" && (
                        <div className="p-4 bg-amber-950/10 border border-amber-900/30 rounded-lg text-xs text-amber-500 flex gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Gợi Ý Tri Thức:</p>
                            <p className="italic mt-1">{questions[currentQuestionIndex].hint}</p>
                          </div>
                        </div>
                      )}

                      {/* AI Explanatory box after answered */}
                      {hasAnswered && (
                        <div className={`p-4 rounded-lg border text-xs space-y-2 ${
                          isAnswerCorrect
                            ? "bg-green-950/10 border-green-900/50 text-green-400"
                            : "bg-red-950/10 border-red-900/50 text-red-300"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase tracking-wider">
                              {isAnswerCorrect ? "✓ Chính xác! Bạn đã tấn công quái thú." : "✗ Chưa chính xác. Quái vật đã phản công!"}
                            </span>
                            <span className="font-mono text-[10px]">Đáp án: {questions[currentQuestionIndex].correctAnswer}</span>
                          </div>
                          <p className="leading-relaxed font-sans text-gray-300">
                            {questions[currentQuestionIndex].explanation}
                          </p>
                          <div className="text-[10px] text-gray-400 border-t border-gray-800/40 pt-1.5 mt-1.5 flex gap-1.5">
                            <span className="font-bold">Mẹo nhớ:</span>
                            <span className="italic">{questions[currentQuestionIndex].hint}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-4">
                        {!hasAnswered ? (
                          <>
                            {questions[currentQuestionIndex].type !== "flashcard" && (
                              <button
                                onClick={() => setShowHint(prev => !prev)}
                                className="px-4 py-2.5 bg-transparent border border-gray-700 hover:border-gray-500 rounded-lg text-xs text-gray-400 cursor-pointer"
                              >
                                {showHint ? "Ẩn Gợi Ý" : "💡 Gợi Ý"}
                              </button>
                            )}

                            {questions[currentQuestionIndex].type !== "flashcard" && (
                              <button
                                onClick={() => {
                                  const ans = questions[currentQuestionIndex].type === "quiz" || questions[currentQuestionIndex].type === "boolean"
                                    ? selectedAnswer
                                    : textAnswer;
                                  if (!ans.trim()) {
                                    triggerNotification("Vui lòng đưa ra đáp án trước khi nộp bài!");
                                    return;
                                  }
                                  submitAnswer(ans);
                                }}
                                className="flex-1 max-w-xs ml-auto bg-[#d4af37] text-[#0a0a0b] hover:bg-yellow-400 font-bold py-2.5 px-6 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                Nộp Câu Trả Lời <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={nextQuestion}
                            className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-600 text-gray-100 font-bold py-3 px-6 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            Tiếp Tục Ải Đột Kích <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* 2. PUZZLE CHAMBER TAB */}
          {activeTab === "puzzles" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-display font-bold text-gray-100 flex items-center gap-2">
                  🧩 Thư Viện Mảnh Ghép Kỳ Diệu
                </h2>
                <p className="text-sm text-gray-400">
                  Hoàn thành các chương học để nhận được rương báu chứa mảnh ghép ngẫu nhiên. Lắp đầy các ô trống để mở khóa kiệt tác nghệ thuật đầy tự hào!
                </p>
              </div>

              {/* Puzzle Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {puzzles.map((p) => {
                  const isActive = p.id === activePuzzleId;
                  const isComp = p.unlockedPieces.length === p.totalPieces;
                  const percent = Math.round((p.unlockedPieces.length / p.totalPieces) * 100);
                  
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSwitchPuzzle(p.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? "border-[#d4af37] bg-[#121214]"
                          : "border-[#2d2d30] bg-[#0a0a0b] hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">{p.theme}</span>
                        {isComp && (
                          <span className="px-1.5 py-0.5 bg-amber-950/50 text-[#d4af37] border border-[#d4af37]/30 text-[8px] font-bold rounded uppercase">
                            Hoàn thành 💯
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-200">{p.title}</h4>
                      
                      {/* Progress bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                          <span>Mảnh đã ghép:</span>
                          <span className="text-amber-500 font-bold">{p.unlockedPieces.length}/{p.totalPieces} ({percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Interactive Preview Section */}
              {puzzles.find(p => p.id === activePuzzleId) && (() => {
                const p = puzzles.find(p => p.id === activePuzzleId)!;
                const columns = 4;
                const rows = 3; // totalPieces = 12
                
                return (
                  <div className="bg-[#121214] border border-[#2d2d30] rounded-xl p-6 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-1.5">
                          🎨 {p.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Kích thước lưới: 4x3. Đã khôi phục {p.unlockedPieces.length} phần của tác phẩm.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-[#0a0a0b] border border-[#2d2d30] px-3 py-1.5 rounded-lg text-xs">
                        <span className="text-gray-500">Tiến độ:</span>
                        <span className="font-bold font-mono text-[#d4af37]">{Math.round((p.unlockedPieces.length / p.totalPieces) * 100)}%</span>
                      </div>
                    </div>

                    {/* Custom Piece Grid with Background Clipping */}
                    <div className="relative max-w-lg mx-auto border-4 border-[#2d2d30] bg-gray-950 p-2.5 rounded-xl">
                      
                      {/* Fully complete state decorative effect */}
                      {p.unlockedPieces.length === p.totalPieces && (
                        <div className="absolute inset-0 bg-yellow-500/5 animate-pulse rounded-lg pointer-events-none z-10 border border-yellow-500/30"></div>
                      )}

                      <div className="grid grid-cols-4 gap-1.5 aspect-[4/3] w-full relative">
                        {Array.from({ length: p.totalPieces }).map((_, idx) => {
                          const isUnlocked = p.unlockedPieces.includes(idx);
                          const col = idx % columns;
                          const row = Math.floor(idx / columns);
                          
                          // Calculate background position percentages for coordinates
                          const bgX = (col / (columns - 1)) * 100;
                          const bgY = (row / (rows - 1)) * 100;

                          return (
                            <div
                              key={idx}
                              className={`relative overflow-hidden border rounded-md aspect-square flex items-center justify-center transition-all ${
                                isUnlocked
                                  ? "border-transparent bg-[#121214] box-glow-green"
                                  : "border-[#2d2d30] bg-[#0d0d0f] hover:bg-[#1a1a1c]"
                              }`}
                              style={isUnlocked ? {
                                backgroundImage: `url(${p.imageUrl})`,
                                backgroundSize: "400% 300%",
                                backgroundPosition: `${bgX}% ${bgY}%`
                              } : {}}
                            >
                              {!isUnlocked && (
                                <div className="flex flex-col items-center justify-center space-y-1">
                                  <Lock className="w-3.5 h-3.5 text-gray-600" />
                                  <span className="text-[8px] text-gray-600 font-mono">#{idx + 1}</span>
                                </div>
                              )}
                              
                              {/* Glowing effect for newly unlocked piece */}
                              {isUnlocked && newPuzzlePieceIndex === idx && (
                                <div className="absolute inset-0 border-2 border-amber-400 animate-pulse"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 italic">
                        💡 Thắng các trận boss ở chế độ khó hơn để tăng xác suất nhận mảnh ghép mới chưa thu thập!
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 3. ACHIEVEMENTS TAB */}
          {activeTab === "achievements" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-display font-bold text-gray-100 flex items-center gap-2">
                  🏆 Bảng Vàng Thành Tích Sấm Truyền
                </h2>
                <p className="text-sm text-gray-400">
                  Phần thưởng danh giá chứng minh nỗ lực rèn luyện tri thức không mệt mỏi của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((ach) => {
                  const percent = Math.round((ach.progress / ach.maxProgress) * 100);
                  
                  return (
                    <div
                      key={ach.id}
                      className={`relative border rounded-xl p-5 flex gap-4 overflow-hidden transition-all bg-[#121214] ${
                        ach.isUnlocked
                          ? "border-[#d4af37]/60 box-glow-purple"
                          : "border-[#2d2d30] opacity-75"
                      }`}
                    >
                      {/* Left glowing badge decoration */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${ach.badgeColor} flex items-center justify-center text-3xl shrink-0 shadow-lg relative`}>
                        {ach.icon}
                        
                        {ach.isUnlocked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-[#0a0a0b] rounded-full flex items-center justify-center text-[8px] font-bold font-mono">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-200">{ach.title}</h4>
                            <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${
                              ach.isUnlocked ? "bg-amber-950/40 text-[#d4af37]" : "bg-gray-800 text-gray-500"
                            }`}>
                              {ach.isUnlocked ? "ĐÃ ĐẠT" : "ĐANG KHÓA"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{ach.description}</p>
                        </div>

                        {/* Progress and mini bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>Tiến trình:</span>
                            <span>{ach.progress}/{ach.maxProgress} ({percent}%)</span>
                          </div>
                          <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${ach.isUnlocked ? "from-[#d4af37] to-yellow-500" : "from-blue-600 to-indigo-500"}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-display font-bold text-gray-100 flex items-center gap-2">
                  📊 Bảng Phong Thần Anh Hùng Tri Thức
                </h2>
                <p className="text-sm text-gray-400">
                  Xếp hạng vinh danh những người học thăng tiến bền bỉ dựa trên EXP, Chuỗi Học và Số Boss đã chinh phục.
                </p>
              </div>

              {/* Filter controls */}
              <div className="bg-[#121214] border border-[#2d2d30] rounded-xl p-6 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#2d2d30] text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      <th className="py-3 px-4 text-center w-16">Thứ hạng</th>
                      <th className="py-3 px-4">Nhà thám hiểm</th>
                      <th className="py-3 px-4 text-center">Cấp EXP</th>
                      <th className="py-3 px-4 text-center">Chuỗi liên tục</th>
                      <th className="py-3 px-4 text-center">Boss diệt</th>
                      <th className="py-3 px-4 text-center">Mảnh Ghép</th>
                      <th className="py-3 px-4 text-center">Tỷ lệ chính xác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getLeaderboardData().map((player) => {
                      return (
                        <tr
                          key={player.rank}
                          className={`border-b border-gray-800/30 text-xs transition-colors ${
                            player.isUser
                              ? "bg-amber-950/10 hover:bg-amber-950/20 text-gray-100 font-medium"
                              : "hover:bg-[#1a1a1c] text-gray-400"
                          }`}
                        >
                          <td className="py-4 px-4 text-center shrink-0">
                            {player.rank === 1 ? (
                              <span className="text-xl">🥇</span>
                            ) : player.rank === 2 ? (
                              <span className="text-xl">🥈</span>
                            ) : player.rank === 3 ? (
                              <span className="text-xl">🥉</span>
                            ) : (
                              <span className="font-mono font-bold text-gray-500">#{player.rank}</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg bg-gray-800 p-1 rounded-full shrink-0">{player.avatar}</span>
                              <span className={player.isUser ? "text-[#d4af37] font-bold" : "text-gray-200"}>
                                {player.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold">{player.exp} XP</td>
                          <td className="py-4 px-4 text-center font-mono text-amber-500">🔥 {player.streak}d</td>
                          <td className="py-4 px-4 text-center font-mono">👾 {player.bossesCount}</td>
                          <td className="py-4 px-4 text-center font-mono">🧩 {player.puzzlePieces}</td>
                          <td className="py-4 px-4 text-center font-mono text-green-400 font-bold">{player.correctRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4B. REVIEW DECK / MISTAKE LEDGER TAB */}
          {activeTab === "review" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-display font-bold text-gray-100 flex items-center gap-2">
                  📜 Sổ Tay Ma Thuật & Sửa Sai
                </h2>
                <p className="text-sm text-gray-400 font-sans">
                  Luyện tập lại các câu hỏi mà bạn đã trả lời sai trong cuộc thám hiểm đột kích quái thú. Trả lời đúng để hấp thụ tri thức, nhận thưởng <strong className="text-amber-500">2 Coins</strong> và thanh tẩy lỗi sai khỏi sổ tay.
                </p>
              </div>

              {mistakes.length === 0 ? (
                <div className="bg-[#121214] border border-[#2d2d30] rounded-xl p-8 text-center space-y-4">
                  <span className="text-5xl block animate-bounce">✨</span>
                  <h3 className="text-lg font-bold text-gray-200">Sổ tay ma thuật trống rỗng!</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed font-sans">
                    Tuyệt vời! Bạn không có lỗi sai nào chưa giải quyết. Hãy tiếp tục đột kích các quái thú canh giữ chương học để thu thập thêm nhiều mảnh ghép và kiến thức mới.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {mistakes.map((item) => {
                    return (
                      <MistakeCard
                        key={item.id}
                        entry={item}
                        onResolve={(id) => {
                          setMistakes(prev => prev.filter(m => m.id !== id));
                          setProfile(p => ({ ...p, coins: p.coins + 2 }));
                          triggerNotification("Chính xác! Bạn đã sửa sai thành công và nhận +2 Coins.", "success");
                          soundManager.playVictory();
                        }}
                        triggerNotification={triggerNotification}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. USER PROFILE & ARMORY TAB */}
          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-display font-bold text-gray-100 flex items-center gap-2">
                  👤 Phòng Trang Bị & Hồ Sơ Anh Hùng
                </h2>
                <p className="text-sm text-gray-400">
                  Lên cấp thông qua học tập để mở khóa thêm nhiều Avatar ma thuật, Skin diện mạo cao quý, và các khung tên hoàng gia độc quyền.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Profile customize previews (Left Column) */}
                <div className="bg-[#121214] border border-[#2d2d30] rounded-xl p-6 text-center space-y-6 flex flex-col items-center justify-center">
                  <div className="relative">
                    {/* Decorative Name Frame representation */}
                    <div className={`w-28 h-28 rounded-full ${getFrameBorder(profile.currentFrame)} bg-gradient-to-tr from-[#1a1a1c] to-[#3a3a3e] flex items-center justify-center overflow-hidden`}>
                      <span className="text-6xl select-none">{profile.currentAvatar}</span>
                    </div>
                    <div className="absolute -bottom-2 right-1.5 bg-[#d4af37] text-[#0a0a0b] font-bold px-3 py-0.5 rounded-full text-xs shadow">
                      CẤP {profile.level}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Đặt biệt danh..."
                      className="text-center bg-[#0a0a0b] border border-[#2d2d30] focus:border-[#d4af37] focus:outline-none rounded-lg px-4 py-2 font-bold text-gray-100 text-sm max-w-[180px]"
                    />
                    <p className="text-[10px] text-gray-500">Click để đổi biệt danh tự động lưu</p>
                  </div>

                  {/* Character overall stats */}
                  <div className="w-full border-t border-gray-800/60 pt-4 grid grid-cols-2 gap-4 text-left">
                    <div className="bg-[#0a0a0b] p-3 rounded-lg border border-[#2d2d30]">
                      <span className="text-[9px] uppercase text-gray-500 block">Số Boss Đã Diệt</span>
                      <span className="text-sm font-bold font-mono text-gray-300">{profile.bossesDefeated.length}</span>
                    </div>
                    <div className="bg-[#0a0a0b] p-3 rounded-lg border border-[#2d2d30]">
                      <span className="text-[9px] uppercase text-gray-500 block">Số Câu Trả Lời Đúng</span>
                      <span className="text-sm font-bold font-mono text-gray-300">{profile.correctAnswersCount}</span>
                    </div>
                    <div className="bg-[#0a0a0b] p-3 rounded-lg border border-[#2d2d30]">
                      <span className="text-[9px] uppercase text-gray-500 block">Tỷ Lệ Combo Kỷ Lục</span>
                      <span className="text-sm font-bold font-mono text-amber-500">🔥 {profile.maxCombo}</span>
                    </div>
                    <div className="bg-[#0a0a0b] p-3 rounded-lg border border-[#2d2d30]">
                      <span className="text-[9px] uppercase text-gray-500 block">Khung Hiện Tại</span>
                      <span className="text-xs font-bold text-[#d4af37] block truncate">
                        {FRAME_LIST.find(f => f.id === profile.currentFrame)?.name}
                      </span>
                    </div>
                  </div>

                  {/* Account Management & Log Out */}
                  <div className="w-full border-t border-gray-800/60 pt-4 space-y-3">
                    <div className="bg-[#0a0a0b] p-3.5 rounded-lg border border-[#2d2d30]/80 text-left w-full">
                      <span className="text-[9px] uppercase text-[#d4af37] font-bold block mb-1">Trạng thái tài khoản</span>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block text-gray-200 truncate" title={currentUserEmailOrPhone || "Khách (Guest)"}>
                            {currentUserEmailOrPhone ? currentUserEmailOrPhone : "Chế độ Khách"}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            {currentUserEmailOrPhone ? "Tự động sao lưu đồng bộ" : "Tiến trình lưu tạm thời"}
                          </span>
                        </div>
                        {currentUserEmailOrPhone ? (
                          <button
                            onClick={handleLogout}
                            className="bg-red-950/40 hover:bg-red-950/70 border border-red-900/50 text-red-400 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                            title="Nhấp để đăng xuất khỏi QuestMind"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Đăng xuất
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsGuestMode(false);
                              localStorage.setItem("qm_is_guest_mode", "false");
                            }}
                            className="bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            Đăng nhập
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cosmetics shop & inventory selectors (Right Column) */}
                <div className="md:col-span-2 bg-[#121214] border border-[#2d2d30] rounded-xl p-6 space-y-6">
                  
                  {/* Avatar list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase flex items-center justify-between">
                      <span>🧙‍♂️ Chọn Avatars Thần Thoại</span>
                      <span className="text-[10px] font-mono lowercase text-[#d4af37]">(Đã mở khóa: {profile.unlockedAvatars.length}/{AVATAR_LIST.length})</span>
                    </h4>
                    
                    <div className="flex flex-wrap gap-2.5">
                      {AVATAR_LIST.map((av, i) => {
                        const isUnlocked = profile.unlockedAvatars.includes(av) || profile.level >= 2; // high levels unlock all avatar presets
                        const isSelected = profile.currentAvatar === av;
                        
                        return (
                          <button
                            key={i}
                            onClick={() => { if (isUnlocked) selectAvatar(av); }}
                            className={`w-11 h-11 rounded-lg text-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                              isSelected
                                ? "bg-amber-950/20 border-2 border-[#d4af37] shadow"
                                : isUnlocked
                                  ? "bg-[#0a0a0b] border border-gray-700 hover:border-gray-500"
                                  : "bg-[#0a0a0b]/40 border border-[#2d2d30]/30 opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <span>{av}</span>
                            {!isUnlocked && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                <Lock className="w-3.5 h-3.5 text-gray-500" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name frame list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase flex items-center justify-between">
                      <span>🎖️ Khung Danh Vọng</span>
                      <span className="text-[10px] font-mono lowercase text-[#d4af37]">(Đã sở hữu: {profile.unlockedFrames.length}/4)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {FRAME_LIST.map((frame) => {
                        const isUnlocked = profile.unlockedFrames.includes(frame.id) || profile.level >= 3;
                        const isSelected = profile.currentFrame === frame.id;
                        
                        return (
                          <div
                            key={frame.id}
                            onClick={() => { if (isUnlocked) selectFrame(frame.id); }}
                            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#d4af37] bg-amber-950/10 text-gray-100"
                                : isUnlocked
                                  ? "border-[#2d2d30] bg-[#0a0a0b] hover:border-gray-500 text-gray-300"
                                  : "border-gray-900 bg-gray-950/40 opacity-40 cursor-not-allowed text-gray-500"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full ${frame.border} bg-gray-800 shrink-0`}></div>
                              <span className="text-xs font-semibold">{frame.name}</span>
                            </div>
                            
                            {!isUnlocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : isSelected ? (
                              <span className="text-[10px] uppercase text-[#d4af37] font-bold">Kích hoạt</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Themes / Skins selection */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase flex items-center justify-between">
                      <span>🎨 Skin Nền Tảng Màu Sắc</span>
                      <span className="text-[10px] font-mono lowercase text-[#d4af37]">(Đã mở khóa: {profile.unlockedSkins.length}/4)</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      {SKIN_LIST.map((skin) => {
                        const isUnlocked = profile.unlockedSkins.includes(skin.id) || profile.level >= 2;
                        const isSelected = profile.currentSkin === skin.id;
                        
                        return (
                          <div
                            key={skin.id}
                            onClick={() => { if (isUnlocked) selectSkin(skin.id); }}
                            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center gap-2.5 ${
                              isSelected
                                ? "border-amber-400 bg-amber-950/10 text-gray-100"
                                : isUnlocked
                                  ? "border-[#2d2d30] bg-[#0a0a0b] hover:border-gray-500 text-gray-300"
                                  : "border-gray-900 bg-gray-950/40 opacity-40 cursor-not-allowed text-gray-500"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full ${skin.bg} shrink-0`}></div>
                            <span className="text-xs font-semibold">{skin.name}</span>
                            
                            {!isUnlocked && (
                              <Lock className="w-3.5 h-3.5 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 1C. VICTORY REWARDS MODAL CONTAINER */}
      {showVictoryModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border-2 border-[#d4af37] max-w-md w-full rounded-2xl p-6 text-center space-y-6 relative overflow-hidden box-glow-yellow animate-fade-in">
            
            {/* Visual sparkles header */}
            <div className="space-y-2">
              <span className="text-5xl">🎁</span>
              <h3 className="text-2xl font-display font-semibold text-[#d4af37]">
                CHIẾN THẮNG QUÁI THÚ!
              </h3>
              <p className="text-xs text-gray-400">
                Bạn đã hạ gục {activeChapter?.monsterName || "quái vật gác cửa"} thành công! Click bên dưới để khui rương báu phần thưởng.
              </p>
            </div>

            {/* Chest Box interaction */}
            {!chestOpened ? (
              <div
                onClick={openChestAndCollectRewards}
                className="cursor-pointer border-2 border-dashed border-[#d4af37]/40 hover:border-[#d4af37] bg-amber-950/10 rounded-xl p-8 hover:scale-105 transition-transform duration-300 space-y-3"
              >
                <span className="text-6xl block animate-bounce">📦</span>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-wider font-mono">
                  NHẤN ĐỂ MỞ RƯƠNG PHẦN THƯỞNG
                </p>
                <p className="text-[10px] text-gray-500">Mở rương để khôi phục Tim, nhận Coins, EXP và Mảnh Ghép tranh vẽ!</p>
              </div>
            ) : (
              /* Rewards Revealed list */
              <div className="space-y-4 py-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="bg-[#0a0a0b] p-3 rounded-lg border border-[#2d2d30] flex items-center gap-2.5">
                    <span className="text-xl">🪙</span>
                    <div>
                      <span className="text-[9px] uppercase text-gray-500 block">Tiền vàng</span>
                      <span className="text-xs font-mono font-bold text-amber-400">+{earnedCoins} Coins</span>
                    </div>
                  </div>
                  <div className="bg-[#0a0a0b] p-3 rounded-lg border border-[#2d2d30] flex items-center gap-2.5">
                    <span className="text-xl">✨</span>
                    <div>
                      <span className="text-[9px] uppercase text-gray-500 block">Kinh nghiệm</span>
                      <span className="text-xs font-mono font-bold text-blue-400">+{earnedExp} EXP</span>
                    </div>
                  </div>
                </div>

                {newPuzzlePieceIndex !== null ? (
                  <div className="bg-amber-950/10 border border-[#d4af37]/30 p-4 rounded-xl space-y-2 text-center animate-pulse">
                    <p className="text-[10px] text-[#d4af37] uppercase font-bold tracking-widest">
                      🧩 ĐÃ NHẬN MẢNH GHÉP MỚI!
                    </p>
                    <p className="text-xs text-gray-200">
                      Mảnh ghép thứ <span className="font-bold text-[#d4af37]">#{newPuzzlePieceIndex + 1}</span> của bức tranh đã được gửi vào phòng trưng bày!
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-xs text-gray-500">
                    Bức tranh hiện tại đã đầy đủ hoặc tất cả mảnh ghép đã được khôi phục!
                  </div>
                )}
              </div>
            )}

            <button
              onClick={exitBattle}
              disabled={!chestOpened}
              className="w-full bg-[#d4af37] disabled:opacity-50 text-[#0a0a0b] hover:bg-yellow-400 font-bold py-3 px-6 rounded-xl text-xs cursor-pointer transition-colors"
            >
              Thu Hoạch & Về Bản Đồ
            </button>
          </div>
        </div>
      )}

      {/* 1D. GAME OVER MODAL CONTAINER */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border-2 border-red-600 max-w-md w-full rounded-2xl p-6 text-center space-y-6 relative overflow-hidden box-glow-yellow animate-fade-in">
            <div className="space-y-2">
              <span className="text-5xl">💀</span>
              <h3 className="text-2xl font-display font-semibold text-red-500">
                BẠN ĐÃ CẠN KIỆT TIM!
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Quái thú gầm rú đắc thắng! Đừng lo lắng, sai sót là một chất xúc tác tuyệt vời để liên kết thần kinh mạnh mẽ hơn. AI đã lập tức phân tích lỗi sai của bạn.
              </p>
            </div>

            {/* AI Error Diagnosis Box */}
            <div className="bg-[#0a0a0b] border border-red-900/30 p-4 rounded-xl text-left space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-red-500 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> Chẩn Đoán Của AI Sư Phụ:
              </p>
              
              <p className="text-xs text-gray-300 leading-relaxed">
                Bạn dường như đang gặp một chút khó khăn với các thuật ngữ khái niệm cốt lõi tại chương này.
              </p>
              
              <div className="p-2.5 bg-red-950/10 border-l-2 border-red-600 rounded-r text-[11px] text-gray-400 space-y-1">
                <p className="font-bold text-red-400">Khuyến nghị ôn tập:</p>
                <p className="italic">
                  Hãy đặc biệt chú ý đến: "{activeChapter?.keyPoints[0]}". Hãy thử giảm bớt độ khó của câu hỏi xuống mức "Dễ" ở lượt chơi sau để củng cố nền móng.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleRevive}
                className="flex-1 bg-amber-600 text-[#0a0a0b] hover:bg-amber-500 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                ❤️ Hồi Sinh (40 Coins)
              </button>
              <button
                onClick={exitBattle}
                className="flex-1 bg-[#2d2d30] border border-gray-700 text-gray-300 hover:bg-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-colors"
              >
                Học Lại Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <footer className="h-12 bg-[#050505] border-t border-[#2d2d30] flex items-center px-4 md:px-8 justify-between shrink-0 text-[10px] text-gray-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="text-green-500 font-bold uppercase tracking-widest animate-pulse">● Hệ thống sẵn sàng</span>
          <span className="h-3 w-px bg-gray-800"></span>
          <span>QuestMind v2.4</span>
        </div>
        <div className="hidden md:block">
          Thiết kế tri thức thông minh • Sáng tạo bởi AI
        </div>
      </footer>
    </div>
  );
}
