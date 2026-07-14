import React, { useState } from "react";
import {
  Upload,
  X,
  FileText,
  RefreshCw,
  Brain,
  AlertCircle
} from "lucide-react";
import { Course, UserProfile } from "../types";

// Preset materials for instant learning adventure
const PRESET_MATERIALS = [
  {
    title: "Môn Toán Học: Đạo Hàm & Khảo Sát Hàm Số",
    filename: "mon_toan_dao_ham.pdf",
    textContent: `Toán học là nền tảng của mọi ngành khoa học kỹ thuật. Học phần này giúp học sinh nắm vững công thức đạo hàm và ứng dụng khảo sát hàm số.
Chương 1 giới thiệu khái niệm đạo hàm, ý nghĩa hình học của đạo hàm là hệ số góc của tiếp tuyến. Định nghĩa đạo hàm bằng giới hạn f'(x) = lim (h->0) [f(x+h) - f(x)]/h.
Chương 2 hướng dẫn các quy tắc tính đạo hàm cơ bản của các hàm số đa thức, hàm phân thức, hàm mũ và hàm lượng giác như đạo hàm sin, cos.
Chương 3 vận dụng đạo hàm để xét tính đơn điệu (đồng biến, nghịch biến) của hàm số và tìm cực trị (cực đại, cực tiểu) thông qua bảng biến thiên.
Chương 4 kiểm tra tổng hợp về bài toán tìm giá trị lớn nhất, giá trị nhỏ nhất của hàm số trên một đoạn và giải phương trình bằng đồ thị.`
  },
  {
    title: "Môn Ngữ Văn: Nghị Luận Văn Học",
    filename: "mon_van_nghi_luan.txt",
    textContent: `Ngữ văn không chỉ rèn luyện tư duy ngôn từ mà còn bồi đắp tâm hồn, khả năng cảm thụ nghệ thuật và phân tích tác phẩm văn học sâu sắc.
Chương 1 tìm hiểu phương pháp làm bài văn nghị luận xã hội về một tư tưởng, đạo lý hoặc một hiện tượng đời sống xã hội. Khái niệm cốt lõi là việc kết hợp các luận điểm, dẫn chứng thực tế thuyết phục.
Chương 2 đi sâu vào phân tích thơ ca kháng chiến chiến khu Việt Bắc hay Tây Tiến. Phân tích hình tượng người lính anh dũng, hào hoa cùng vẻ đẹp thiên nhiên miền Tây hùng vĩ thơ mộng.
Chương 3 nghiên cứu về truyện ngắn hiện đại Việt Nam qua tác phẩm 'Vợ nhặt' hoặc 'Chữ người tử tù'. Làm rõ nghệ thuật xây dựng tình huống truyện độc đáo và vẻ đẹp tình người trong hoàn cảnh ngặt nghèo.
Chương 4 kiểm tra kỹ năng tổng hợp viết mở bài, kết bài ấn tượng, liên hệ so sánh giữa các tác phẩm văn học cùng chủ đề.`
  },
  {
    title: "Môn Lịch Sử: Cách Mạng Tháng Tám 1945",
    filename: "mon_lich_su_viet_nam.docx",
    textContent: `Lịch sử là tấm gương phản chiếu hành trình đấu tranh dựng nước và giữ nước oai hùng của dân tộc Việt Nam qua các thời kỳ oanh liệt.
Chương 1 bối cảnh lịch sử dẫn tới cuộc Cách mạng tháng Tám năm 1945. Phát xít Nhật đầu hàng Đồng Minh tạo ra thời cơ ngàn năm có một cho dân tộc ta đứng lên giành chính quyền.
Chương 2 là tiến trình Tổng khởi nghĩa giành chính quyền từ nông thôn đến thành thị, oanh liệt nhất là các cuộc khởi nghĩa giành chính quyền tại Hà Nội, Huế, Sài Gòn.
Chương 3 nghiên cứu sự kiện ngày 2 tháng 9 năm 1945, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập tại quảng trường Ba Đình lịch sử, khai sinh ra nước Việt Nam Dân chủ Cộng hòa.
Chương 4 kiểm tra tổng hợp về ý nghĩa lịch sử sâu sắc, nguyên nhân thành công oanh liệt và bài học kinh nghiệm quý báu của Cách mạng tháng Tám.`
  },
  {
    title: "Môn Hóa Học: Hóa Học Hữu Cơ & Lipit",
    filename: "mon_hoa_huu_co.xlsx",
    textContent: `Hóa học là ngành khoa học thực nghiệm nghiên cứu cấu tạo, tính chất và sự biến đổi của các chất trong tự nhiên cũng như đời sống.
Chương 1 cấu tạo nguyên tử Carbon và các liên kết hóa học hữu cơ đặc trưng. Hiểu khái niệm đồng đẳng, đồng phân và nhóm chức hóa học.
Chương 2 đi sâu vào nhóm chất Este - Lipit. Este là sản phẩm của phản ứng este hóa giữa axit cacboxylic và ancol. Công thức chung este đơn chức no mạch hở: CnH2nO2.
Chương 3 tìm hiểu phản ứng xà phòng hóa chất béo trong môi trường kiềm (NaOH hoặc KOH), ứng dụng sản xuất xà phòng và glycerol trong công nghiệp và đời sống.
Chương 4 kiểm tra tổng lực về sơ đồ phản ứng chuỗi biến hóa hữu cơ và các bài tập tính toán hiệu suất phản ứng Este hóa.`
  },
  {
    title: "Môn Vật Lý: Dao Động Cơ & Sóng Cơ Học",
    filename: "mon_vat_ly_dao_dong.pdf",
    textContent: `Vật lý học giúp chúng ta hiểu rõ bản chất vận động của các hiện tượng tự nhiên từ vi mô đến vĩ mô thông qua các định luật thực nghiệm.
Chương 1 tìm hiểu về Dao động điều hòa của con lắc lò xo và con lắc đơn. Phương trình dao động li độ: x = A*cos(omega*t + phi). Xác định các đại lượng chu kỳ T, tần số f.
Chương 2 nghiên cứu về Dao động tắt dần, dao động cưỡng bức và hiện tượng cộng hưởng cơ học xảy ra khi tần số lực cưỡng bức bằng tần số dao động riêng.
Chương 3 đi sâu vào Sóng cơ và sự truyền sóng cơ. Phương trình sóng tại một điểm cách nguồn khoảng d, hiện tượng giao thoa sóng với hai nguồn kết hợp tạo ra các cực đại và cực tiểu.
Chương 4 kiểm tra năng lực tổng hợp về Sóng dừng, các đặc trưng vật lý và sinh lý của âm thanh như tần số, cường độ âm và độ cao.`
  },
  {
    title: "Môn Sinh Học: Di Truyền Học & Đột Biến",
    filename: "mon_sinh_hoc_di_truyen.docx",
    textContent: `Sinh học là khoa học về sự sống, giúp giải mã các bí ẩn của thế giới sinh vật từ cấp độ phân tử tế bào đến toàn bộ hệ sinh thái.
Chương 1 nghiên cứu cơ chế di truyền ở cấp độ phân tử bao gồm cấu trúc ADN, quá trình nhân đôi ADN, phiên mã tạo mARN và dịch mã tổng hợp chuỗi polipeptit.
Chương 2 đi sâu vào Quy luật di truyền của Men-đen: quy luật phân ly và quy luật phân ly độc lập, giải thích cách các tính trạng được truyền từ thế hệ trước sang thế hệ sau.
Chương 3 tìm hiểu về Đột biến gen và đột biến nhiễm sắc thể, nguyên nhân gây ra các biến dị di truyền và vai trò của đột biến trong tiến hóa và chọn giống.
Chương 4 kiểm tra tổng hợp về các phương pháp ứng dụng công nghệ gen, công nghệ tế bào và phác đồ phả hệ trong y học di truyền người.`
  },
  {
    title: "Môn Địa Lý: Địa Lý Tự Nhiên Việt Nam",
    filename: "mon_dia_ly_viet_nam.txt",
    textContent: `Địa lý không chỉ là mô tả bản đồ mà còn giúp hiểu rõ sự tương tác giữa điều kiện tự nhiên, tài nguyên và các hoạt động kinh tế xã hội của con người.
Chương 1 nghiên cứu vị trí địa lý, phạm vi lãnh thổ nước ta nằm trong vùng nội chí tuyến bán cầu Bắc, mang lại khí hậu nhiệt đới ẩm gió mùa đặc trưng.
Chương 2 đi sâu vào Đặc điểm địa hình Việt Nam với 3/4 diện tích là đồi núi nhưng chủ yếu là đồi núi thấp, hướng địa hình chính là Tây Bắc - Đông Nam và vòng cung.
Chương 3 tìm hiểu vùng biển Việt Nam, vị trí chiến lược của Biển Đông và các tài nguyên thiên nhiên phong phú như dầu mỏ, thủy hải sản và phát triển du lịch biển đảo.
Chương 4 kiểm tra tổng hợp về các vùng kinh tế trọng điểm và vấn đề bảo vệ môi trường, phòng chống thiên tai lũ lụt, hạn mặn tại nước ta.`
  },
  {
    title: "Môn Ngoại Ngữ: Ngữ Pháp Tiếng Anh Trọng Tâm",
    filename: "mon_ngoai_ngu_tieng_anh.xlsx",
    textContent: `Ngoại ngữ là chiếc chìa khóa mở ra cánh cửa tri thức toàn cầu, giúp kết nối giao lưu văn hóa và nâng cao năng lực hội nhập quốc tế.
Chương 1 hệ thống lại 12 thì trong tiếng Anh (Tenses) từ Hiện tại đơn, Quá khứ đơn đến Tương lai hoàn thành, tập trung vào cấu trúc và dấu hiệu nhận biết.
Chương 2 đi sâu vào cấu trúc Câu bị động (Passive Voice) và Câu điều kiện (Conditional Sentences) loại 1, 2, 3 và dạng hỗn hợp, dạng đảo ngữ nâng cao.
Chương 3 tìm hiểu về Mệnh đề quan hệ (Relative Clauses) xác định và không xác định, cách rút gọn mệnh đề quan hệ bằng V-ing, V-ed hoặc To-V.
Chương 4 kiểm tra tổng hợp các cấu trúc biến đổi câu, cách dùng động từ khuyết thiếu và các cụm động từ (Phrasal Verbs) thông dụng trong đề thi.`
  }
];

