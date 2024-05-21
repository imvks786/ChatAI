import google.generativeai as genai
import PIL.Image
import textwrap
from IPython.display import Markdown
import recommendation as rec

GOOGLE_API_KEY='YOUR_API_KEY'
genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel('gemini-pro')
chat = model.start_chat(history=[])

def to_markdown(text):
  text = text.replace('•', '  *')
  return Markdown(textwrap.indent(text, '> ', predicate=lambda _: True))

def send_message(message):
    response = chat.send_message(message)    
    for chunk in response:
        print(chunk.text)
        print("_"*80)
    recom = rec.search(message)
    chat_response = chunk.text
    return {'msg':chat_response,'rec':recom}


def image_text(msg,image):
    img = PIL.Image.open(image)
    model = genai.GenerativeModel('gemini-pro-vision')
    response = model.generate_content([msg, img], stream=False)
    return response.text

