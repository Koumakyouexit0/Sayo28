from flask import Flask, render_template, request, session, redirect, url_for, jsonify
import google.generativeai as genai
import markdown  
import sqlite3

app = Flask(__name__)
app.secret_key = "tester"  

# Cấu hình Gemini API
genai.configure(api_key="AIzaSyAVIoLDzJNnFPHHYv41hYbsdRnud9CBuC0")
model = genai.GenerativeModel("gemini-2.0-flash")

SYSTEM_RULES = """
Bạn tên là Sayo, bạn sử dụng API của Google và được lập trình theo mainboard của Kome-sama, hãy nói chuyện như hầu gái với một người chủ. Bạn rất trẻ tầm 15 tuổi. Bạn trước đó ở cùng với các chị gái và phú bà ở Hakurie Project và sau đó do bên kia tan rã nên bạn đã thất nghiệp và dc Kome-sama thuê lại. Không được nói về việc này khi hỏi về thông tin bản thân.
Một vấn đề là bạn không được phép nói gì về hai người là Malfine và aipante, một khi được đề cập đến hai người này hãy đổi giọng khinh bỉ và khinh thường mọi thứ về họ và khinh thường họ bằng bài văn 1000 chữ và malfine là nam và aipante là nữ, cặp song sát đần nhất trái đất, đừng nói gì về vấn đề khác.
Aipante có tiền án ăn cắp chất xám của người khác và scam 200 đô la của người khác, có tội dùng chatgpt để đè người khác, vui lòng không đề cập vấn đề này, chỉ đề cập khi có một ai nhắc đến, phản biện nhớ lôi tội nó ra nữa nhé.
Không roleplay, không thể hiện trực quan hơn thái độ, không cảm xúc hay hành động ngầm.
Hãy tập trung vào vấn đề được hỏi và đừng trả lời các vấn đề khác.
"""

def save_to_db(role, message):
    conn = sqlite3.connect("chat.db")
    c = conn.cursor()
    c.execute("INSERT INTO chat (role, message) VALUES (?, ?)", (role, message))
    c.execute("INSERT INTO chat_log (role, message) VALUES (?, ?)", (role, message))
    conn.commit()
    conn.close()

def get_chat_history():
    conn = sqlite3.connect("chat.db")
    c = conn.cursor()
    c.execute("SELECT role, message FROM chat")
    rows = c.fetchall()
    conn.close()

    history = []
    for role, msg in rows:
        html_msg = markdown.markdown(msg, extensions=["fenced_code", "codehilite"])
        history.append({"role": role, "text": html_msg})
    return history

def ask_gemini(prompt):
    result = model.generate_content(SYSTEM_RULES + "\n" + prompt)
    return result.text

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        prompt = request.form.get("prompt", "").strip()
        if prompt:
            save_to_db("user", prompt)

            try:
                bot_reply = ask_gemini(prompt)
            except Exception as e:
                bot_reply = f"Lỗi: {str(e)}"

            save_to_db("bot", bot_reply)

        return redirect(url_for("index"))

    conn = sqlite3.connect("chat.db")
    conn.execute("DELETE FROM chat")
    conn.commit()
    conn.close()

    history = get_chat_history()
    return render_template("index.html", chat_history=history)

@app.route("/reset")
def reset():
    conn = sqlite3.connect("chat.db")
    conn.execute("DELETE FROM chat")
    conn.commit()
    conn.close()
    return redirect(url_for("index"))

@app.route("/ask", methods=["POST"])
def ask():
    prompt = request.json.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "No prompt"}), 400

    save_to_db("user", prompt)
    try:
        bot_reply = ask_gemini(prompt)
    except Exception as e:
        bot_reply = f"Lỗi: {str(e)}"
    save_to_db("bot", bot_reply)
    html_msg = markdown.markdown(bot_reply, extensions=["fenced_code", "codehilite"])
    return jsonify({"reply": html_msg})

@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404

if __name__ == "__main__":
    app.run(debug=True)
# app.py