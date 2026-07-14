import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit for document uploads (images, pdf base64, etc.)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to initialize Gemini Client safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// REST Route to Analyze Course Materials
app.post("/api/analyze", async (req, res) => {
  try {
    const { title, textContent, fileName, fileMime, fileData } = req.body;

    if (!textContent && !fileData) {
      return res.status(400).json({ error: "Vui lòng cung cấp nội dung văn bản hoặc tệp tài liệu." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      console.warn("GEMINI_API_KEY is not set or placeholder. Falling back to offline generation.");
      return res.json(getMockCourseAnalysis(title || fileName || "Khóa học offline"));
    }

    let contents: any[] = [];
    let prompt = `Bạn là một trợ lý học thuật AI cao cấp chuyên thiết kế khóa học gamification.
Hãy phân tích tài liệu dưới đây và chia thành một lộ trình học tập gồm 4 chương.
Mỗi chương sẽ tương ứng với một quái vật canh giữ để người học đánh bại.
Hãy tuân thủ cấu trúc sau:
Chương 1: Quái vật 'Goblin Kiến Thức' (HP: 100) - Độ khó dễ. Tập trung vào kiến thức cơ bản nhất.
Chương 2: Quái vật 'Slime Toán/Khoa Học/Logic' hoặc tên tương tự phù hợp chủ đề (HP: 150) - Độ khó trung bình. Tập trung vào công thức hoặc định lý cốt lõi.
Chương 3: Quái vật 'Rồng Kiến Thức' hoặc tương tự phù hợp (HP: 300) - Độ khó cao. Tập trung vào vận dụng và phân tích sâu.
Chương 4 (Boss Cuối): Quái vật 'Ancient Brain' (HP: 1000) - Độ khó Boss. Kiểm tra tổng hợp toàn bộ kiến thức nâng cao trong tài liệu.

Yêu cầu trả về thông tin chi tiết bằng tiếng Việt bao gồm:
1. Tên khóa học phù hợp (nếu người dùng chưa đặt tên hoặc tên quá ngắn)
2. Tóm tắt khóa học
3. Danh sách 4 chương cụ thể:
   - id (1, 2, 3, 4)
   - title (Tên chương)
   - description (Mô tả nội dung học và mục tiêu chương này)
   - monsterName (Tên quái vật gác chương)
   - monsterHp (HP quái vật)
   - keyPoints (Mảng các kiến thức trọng tâm của chương - ít nhất 3 ý)
   - concepts (Mảng các khái niệm và định nghĩa trọng tâm, gồm 'term' và 'definition')
   - formulas (Mảng các công thức hoặc quy tắc chính của chương - có thể để trống nếu không có)
`;

    if (fileData && fileMime) {
      contents.push({
        inlineData: {
          mimeType: fileMime,
          data: fileData, // Base64 representation of the file
        },
      });
      prompt += `\nTài liệu được đính kèm ở dạng tệp tin (${fileName}).`;
    }

    if (textContent) {
      contents.push({
        text: `Nội dung tài liệu học: \n\n${textContent}`,
      });
    }

    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseTitle: { type: Type.STRING, description: "Tên khóa học được thiết kế hay, bám sát nội dung" },
            courseDescription: { type: Type.STRING, description: "Mô tả tổng quan khóa học" },
            chapters: {
              type: Type.ARRAY,
              description: "Lộ trình gồm đúng 4 chương từ cơ bản đến nâng cao",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: "Tiêu đề chương học" },
                  description: { type: Type.STRING, description: "Mô tả chi tiết chương học" },
                  monsterName: { type: Type.STRING, description: "Tên quái vật bảo vệ chương" },
                  monsterHp: { type: Type.INTEGER, description: "HP quái vật (100, 150, 300, hoặc 1000)" },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Các kiến thức trọng tâm cần nhớ"
                  },
                  concepts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: { type: Type.STRING, description: "Thuật ngữ" },
                        definition: { type: Type.STRING, description: "Định nghĩa thuật ngữ" }
                      },
                      required: ["term", "definition"]
                    }
                  },
                  formulas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Các công thức hoặc quy tắc cốt lõi (nếu có, nếu không thì rỗng)"
                  }
                },
                required: ["id", "title", "description", "monsterName", "monsterHp", "keyPoints", "concepts"]
              }
            }
          },
          required: ["courseTitle", "courseDescription", "chapters"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Không nhận được phản hồi từ AI");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Lỗi phân tích tài liệu:", error);
    res.status(500).json({
      error: "Không thể phân tích tài liệu. Đã chuyển sang chế độ tự động tạo khóa học.",
      fallback: getMockCourseAnalysis(req.body.title || "Khóa học Tự động")
    });
  }
});

