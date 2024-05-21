var file_sel = false;
var voiceName;
var recom;
var toggle_voice = true;
var ispassword = true;

window.speechSynthesis.onvoiceschanged = function() {
    var voices = window.speechSynthesis.getVoices();
    voices.forEach((k,v)=>{
        $("#voices").append(`<option value="${voices[v]['voiceURI']}">${voices[v]['voiceURI']}</option>`);
    });
};

//=========SEND MESSAGE BUTTON EVENT===========//
$("#send_msg").click(async ()=>{
    var num = rn++;
    var conv_id = `conv-id-session-id-${num}`;
    var user_message = $("#user_msg").val();
    var c = '';
    
    if(!file_sel){
        c = `<div class="usermsg"><p class="usr_txt_msg">${user_message}</p></div>`;
        $("#history").append(c);
    }
    else{
        c = `<div class="usermsg">
                <p class="usr_txt_msg">${user_message}</p>
            </div>
            <div style="display: flex;gap: 15px;margin-left: 100px;text-align: justify;">
                <span class="img_container"><img src="./static/load.gif" class="img_inner" id="img-${conv_id}" style="height:200px;width:200px;"></span>
            </div>`;
        $("#history").append(c);
        var file = $("#uploadFile")[0].files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $(`#img-${conv_id}`).attr('src',e.target.result);
            };
            reader.readAsDataURL(file);
        }            
    }

    
    $("#user_msg").val('');
    
    
    var load = `<div class="botmsg" id='loading_'><span class="chat_icon chat_icon_pos"></span><b>Bot:</b><span class="material-symbols-outlined load" >sync</span></div>`;
    $("#history").append(load);

    var d = convs[getRandomInt(0,convs.length-1)];

    //===APP.PY===//
    var formattedData = '';
    var data = ''
    var reference = '';
    
    if(file_sel){
        console.log('MESSAGE + IMAGE ONLY FIRED!');
        data  = await image_message(user_message);
        $(".remove_img").click();
    }
    else{
        console.log('MESSAGE ONLY FIRED!');
        data =  await send(user_message);
    }

    textmsg = data['msg'];
    recom = data['rec'];
    
    console.log('data:',data);


    if(textmsg === "TK_LMT_RCH"){
        formattedData = '<b><span class="warn_limit">SORRY! YOUR TOKEN LIMIT REACHED.</span></b>';
        $("#token_used").html(20);
    }
    else{
        formattedData = textmsg;
        token_used >= 20 ? token_used : token_used++;
        $("#token_used").html(token_used);
    }
    

    if(formattedData.includes('```')){
        formattedData = codeformat(formattedData);
    }
    else{
        formattedData = formatServerResponse(formattedData);
    }


    var len = 0;
    try{
        len = recom.items.length;
    }
    catch{
        len = 0;
    }

    setTimeout(() => {
        $("#loading_").remove();
        var ci = '';
        var head = `<div class="botmsg">
                        <span class="chat_icon chat_icon_pos"></span>
                        <b>Bot:</b>
                        <br>
                        <div style="display:block;" class="${conv_id}">
                            ${formattedData} 
                            <div class="bottom-menu">
                                <span class="material-symbols-outlined copy-board" id="${conv_id}" onclick="copy(this.id)">content_copy</span>
                                <span class="material-symbols-outlined" id="share_${conv_id}" onclick="share(this.id)">share</span>
                            </div>`

        var reffer  =      `<div id="reference_${conv_id}" class="references">
                                ${reference}
                            </div>`;

        var closing =   `</div>
                       </div>`;

        if(len == 0 ){
            ci = head+closing;
        }
        else{
            ci = head+reffer+closing;
        }

        $("#history").append(ci);




        console.log('LENNN',len);
        if(len != 0){
            $(`#reference_${conv_id}`).html('');
            for(i=0;i<=len;i++){
                var imgsrc = "#";
                var link ="#";
                var title = '';
                try{
                    imgsrc =  recom.items[i].pagemap.cse_thumbnail[0]['src'];
                    title = recom.items[i].htmlTitle;
                    link = recom.items[i].link;
                    if(!imgsrc){
                        imgsrc = "#";
                    }
                }
                catch{
                    console.log('IMG_404');
                }
                
                var reference = `<div class="ref_d"><a href="${link}" target="_blank"><img src="${imgsrc}" height="100px" width="100px"><br><span>${title}</span><br><span></span></a></div><br><br>`;
    
                if(imgsrc != '#' && link  != '#' && title != ''){
                    $(`#reference_${conv_id}`).append(reference);
                }
            }
        }
        else{
            reference = '';
        }
        

        if(is_speak_allow){ speakText($(`.${conv_id} .section`).text()); }
        scrollToBottom();
    }, 100);
});

//==USER MESSAGE CHANGE===//
$("#user_msg").on('change',()=>{
    var m = $("#user_msg").val();
    if(m.length > 0){ $("#send_msg").attr('disabled',false); }
    else{ $("#send_msg").attr('disabled',true); }
});

