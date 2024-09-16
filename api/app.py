from flask import Flask,jsonify, flash, render_template, request, redirect, url_for, session, send_file # type: ignore
import genai as ai
import sqlite3
import os
import datetime
import random
import string



app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

# SQLITE SETTINGS
current_directory = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_directory, "genai.db")
con = sqlite3.connect(db_path)
cur = con.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, fname TEXT, username TEXT, password TEXT)")
cur.execute("CREATE TABLE IF NOT EXISTS user_limit(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, token_allowed INTEGER, token_used INTEGER, created_at DATE)")
cur.execute("CREATE TABLE IF NOT EXISTS chat_config(username TEXT PRIMARY KEY, is_audio TEXT DEFAULT 'false', voice TEXT DEFAULT 'Microsoft George - English (United Kingdom)')")
con.commit()


def generate_link(length=5):
    characters = string.ascii_letters + string.digits
    random_string = ''.join(random.choices(characters, k=length))
    return random_string

# ================ ROUTINGS ============== #
# INDEX route
@app.route('/')
def index():
    if 'username' in session:
        with sqlite3.connect(db_path) as con:
            cur = con.cursor()
            query = """
                SELECT ul.token_allowed, ul.token_used, ul.created_at, u.fname, conf.is_audio, conf.voice
                FROM user_limit AS ul
                JOIN chat_config AS conf ON ul.username = conf.username
                JOIN users AS u ON ul.username = u.username
                WHERE ul.username = ?
            """
            res = cur.execute(query, (session['username'],))
            data = res.fetchone()
            con.commit()
            print(data)

            
            # GETTING THE DATA
            token_allowed = data[0]
            token_used = data[1]
            created_at = data[2]
            fname = data[3]
            is_audio = data[4]
            voice = data[5]

            config = {
                'token_allowed' : data[0],
                'token_used' : data[1],
                'created_at' : data[2],
                'fname' : data[3],
                'is_audio' : data[4],
                'voice': data[5],
            }

            # CHECK TOKEN NEEDS TO REFILL OR NOT!
            current_date = datetime.date.today()
            created_at = datetime.datetime.strptime(created_at, '%Y-%m-%d').date()
            if created_at < current_date:
                print("Old")
                token_used = 0
                cur.execute("UPDATE user_limit SET token_used = ?, created_at = ? WHERE username = ?", (token_used, current_date, session['username']))
            else:
                print("Same")
        

        return render_template('index.html',username=session['username'],token_allowed=token_allowed,token_used=token_used,fname=fname,is_audio=is_audio,config=config)
    else:
        return redirect(url_for('login'))

@app.route('/login',methods=['POST','GET'])
def login():
    if 'username' in session:
        return redirect(url_for('index'))
    else:
        return render_template('login.html')
    

@app.route('/register',methods=['POST','GET'])
def register():
    if 'username' in session:
        return redirect(url_for('index'))
    else:
        msg=''
        return render_template('register.html',msg=msg)


@app.route('/register_user', methods=['POST'])
def register_user():
    user = request.form['user']
    pasw = request.form['pwd']
    fname = request.form['name']

    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        res = cur.execute("SELECT * FROM users WHERE username = ?",(user,))
        id = res.fetchone()
        con.commit()
        
        if id:
            print('USER EXISTS',id)
            msg = 'User already exists.'
            return render_template('register.html',msg=msg)
        else:
            cur.execute("INSERT INTO chat_config(username, is_audio, voice) VALUES (?, ?, ?)",(user, False, 'Microsoft George - English (United Kingdom)'))
            cur.execute("INSERT INTO users (fname, username, password) VALUES (?, ?, ?)", (fname, user, pasw,))
            cur.execute("INSERT INTO user_limit (username, token_allowed, token_used, created_at) VALUES (?, ?, ?, ?)",(user, 20, 0, datetime.date.today()))
            con.commit()
            msg = 'Account created successfully.'
            return render_template('login.html',msg=msg) 


@app.route('/save_settings',methods=["POST"])
def save_settings():
    is_audio = request.json.get('is_audio')
    fname = request.json.get('fname')
    voice = request.json.get('voice')
    npass = request.json.get('new_pass')
    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        cur.execute("UPDATE chat_config SET is_audio = ?, voice = ? WHERE username = ?",(is_audio,voice,session['username'],))
        if npass:
            cur.execute("UPDATE users SET password = ? WHERE username = ?",(npass,session['username'],))
        if fname:
            cur.execute("UPDATE users SET fname = ? WHERE username = ?",(fname,session['username'],))
            
        return 'Success'


# Logout
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


# Authenticate user route
@app.route('/verify', methods=['POST'])
def verify():
    user = request.form['user']
    pasw = request.form['pwd']

    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        res = cur.execute("SELECT * FROM users WHERE username = ? AND password = ?",(user,pasw))
        id = res.fetchone()
        con.commit()
        print(id)

    if id:
        session['username'] = user
        return redirect(url_for('index')) 
    else:
        msg = 'Incorrect username and password.'
        return render_template('login.html',msg=msg) 


@app.route('/process_data', methods=['POST'])
def process_data():
    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        get_token = cur.execute("SELECT token_used FROM user_limit WHERE username = ?",(session['username'],))
        data = get_token.fetchone()
        tokens = data[0]

        if tokens >= 20:
            con.commit()
            jsn_data = {'msg':'TK_LMT_RCH','rec':'None'}
        else:
            token_used = tokens+1
            if token_used >= 20:
                token_used = 20
            else:
                token_used = token_used

            print('token used',token_used)
            cur.execute("UPDATE user_limit SET token_used = ? WHERE username = ?",(token_used,session['username']))
            con.commit()

            data = request.json.get('data')
            jsn_data = ai.send_message(data)

            print(jsn_data,jsn_data['msg'],jsn_data['rec'])

    return jsn_data


@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        msg = request.form.get('msg')
        
        if 'file' not in request.files:
            return 'No file part'
        file = request.files['file'] 

        if file.filename == '':
            return 'No selected file'
        
        response = ai.image_text(msg, file)
        print('UPLOAD',response)
        return response
    else:
        return 'Invalid request'



@app.route('/share',methods=['POST'])
def share():
    link = generate_link(5)
    usr = session['username']
    cont = request.json.get('data')
    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        res = cur.execute("SELECT link FROM sharing WHERE username = ? AND content = ?", (usr, cont))
        d = res.fetchone()
        if d:
            link = d[0]
        else:
            cur.execute("INSERT INTO sharing(username,link,content) VALUES(?, ?, ?)", (usr, link, cont))
        
        con.commit()
        return {'status':'Success','link':link}
            
@app.route('/view',methods=['GET'])
def view():
    link = request.args['link']
    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        res = cur.execute("SELECT * FROM sharing WHERE link = ?",(link,))
        data = res.fetchone()
        con.commit()

        if data:
            keys = ['id', 'name', 'link', 'description']
            data_dic = tuple_to_dict(keys,data)
        else:
            data_dic = {'status':'Invalid Link'}

    return render_template('share.html',data=data_dic)


def tuple_to_dict(keys,data_tuple):
    return dict(zip(keys, data_tuple))

if __name__ == '__main__':
    app.run(debug=True)
