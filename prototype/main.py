import os
from dotenv import load_dotenv
from openai import OpenAI
import gradio as gr
import requests
from bs4 import BeautifulSoup
import docx
import pdfplumber


class AIClient:
    def __init__(self, url: str = None, api_key: str = None, model: str = None):
        self._url = url
        self._api_key = api_key
        self.api = OpenAI(api_key=api_key, base_url=url)
        self.model = model

        self._system_prompt = None

    def completions(self, messages: list[any]):
        if not messages:
            return

        if self._system_prompt:
            messages.append(self._system_prompt)

        return self.api.chat.completions.create(model=self.model, messages=messages)

    def stream(self, messages: list[any]):
        if not messages:
            return

        if self._system_prompt:
            messages.append(self._system_prompt)

        return self.api.chat.completions.create(model=self.model, messages=messages, stream=True)

    def system_prompt(self, message: str):
        if not message:
            self._system_prompt = None
            return

        self._system_prompt = {"role": "system", "content": message}

    def user_prompt(self, message: str):
        return {"role": "user", "content": message}

def _check_path_exists(filePath: str) -> str:
    if not os.path.exists(filePath):
        print(f"File not found: {filePath}")
        return False

    return True

def _load_file_content(filePath: str) -> str:
    if not _check_path_exists(filePath):
        return None

    try:
        with open(filePath, "r", encoding="utf-8") as file:
            return file.read()
    except Exception as e:
        print(f"Error reading file {filePath}: {e}")
        return None

load_dotenv(override=True)

OPEN_API_KEY = os.getenv('OPENAI_API_KEY')
if OPEN_API_KEY:
    print(f"OpenAI API Key exists")
else:
    print("OpenAI API Key not set")

client = AIClient(api_key=OPEN_API_KEY, model="gpt-4.1-mini")

def fetch_website_contents(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    }

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, "html.parser")
    title = soup.title.string if soup.title else "No title found"
    if soup.body:
        for irrelevant in soup.body(["script", "style", "img", "input", "button"]):
            irrelevant.decompose()
        text = soup.body.get_text(separator="\n", strip=True)
    else:
        text = ""
    return title + "\n\n" + text

def generate_suggestion(resume, job):
    client.system_prompt(_load_file_content("prompts/suggestion_system_prompt.md"))
    messages = _load_file_content("prompts/suggestion_user_prompt.md")

    messages = messages.replace("{JOB_DESCRIPTION}", job).replace("{RESUME}", resume)
    response = client.completions([client.user_prompt(messages)])
    return response.choices[0].message.content

def generate_analysis(resume: str, job: str, recommendations: str):
    client.system_prompt(_load_file_content("prompts/analysis_system_prompt.md"))
    messages = _load_file_content("prompts/analysis_user_prompt.md")

    messages = messages.replace("{JOB_DESCRIPTION}", job).replace("{RESUME}", resume).replace("{RECOMMENDATIONS}", recommendations)
    response = client.completions([client.user_prompt(messages)])
    return response.choices[0].message.content

def generate_cover_letter(resume: str, job: str):
    client.system_prompt(_load_file_content("prompts/cover_letter_system_prompt.md"))
    messages = _load_file_content("prompts/cover_letter_user_prompt.md")

    messages = messages.replace("{JOB_DESCRIPTION}", job).replace("{RESUME}", resume)
    response = client.completions([client.user_prompt(messages)])
    return response.choices[0].message.content

def generate_questions(job: str):
    client.system_prompt(_load_file_content("prompts/questions_system_prompt.md"))
    messages = _load_file_content("prompts/questions_user_prompt.md")

    messages = messages.replace("{JOB_DESCRIPTION}", job)
    response = client.completions([client.user_prompt(messages)])
    return response.choices[0].message.content

def extract_description(link):
    if not link:
        return None

    content = fetch_website_contents(link)
    if not content:
        return None

    client.system_prompt(_load_file_content("prompts/extract_system_prompt.md"))
    messages = _load_file_content("prompts/extract_user_prompt.md")

    messages = messages.replace("{HTML_CONTENT}", content)
    response = client.completions([client.user_prompt(messages)])
    return response.choices[0].message.content

