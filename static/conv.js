const convs = ['Hi there!',
        "Hey! What's going on?",
        'Hello! How can I help you today?',
        'Greetings! What would you like to chat about?',
        "Hey there! What's on your mind?",
        "Hi! It's great to hear from you. Anything interesting happening? ✨",
        'How may I be of service today?',
        "Woohoo! Let's get started!",
        "Hello! I'm here to assist you in any way I can.",
    ];


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var rn = getRandomInt(1898,2356);
const cran = getRandomInt(0,convs.length-1);
$(".help-txt").html(convs[cran]);


$("#user_msg, #send_msg").on('keydown',()=>{
    if (event.keyCode === 13) {
        event.preventDefault();
        $("#send_msg").click();
    }
})


function speakText(text) {
    if ('speechSynthesis' in window) {
        var utterance = new SpeechSynthesisUtterance(text);
        
        // Get available voices
        var voices = window.speechSynthesis.getVoices();

        // Find the voice by name
        var selectedVoice = voices.find(voice => voice.name === voiceName);
        
        // Set the selected voice
        utterance.voice = selectedVoice;

        window.speechSynthesis.speak(utterance);

        console.log('Speak', text);
    } else {
        console.error('Speech synthesis not supported');
    }
}

    

function scrollToBottom() {
    var container = document.getElementById('history');
    container.scrollTop = container.scrollHeight;
}

  
function formatServerResponse(response) {
    // Split the response into sections based on double line breaks
    var sections = response.split('\n\n');
    var formattedData = '';
    // Iterate through sections and format text
    sections.forEach(function(section) {
        var lines = section.split('\n');
        formattedData += '<div class="section">';
        lines.forEach(function(line) {
            if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                formattedData += '<p><strong>' + line.trim().substring(2, line.length - 2) + '</strong></p>';
            } else if (line.trim().startsWith('*')) {
                formattedData += '<ul><li><strong>' + line.trim().substring(1) + '</strong></li></ul>';
            } else {
                formattedData += '<p>' + line + '</p>';
            }
        });
        formattedData += '</div>';
    });

    return formattedData.replaceAll("**",'');
}

function codeformat(code){
    var format = `
        <pre><code class="language-python">
            ${code}
        </code></pre>
    `;
    return format;
}