// REST Route to Generate Questions for a Specific Chapter & Difficulty
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { courseTitle, chapter, questionType, difficulty, customPrompt } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      console.warn("GEMINI_API_KEY is not set. Generating questions offline.");
      return res.json({ questions: getMockQuestions(chapter, questionType, difficulty) });
    }

    const prompt = `Bạn là một AI thiết kế câu hỏi kiểm tra cho game học tập sinh động.
Nhiệm vụ của bạn là tạo ra 10 câu hỏi thuộc chương: "${chapter.title}" thuộc khóa học "${courseTitle}".
Nội dung cốt lõi của chương bao gồm các điểm chính sau:
- Trọng tâm: ${chapter.keyPoints.join(", ")}
- Khái niệm chính: ${chapter.concepts.map((c: any) => `${c.term}: ${c.definition}`).join("; ")}

Yêu cầu cụ thể:
1. Độ khó của lượt chơi: ${difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung bình" : difficulty === "hard" ? "Khó" : "Boss can quét"}
2. Kiểu câu hỏi: ${
      questionType === "all" 
      ? "Trộn lẫn trắc nghiệm (quiz), điền khuyết (fill), đúng/sai (boolean), và tự luận ngắn (short)"
      : questionType === "quiz" ? "Trắc nghiệm 4 lựa chọn"
      : questionType === "fill" ? "Điền khuyết vào chỗ trống (câu chứa ký tự ___ để điền)"
      : questionType === "boolean" ? "Đúng hay Sai"
      : questionType === "short" ? "Câu hỏi trả lời ngắn/bài tập vận dụng"
      : "Flashcard ôn tập phản xạ nhanh"
    }

Cấu trúc câu hỏi cần tạo:
- \`type\`: Phải thuộc một trong các giá trị: 'quiz' | 'fill' | 'boolean' | 'short' | 'flashcard' | 'exercise'
- \`question\`: Nội dung câu hỏi (bằng tiếng Việt, súc tích, hấp dẫn)
- \`options\`: Danh sách các câu trả lời lựa chọn (chỉ dành cho loại 'quiz' - mảng gồm 4 lựa chọn; đối với 'boolean' thì gồm ["Đúng", "Sai"]; các loại khác để mảng rỗng)
- \`correctAnswer\`: Đáp án đúng chính xác để hệ thống chấm điểm tự động (đối với 'quiz' là nội dung của đáp án đúng; đối với 'boolean' là "Đúng" hoặc "Sai"; đối với 'fill' là từ cần điền; đối với 'short'/'exercise' là từ khóa/mẫu đáp án đúng ngắn gọn).
- \`explanation\`: Giải thích khoa học, dễ hiểu vì sao đúng và tại sao các đáp án kia sai (nếu có). Giải thích bằng tiếng Việt thân thiện.
- \`hint\`: Mẹo ghi nhớ nhanh hoặc ví dụ minh họa thực tế giúp người học ghi nhớ sâu.
- \`difficulty\`: độ khó ('easy' | 'medium' | 'hard' | 'boss') bám sát yêu cầu.

Tạo đúng 10 câu hỏi đa dạng, chất lượng cao, tuyệt đối bám sát nội dung chương học.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "ID tự sinh duy nhất ví dụ q1, q2..." },
                  type: { type: Type.STRING, description: "quiz | fill | boolean | short | flashcard | exercise" },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Mảng lựa chọn cho quiz hoặc boolean, rỗng cho loại khác"
                  },
                  correctAnswer: { type: Type.STRING, description: "Đáp án đúng chính xác nhất" },
                  explanation: { type: Type.STRING, description: "Giải thích chi tiết và trực quan" },
                  hint: { type: Type.STRING, description: "Mẹo nhớ nhanh hoặc ví dụ thực tế" },
                  difficulty: { type: Type.STRING, description: "easy | medium | hard | boss" }
                },
                required: ["id", "type", "question", "options", "correctAnswer", "explanation", "hint", "difficulty"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Không nhận được câu hỏi từ AI");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Lỗi tạo câu hỏi:", error);
    res.json({
      questions: getMockQuestions(req.body.chapter, req.body.questionType, req.body.difficulty)
    });
  }
});

// Mock generator for offline fallback/placeholder
function getMockCourseAnalysis(rawTitle: string) {
  const finalTitle = rawTitle.trim() ? rawTitle : "Hành trình Tri thức Kỳ thú";
  return {
    courseTitle: `Chinh Phục ${finalTitle}`,
    courseDescription: "Khóa học phiêu lưu được thiết kế tự động bám sát tài liệu của bạn, giúp bạn làm chủ kiến thức từ cơ bản đến nâng cao thông qua việc vượt ải diệt quái thú.",
    chapters: [
      {
        id: 1,
        title: "Khởi Đầu Hành Trình: Nhận Thức Cơ Bản",
        description: "Làm quen với các thuật ngữ, khái niệm nền tảng đầu tiên trong tài liệu. Vượt qua Goblin Kiến Thức để chứng tỏ bạn đã sẵn sàng.",
        monsterName: "Goblin Kiến Thức",
        monsterHp: 100,
        keyPoints: [
          "Hiểu định nghĩa và nguồn gốc cốt lõi của chủ đề",
          "Nhận diện các thành phần cơ bản cấu thành",
          "Phân biệt các trường hợp sử dụng cơ bản nhất"
        ],
        concepts: [
          { term: "Khái niệm nền tảng", definition: "Điểm khởi đầu cơ bản của toàn bộ hệ thống lý thuyết." },
          { term: "Thành phần cốt lõi", definition: "Các mảnh ghép chính tạo nên cấu trúc tổng thể." }
        ],
        formulas: ["Nguyên lý 80/20: 80% kết quả đến từ 20% nỗ lực cốt lõi."]
      },
      {
        id: 2,
        title: "Vượt Qua Thử Thách: Phương Pháp & Công Thức",
        description: "Đi sâu vào các công thức, phương pháp luận và cấu trúc quy trình. Đánh bại Slime Toán học để làm chủ các công cụ giải quyết vấn đề.",
        monsterName: "Slime Toán",
        monsterHp: 150,
        keyPoints: [
          "Ghi nhớ và áp dụng các công thức tính toán cốt lõi",
          "Thực hiện quy trình giải quyết vấn đề theo từng bước",
          "Học cách tối ưu hóa các tham số đầu vào"
        ],
        concepts: [
          { term: "Phương pháp luận", definition: "Hệ thống các nguyên tắc và phương pháp dùng trong một lĩnh vực." },
          { term: "Quy trình chuẩn", definition: "Các bước thực hiện thống nhất nhằm đạt kết quả tối ưu và giảm sai sót." }
        ],
        formulas: [
          "Công thức Tổng quát: Kết quả = (Kỹ năng + Kiến thức) * Thái độ",
          "Định luật bảo toàn năng lượng trí óc: Tập trung sâu trong 25 phút (Pomodoro)."
        ]
      },
      {
        id: 3,
        title: "Phân Tích Chuyên Sâu: Vận Dụng & Tư Duy",
        description: "Vận dụng kiến thức vào các tình huống thực tế phức tạp, phân tích phản biện và gỡ lỗi sai sót. Hãy hạ gục Rồng Kiến Thức hùng mạnh!",
        monsterName: "Rồng Kiến Thức",
        monsterHp: 300,
        keyPoints: [
          "Phân tích các ca lâm sàng / tình huống thực tế (Case study)",
          "Phát hiện lỗi sai và lỗ hổng logic trong lập luận",
          "So sánh ưu và nhược điểm của các giải pháp khác nhau"
        ],
        concepts: [
          { term: "Tư duy phản biện", definition: "Quá trình phân tích, đánh giá thông tin một cách chủ động và logic." },
          { term: "Vận dụng nâng cao", definition: "Chuyển giao kiến thức lý thuyết vào thực tiễn phức tạp có biến số." }
        ],
        formulas: ["Quy tắc 5 Whys: Hỏi 'Tại sao' liên tiếp 5 lần để tìm ra gốc rễ vấn đề."]
      },
      {
        id: 4,
        title: "Ải Cuối: Làm Chủ Đỉnh Cao Trí Tuệ",
        description: "Trận chiến sinh tử kiểm tra tổng lực toàn diện tất cả khía cạnh và câu hỏi hóc búa nhất. Đối đầu với Boss Tối Thượng Ancient Brain!",
        monsterName: "Ancient Brain",
        monsterHp: 1000,
        keyPoints: [
          "Tổng hợp toàn bộ kiến thức của 3 chương trước",
          "Giải quyết các bài tập tổng hợp và dự án thực tế",
          "Sáng tạo giải pháp mới dựa trên nền tảng sẵn có"
        ],
        concepts: [
          { term: "Sự thấu suốt (Mastery)", definition: "Khả năng giải thích kiến thức phức tạp một cách đơn giản nhất cho người khác hiểu." },
          { term: "Sự sáng tạo", definition: "Kết nối các điểm kiến thức rời rạc thành một giải pháp đột phá mới." }
        ],
        formulas: ["Mô hình Feynman: Học tốt nhất bằng cách dạy lại cho một đứa trẻ 10 tuổi."]
      }
    ]
  };
}

function getMockQuestions(chapter: any, questionType: string, difficulty: string) {
  const cId = chapter?.id || 1;
  const list = [
    {
      id: "q1",
      type: "quiz",
      question: `Theo khái niệm cốt lõi của Chương ${cId}, điểm khởi đầu quan trọng nhất khi tiếp cận vấn đề là gì?`,
      options: [
        "Xác định rõ ràng định nghĩa và phạm vi cốt lõi",
        "Lao ngay vào giải quyết không cần lập kế hoạch",
        "Chờ đợi người khác chỉ dẫn chi tiết",
        "Bỏ qua lý thuyết và chỉ làm theo bản năng"
      ],
      correctAnswer: "Xác định rõ ràng định nghĩa và phạm vi cốt lõi",
      explanation: "Lý thuyết cơ bản luôn là chiếc kim chỉ nam. Việc xác định đúng định nghĩa giúp ta đi đúng hướng và tránh lãng phí nguồn lực.",
      hint: "Hãy nghĩ về nền móng của một ngôi nhà trước khi xây gạch.",
      difficulty: difficulty
    },
    {
      id: "q2",
      type: "boolean",
      options: ["Đúng", "Sai"],
      question: "Để thấu hiểu sâu một chủ đề, việc học vẹt thuộc lòng luôn mang lại hiệu quả cao hơn việc tự giải thích lại theo ngôn ngữ của mình.",
      correctAnswer: "Sai",
      explanation: "Học vẹt chỉ giúp lưu trữ thông tin ngắn hạn. Phương pháp Feynman chỉ ra rằng việc tự giải thích lại bằng ngôn ngữ đơn giản mới chứng tỏ sự thấu hiểu thực sự.",
      hint: "Nhớ đến mô hình Feynman nổi tiếng.",
      difficulty: difficulty
    },
    {
      id: "q3",
      type: "fill",
      options: [],
      question: "Nguyên lý Pareto chỉ ra rằng khoảng ___% kết quả chúng ta đạt được thực chất đến từ việc tập trung tối ưu hóa 20% nỗ lực cốt lõi.",
      correctAnswer: "80",
      explanation: "Nguyên lý 80/20 (Pareto) cực kỳ phổ biến trong quản lý thời gian, kinh tế học và cả học tập hiệu quả.",
      hint: "Hãy điền một con số tròn chục.",
      difficulty: difficulty
    },
    {
      id: "q4",
      type: "short",
      options: [],
      question: `Trong thực tiễn của Chương ${cId}, làm thế nào để hạn chế tối đa việc quên kiến thức sau 24 giờ đầu tiên học tập?`,
      correctAnswer: "Ôn tập ngắt quãng",
      explanation: "Kỹ thuật ôn tập ngắt quãng (Spaced Repetition) giúp tái kích hoạt trí nhớ đúng lúc đường cong lãng quên của Ebbinghaus đi xuống, biến trí nhớ ngắn hạn thành dài hạn.",
      hint: "Lặp lại có chu kỳ thời gian.",
      difficulty: difficulty
    },
    {
      id: "q5",
      type: "quiz",
      question: "Khi đối mặt với một khái niệm quá khó hiểu trong tài liệu, bước đi khôn ngoan nhất của một nhà phiêu lưu học tập là gì?",
      options: [
        "Chia nhỏ khái niệm thành các phần siêu nhỏ để giải quyết từng phần",
        "Đóng sách lại và từ bỏ cuộc chơi",
        "Cố gắng đọc đi đọc lại cả đoạn văn dài một cách vô thức",
        "Đổ lỗi cho tài liệu viết khó hiểu"
      ],
      correctAnswer: "Chia nhỏ khái niệm thành các phần siêu nhỏ để giải quyết từng phần",
      explanation: "Chia để trị (Divide and Conquer) là phương pháp tối thượng trong cả lập trình, toán học và học tập. Khái niệm phức tạp thực chất là tập hợp của nhiều khái niệm đơn giản.",
      hint: "Muốn ăn một quả dưa hấu khổng lồ, bạn phải bổ nó ra thành từng miếng nhỏ.",
      difficulty: difficulty
    },
    {
      id: "q6",
      type: "boolean",
      options: ["Đúng", "Sai"],
      question: "Sai lầm trong quá trình làm bài tập là một cơ hội tuyệt vời để bộ não học tập và củng cố liên kết thần kinh, thay vì là một thất bại.",
      correctAnswer: "Đúng",
      explanation: "Tư duy phát triển (Growth Mindset) khẳng định sai lầm là chất xúc tác mạnh mẽ nhất cho việc học. Khi sai và được sửa, não bộ sẽ nhớ rất sâu.",
      hint: "Quái vật tấn công giúp bạn biết điểm yếu ở đâu để phòng ngự.",
      difficulty: difficulty
    },
    {
      id: "q7",
      type: "fill",
      options: [],
      question: "Để rèn luyện tư duy phản biện, chúng ta nên liên tục đặt câu hỏi '___' để truy vấn sâu xa nguồn gốc của một lập luận hay hiện tượng.",
      correctAnswer: "Tại sao",
      explanation: "Đặt câu hỏi 'Tại sao' giúp chúng ta bóc tách các tầng lớp bề nổi để đi thẳng vào bản chất vấn đề, tránh việc chấp nhận thông tin một chiều.",
      hint: "Từ khóa bắt đầu bằng chữ T.",
      difficulty: difficulty
    },
    {
      id: "q8",
      type: "quiz",
      question: "Đâu là biểu hiện cao nhất của sự thấu suốt (Mastery) kiến thức?",
      options: [
        "Có thể giảng giải chủ đề đó cho một người chưa biết gì hiểu một cách dễ dàng",
        "Sở hữu nhiều bằng cấp chứng chỉ trưng bày",
        "Nói những thuật ngữ chuyên ngành cực kỳ phức tạp không ai hiểu nổi",
        "Nhớ chính xác số trang của cuốn sách chứa kiến thức đó"
      ],
      correctAnswer: "Có thể giảng giải chủ đề đó cho một người chưa biết gì hiểu một cách dễ dàng",
      explanation: "Albert Einstein từng nói: 'Nếu bạn không thể giải thích đơn giản cho một đứa trẻ 6 tuổi hiểu, nghĩa là chính bạn cũng chưa hiểu rõ nó'.",
      hint: "Sự đơn giản chính là tinh hoa tối thượng.",
      difficulty: difficulty
    },
    {
      id: "q9",
      type: "short",
      options: [],
      question: "Hãy kể tên một phương pháp quản lý thời gian học tập tập trung cao độ trong 25 phút rồi nghỉ ngắn 5 phút.",
      correctAnswer: "Pomodoro",
      explanation: "Phương pháp Quả cà chua (Pomodoro) giúp duy trì sự tập trung tối đa của não bộ và tránh mệt mỏi tích tụ.",
      hint: "Tên một loại quả màu đỏ trong tiếng Ý.",
      difficulty: difficulty
    },
    {
      id: "q10",
      type: "quiz",
      question: `Sau khi đánh bại quái vật canh giữ của Chương ${cId}, phần thưởng giá trị nhất mà bạn nhận được để hoàn thiện bức tranh bí ẩn là gì?`,
      options: [
        "Một mảnh ghép bức tranh",
        "Một bình máu đầy lại lập tức",
        "Quyền năng bỏ qua chương tiếp theo",
        "Sự tự mãn tạm thời"
      ],
      correctAnswer: "Một mảnh ghép bức tranh",
      explanation: "Mỗi mảnh ghép bức tranh (Puzzle Piece) là minh chứng cho việc bạn đã chinh phục được một phần tri thức. Ghép đủ tranh sẽ mở ra tuyệt tác nghệ thuật đầy tự hào.",
      hint: "Hãy xem lại mục số 7 trong hướng dẫn phiêu lưu.",
      difficulty: difficulty
    }
  ];
  return list;
}

// Implement Vite middleware or Static files server
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[QuestMind] Server running on http://localhost:${PORT}`);
  });
}

startServer();