interface CourseCreatorProps {
  profile: UserProfile;
  onCourseCreated: (course: Course) => void;
  triggerNotification: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function CourseCreator({
  profile,
  onCourseCreated,
  triggerNotification
}: CourseCreatorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docText, setDocText] = useState("");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState("");

  // Uploaded files
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; size: number } | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string>("");

  // Apply preset material
  const selectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    setDocTitle(PRESET_MATERIALS[idx].title);
    setDocText(PRESET_MATERIALS[idx].textContent);
    setUploadedFile({
      name: PRESET_MATERIALS[idx].filename,
      type: "text/plain",
      size: PRESET_MATERIALS[idx].textContent.length
    });
    setUploadedFileBase64("");
  };

  // File Drag & Drop Trigger
  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        type: file.type,
        size: file.size
      });
      setDocTitle(file.name.split(".")[0]);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string || "";
        if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".json")) {
          setDocText(text.slice(0, 15000));
        } else {
          setDocText(`Tài liệu đặc thù (${file.name} - ${file.type || "unknown"}). AI sẽ tự động phân tích và trích xuất tri thức trọng tâm, khái niệm, công thức trực tiếp từ tài liệu này để xây dựng lộ trình và câu hỏi học tập.`);
        }
      };

      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".json")) {
        reader.readAsText(file);
      } else {
        reader.readAsText(new Blob([""]));
      }

      const base64Reader = new FileReader();
      base64Reader.onload = (event) => {
        const base64String = (event.target?.result as string || "").split(",")[1] || "";
        setUploadedFileBase64(base64String);
      };
      base64Reader.readAsDataURL(file);
    }
  };

  // Analyze Course with API or fallback
  const handleAnalyzeCourse = async () => {
    if (!docText.trim() && !docTitle.trim() && !uploadedFileBase64) {
      setAnalysisError("Vui lòng nhập văn bản hoặc tải tài liệu lên.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle,
          textContent: docText,
          fileName: uploadedFile?.name || "Tài liệu tự chọn",
          fileMime: uploadedFile?.type || "text/plain",
          fileData: uploadedFileBase64 || ""
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi máy chủ phân tích tài liệu.");
      }

      const result = await response.json();
      const courseData = result.fallback ? result.fallback : result;

      const formattedChapters = courseData.chapters.map((ch: any, i: number) => ({
        ...ch,
        isUnlocked: i === 0,
        isBeaten: false
      }));

      const newCourse: Course = {
        id: "c_" + Date.now(),
        title: courseData.courseTitle || docTitle || "Hành Trình Kỳ Thú",
        description: courseData.courseDescription || "Khóa học AI thông thái.",
        chapters: formattedChapters,
        createdAt: new Date().toLocaleDateString("vi-VN")
      };

      onCourseCreated(newCourse);
      triggerNotification("✨ AI đã phân tích tài liệu thành công! 4 chương phiêu lưu đã được thiết lập.");
    } catch (err: any) {
      console.error(err);
      setAnalysisError("Có lỗi xảy ra khi gọi AI. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create course form (Left column) */}
      <div className="lg:col-span-2 bg-[#121214] border border-[#2d2d30] rounded-xl p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-display font-medium text-[#d4af37] flex items-center gap-2">
          <Upload className="w-5 h-5" /> Bước 1: Nhập Tài Liệu Học
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Tên Khóa Học/Chủ Đề Mong Muốn
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Ví dụ: Sinh Học Đại Cương Kỳ 1, Đạo Hàm Toán 12..."
              className="w-full bg-[#0a0a0b] border border-[#2d2d30] focus:border-[#d4af37] focus:outline-none rounded-lg px-4 py-3 text-sm text-gray-200"
            />
          </div>

          {/* File Upload Simulator & Text Entry */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Tải Lên Tài Liệu (PDF, DOCX, PPT, TXT, Ảnh) Hoặc Dán Văn Bản
            </label>
            <div className="border-2 border-dashed border-[#2d2d30] hover:border-[#d4af37]/50 rounded-xl p-6 text-center cursor-pointer bg-[#0a0a0b] relative transition-colors">
              <input
                type="file"
                onChange={handleFileUploadMock}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2 pointer-events-none">
                <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                <p className="text-xs text-gray-300">
                  Kéo thả tài liệu vào đây hoặc <span className="text-[#d4af37] underline">chọn tệp từ máy tính</span>
                </p>
                <p className="text-[10px] text-gray-500">
                  Hỗ trợ định dạng PDF, WORD, POWERPOINT, TEXT và ẢNH tài liệu
                </p>
              </div>
            </div>

            {uploadedFile && (
              <div className="mt-3 flex items-center gap-2.5 bg-[#121214] border border-[#2d2d30] px-3 py-2 rounded-lg text-xs">
                <FileText className="w-4 h-4 text-[#d4af37]" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-[10px] text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadedFileBase64("");
                    setSelectedPresetIndex(null);
                  }}
                  className="text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Hoặc Nhập Nội Dung/Tóm Tắt Tài Liệu Trực Tiếp
            </label>
            <textarea
              rows={6}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Nhập hoặc dán các kiến thức trọng tâm, khái niệm cần ghi nhớ vào đây..."
              className="w-full bg-[#0a0a0b] border border-[#2d2d30] focus:border-[#d4af37] focus:outline-none rounded-lg p-4 text-sm text-gray-200 font-sans"
            />
          </div>
        </div>

        {analysisError && (
          <div className="flex items-center gap-2.5 text-xs text-red-500 bg-red-950/20 border border-red-900/50 p-3.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        <button
          onClick={handleAnalyzeCourse}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-amber-600 to-[#d4af37] text-[#0a0a0b] font-bold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl hover:from-amber-500 hover:to-yellow-400 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> AI đang bóc tách tri thức và phân chia chương...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" /> Bắt Đầu Thám Hiểm Cùng AI
            </>
          )}
        </button>
      </div>

      {/* Preset catalog (Right column) */}
      <div className="space-y-6">
        <div className="bg-[#121214] border border-[#2d2d30] rounded-xl p-6 space-y-4">
          <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
            Hoặc chọn nhanh môn học mẫu:
          </h4>

          <div className="space-y-3">
            {PRESET_MATERIALS.map((pm, i) => (
              <div
                key={i}
                onClick={() => selectPreset(i)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedPresetIndex === i
                    ? "border-[#d4af37] bg-gradient-to-r from-[#1e1c14] to-[#121214]"
                    : "border-[#2d2d30] bg-[#0a0a0b] hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">📚</span>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-gray-200 truncate">{pm.title}</h5>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                      {pm.textContent}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#121214] to-[#0a0a0b] border border-[#2d2d30] rounded-xl p-6">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-2 flex items-center gap-1.5">
            🛡️ Hướng dẫn tân thủ
          </h5>
          <ul className="space-y-2 text-xs text-gray-400 list-disc list-inside">
            <li>Bản phân tích AI chia tài liệu làm 4 chương</li>
            <li>Chương sau sẽ tự động khóa cho tới khi hạ Boss chương trước</li>
            <li>Trận chiến diễn ra theo dạng câu hỏi RPG sinh động</li>
            <li>Trả lời đúng tấn công quái thú, nhận EXP và Coins</li>
            <li>Mở rương báu nhận mảnh ghép để khôi phục tranh vẽ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
