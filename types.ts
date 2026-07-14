export interface Concept {
  term: string;
  definition: string;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  monsterName: string;
  monsterHp: number;
  keyPoints: string[];
  concepts: Concept[];
  formulas?: string[];
  isUnlocked: boolean;
  isBeaten: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  createdAt: string;
}

export interface Question {
  id: string;
  type: "quiz" | "fill" | "boolean" | "short" | "flashcard" | "exercise";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard" | "boss";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  badgeColor: string;
}

export interface Puzzle {
  id: string;
  title: string;
  imageUrl: string;
  totalPieces: number; // e.g. 12 or 16
  unlockedPieces: number[]; // indices of unlocked pieces (0 to totalPieces-1)
  isCompleted: boolean;
  theme: string;
}

export interface UserProfile {
  name: string;
  level: number;
  exp: number;
  coins: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  correctAnswersCount: number;
  comboCount: number;
  maxCombo: number;
  bossesDefeated: string[]; // names of bosses defeated
  currentAvatar: string;
  currentSkin: string;
  currentFrame: string;
  unlockedAvatars: string[];
  unlockedSkins: string[];
  unlockedFrames: string[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  exp: number;
  streak: number;
  bossesCount: number;
  puzzlePieces: number;
  correctRate: number;
  isUser: boolean;
}

export interface UserAccount {
  id: string; // email or phone number
  type: "gmail" | "phone";
  displayName: string;
  avatar: string;
  profile: UserProfile;
  activeCourse: Course | null;
  puzzles: Puzzle[];
  achievements: Achievement[];
  password?: string;
  createdAt: string;
}

