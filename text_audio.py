from google.cloud import texttospeech

client = texttospeech.TextToSpeechClient()

synthesis_input = texttospeech.SynthesisInput(text="Quantum computers use qubits to perform calculations much faster than classical computers for certain tasks, like simulation and optimization, based on principles like superposition and entanglement. They have potential in cryptography and drug discovery but are still emerging technology.")

voice = texttospeech.VoiceSelectionParams(
    language_code="en-US",
    ssml_gender=texttospeech.SsmlVoiceGender.MALE,
    name="en-US-Standard-A"  # English male voice
)

audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.LINEAR16  # WAV format
)

response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)

with open("quantum_summary.wav", "wb") as out:
    out.write(response.audio_content)
    print("Audio content written to file 'quantum_summary.wav'")