$(".remove_img").click(()=>{
    $(".file_name").hide();
    $("#f_name").html('');
    file_sel = false;
})

    
//===FILE CHANGE====//
$('#uploadFile').change(()=>{
    file_sel = true;
    
    var formData = new FormData();
    var file = $("#uploadFile")[0].files[0];
    var msg = $("#user_msg").val();
    
    formData.append('file', file);
    formData.append('msg', msg);
    
    
    var filename  = formData.getAll('file')[0]['name'];
    $("#f_name").html(filename);
    $(".file_name").show();
    
    console.log('FILE SELECTED',filename,'msg:',formData.getAll('msg'));
})

$(".toggle_voice").click(()=>{
    if(toggle_voice){
        toggle_voice = false;
        is_speak_allow = false;
        $(".toggle_voice").html("toggle_off");
    }
    else{
        toggle_voice = true;
        is_speak_allow = true;
        $(".toggle_voice").html("toggle_on");
    }
})

$("#save_settings").click(()=>{
    var is_audio = is_speak_allow;
    var voice = $("#voices").val();
    var new_pass = $("#new_password").val();
    var fname = $(".your_name").val();
    
    voiceName = voice;

    var updations = {
        'fname':fname,
        'is_audio': is_audio,
        'voice': voice,
        'new_pass':new_pass,
    }
    console.log(updations);
    $("#pop_up,.overlay").fadeOut("fast");

    $.ajax({
        url: '/save_settings',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(updations),
        success: function(response) {
            console.log(response);

            toast('Settings Saved Successfully ');
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);

            toast('Error settings not saved ');
        }
    });        
})

$(".password_ico").click(()=>{
    if(ispassword){
        $(".view_password").attr('type','text');
        ispassword = false;
        $(".password_ico").html("visibility");
    }
    else{
        $(".view_password").attr('type','password');
        ispassword = true;
        $(".password_ico").html("visibility_off");
    }
})

$("#_setting_").click(()=>{
    $("#pop_up,.overlay").fadeIn("fast").show(); 
    $("#dropdown").hide();
})

$(".close_settings").click(()=>{
    $("#link_popup, #pop_up,.overlay").fadeOut("fast");
})


$("#image_upload").click(()=>{$('#uploadFile').click()});

$("#new_chat_start").click(()=>{
    $("#history").html(`<div class="no-chat-div"><span class="material-symbols-outlined no_chats">forum</span><p class="help-txt">Hey! What's going on?</p></div>`);
})

$("#user_msg").on('keydown',()=>{
    $("#mic_btn").hide();
    ($("#user_msg").val()).length >= 2 ? $("#mic_btn").hide() : $("#mic_btn").show();
})


$("#mic_btn").click(()=>{
    let recognization = new webkitSpeechRecognition();
    var ms = $("#user_msg");

    recognization.onstart = () => {
        ms.val("Listening...");
    }
    
    recognization.onresult = (e) => {
        var transcript = e.results[0][0].transcript;
        ms.val(transcript);
    }

    recognization.start();
})

function toast(txt){
    $("#toast_content").html(txt);
    
    $(".copy-toast").fadeIn("fast");
    
    setTimeout(() => {
        $(".copy-toast").fadeOut("fast");
    }, 2000);
}



function copy_link(){
    var link = $("#share_link").text().trim();
    navigator.clipboard.writeText(link);
    toast('Link Copied to Clipboard ');
}

function copy(id){
    console.log(id);
    var d = '';
    if(d.startsWith('```')){
        d = $(`.${id}`).text().replaceAll('content_copy','').replaceAll('\n','');
    }
    else{
        d = $(`.${id}`).text().replaceAll('content_copy','').replaceAll('\n','').trim();
    }
    navigator.clipboard.writeText(d);
    
    toast('Content Copied to Clipboard ');

    console.log(d);
}

function share(id){
    return new Promise(function(resolve, reject) {
        console.log(id);
    
        id = id.replace('share_','');
        var chat_data = $(`.${id} .section`).text().trim();
    
        $.ajax({
            url: '/share',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({data: chat_data}),
            success: function(response) {
                console.log(response);
                resolve(response);
                $("#share_link").html('http://127.0.0.1:5000/view?link='+response.link);
                $("#link_popup").show();
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
        })
    
}

function image_message(msg) {
    return new Promise(function(resolve, reject) {
        
        var formData = new FormData();
        var file = $("#uploadFile")[0].files[0];
    
        formData.append('file', file);
        formData.append('msg', msg);

        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) { resolve(response); },
            error: function(xhr, status, error) { resolve(error); }
        });
    });
}


function send(inputData){
    return new Promise(function(resolve, reject) {
    $.ajax({
        url: '/process_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({data: inputData}),
        success: function(response) {
            console.log(response);
            resolve(response);
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
        }
    });
    })
}