history = []
def generate(resume, job, history):
    current_resume = resume
    recommendations = ""
    # if history:
    #     current_resume = history[-1]["suggestion"]
    #     recommendations = history[-1]["analysis"]

    # new_resume = generate_suggestion(current_resume, job)
    # if new_resume:
    #     analysis = generate_analysis(new_resume, job, recommendations)
    #     cover_letter = generate_cover_letter(new_resume, job)

    #return (new_resume, analysis, cover_letter)
    return ("new resume", "analytics", "cover_letter")


def add_version(versions, resume, job):
    suggestion, analysis, cover_letter = generate(resume, job, versions)

    versions.append({
        "name": f"Version {len(versions) + 1}",
        "suggestion": suggestion,
        "analysis": analysis,
        "cover_letter": cover_letter,
    })

    names = [v["name"] for v in versions]
    return (
        versions,
        gr.update(choices=names, value=names[-1]),
        suggestion,
        analysis,
        cover_letter,
    )

def select_version(version_name, versions):
    for v in versions:
        if v["name"] == version_name:
            return v["suggestion"], v["analysis"]
    return "", ""

def load_resume(file):
    if file is None:
        return gr.update()

    name = file.name.lower()

    if name.endswith(".txt") or name.endswith(".md"):
        return open(file.name, "r", encoding="utf-8", errors="ignore").read()

    if name.endswith(".docx"):
        doc = docx.Document(file.name)
        return "\n".join([p.text for p in doc.paragraphs])

    if name.endswith(".pdf"):
        text = []

        with pdfplumber.open(file.name) as pdf:
            for page in pdf.pages:
                text.append(page.extract_text() or "")
        return "\n".join(text)

    return ""

def run_ui():
    with gr.Blocks() as ui:
        gr.HTML("""
<style>
/* Force narrow sidebar */
#version_col {
    flex: 0 0 150px !important;   /* fixed width */
    max-width: 150px !important;
}

/* Remove padding from the form wrapper */
#version_col .form {
    padding: 0 !important;
    margin: 0 !important;
}

/* The scrollable list of versions */
#version_col fieldset.block > .wrap {
    max-height: 500px !important;   /* limit height */
    overflow-y: auto !important;    /* enable scrolling */
    overflow-x: hidden !important;
    display: block !important;      /* ensure scroll works */
}

/* Optional: tighten spacing between version items */
#version_col label.svelte-19qdtil {
    padding: 2px 4px !important;
    display: block !important;
}
</style>
            """)

        versions_state = gr.State([])

        with gr.Row(equal_height=True):
            with gr.Column():
                resume = gr.Textbox(
                    label="Current Resume",
                    lines=21
                )
                resume_file = gr.File(
                    label="Upload Resume File",
                    file_types=[".pdf", ".docx", ".txt", ".md"],
                    interactive=True,
                    height=90
                )

            with gr.Column():
                with gr.Row():
                    job = gr.Textbox(
                        label="Job Description",
                        lines=21
                    )
                with gr.Row():
                    link_btn = gr.Textbox(
                        label="Job Description Link",
                        placeholder="Enter link to extract job description",
                        lines=1,
                        submit_btn=True,
                        interactive=True,
                        max_lines=1
                    )

        with gr.Row():
            generate_btn = gr.Button("Generate")

        with gr.Row(equal_height=True):
            with gr.Column(elem_id="version_col", variant="compact", min_width=150):
                version_selector = gr.Radio(
                    label="Versions",
                    choices=[],
                    value=None
                )

            with gr.Column():
                with gr.Tabs():
                    with gr.TabItem("Resume"):
                        suggestion = gr.Markdown(
                            max_height=500,
                            min_height=500,
                            container=True,
                            buttons=["copy"]
                        )
                    with gr.TabItem("Analysis"):
                        analysis = gr.Markdown(
                            max_height=500,
                            min_height=500,
                            container=True,
                            buttons=["copy"]
                        )
                    with gr.TabItem("Cover Letter"):
                        cover_letter = gr.Markdown(
                            max_height=500,
                            min_height=500,
                            container=True,
                            buttons=["copy"]
                        )

        link_btn.submit(extract_description, inputs=[link_btn], outputs=[job])

        generate_btn.click(
            add_version,
            inputs=[versions_state, resume, job],
            outputs=[versions_state, version_selector, suggestion, analysis, cover_letter],
            show_progress=True,
        )

        version_selector.change(
            select_version,
            inputs=[version_selector, versions_state],
            outputs=[suggestion, analysis, cover_letter],
        )

        resume_file.change(
            load_resume,
            inputs=resume_file,
            outputs=resume
        )


    ui.launch()


run_ui()