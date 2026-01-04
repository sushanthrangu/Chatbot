# app.py — Q&A Bot using Groq (LLM-only, no training, no RAG)
# Run: streamlit run app.py

import os
import pathlib
import streamlit as st
from dotenv import load_dotenv
from rag.retriever import retrieve_relevant_chunks

# Groq SDK
try:
    from groq import Groq
except Exception:
    st.error("Groq package not found. Run: pip install groq streamlit python-dotenv")
    st.stop()

# ---------- 1) Load configuration ----------
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

SYSTEM_PROMPT_PATH = pathlib.Path("prompts/system.txt")
if SYSTEM_PROMPT_PATH.exists():
    SYSTEM_PROMPT = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
else:
    SYSTEM_PROMPT = (
        "You are a concise, helpful Q&A assistant. "
        "Answer clearly. If unsure, say so briefly and suggest what info is needed."
    )

# ---------- 2) Define UI ----------
st.set_page_config(page_title="Q&A Bot", page_icon="⚡")
st.title("⚡ Q&A Bot ")
st.caption("Powered by Groq’s Llama models • No training • No private docs (yet)")

with st.sidebar:
    st.header("Settings")
    model = st.text_input(
        "Model",
        value=DEFAULT_MODEL,
        help="e.g., llama-3.1-8b-instant or llama-3.1-70b-versatile"
    )
    temperature = st.slider("Temperature", 0.0, 1.0, 0.2, 0.1)
    max_tokens = st.number_input("Max tokens", min_value=64, max_value=4096, value=512, step=64)
    show_usage = st.checkbox("Show token usage (if available)", value=False)
    st.divider()
    st.caption("Set GROQ_API_KEY in .env")

if not API_KEY:
    st.warning("No GROQ_API_KEY found. Create a .env file and set your key.")
    st.stop()

question = st.text_area(
    "Ask a question:",
    height=140,
    placeholder="e.g., What is Java in one paragraph?"
)
style = st.selectbox("Answer style", ["Concise", "Detailed"])
go = st.button("Generate Answer", type="primary")

# ---------- 3) Build client ----------
client = Groq(api_key=API_KEY)

def build_messages(user_question: str, style: str):
    # 1) RAG retrieval
    top_chunks = retrieve_relevant_chunks(user_question, k=4)
    context = "\n\n".join(
        [f"[Source: {c['source']}]\n{c['content']}" for c in top_chunks]
    ) or "No relevant context."

    # 2) Style suffix
    suffix = " Keep it brief." if style == "Concise" else " Provide a bit more detail and one small example."

    # 3) Grounding instruction
    grounding_rules = (
        "Use ONLY the context below to answer. If the answer is not in the context, say "
        "\"I'm not sure based on the provided documents.\""
    )

    # 4) Messages
    return [
        {"role": "system", "content": SYSTEM_PROMPT + " Always follow grounding rules."},
        {"role": "user", "content": f"{grounding_rules}\n\n# Context\n{context}\n\n# Question\n{user_question.strip()}{suffix}"},
    ]

# ---------- 4) Handle submit ----------
if go:
    q = (question or "").strip()
    if not q:
        st.info("Please type a question first.")
    else:
        try:
            with st.spinner("Thinking..."):
                messages = build_messages(q, style)

                # Groq chat completions (OpenAI-compatible schema)
                resp = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=float(temperature),
                    max_tokens=int(max_tokens),
                )

            answer = resp.choices[0].message.content
            st.markdown("### Answer")
            st.write(answer)
            # Show sources (from the same retrieval used to build messages)
            with st.expander("Show sources"):
                if 'messages' in locals() and "# Context" in messages[-1]["content"]:
                    ctx = messages[-1]["content"].split("# Context", 1)[1].split("# Question", 1)[0].strip()
                    st.code(ctx[:4000])  # show the grounded snippets with their [Source: ...] headers
                else:
                    st.write("No context retrieved.")


            # Groq’s API may not always return token usage; show if present.
            usage = getattr(resp, "usage", None)
            if show_usage and usage:
                st.caption(
                    f"Tokens — prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens}, total: {usage.total_tokens}"
                )
        except Exception as e:
            st.error(f"Error: {e}")
