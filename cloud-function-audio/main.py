"""
Cloud Function: Process Dialogflow CX Audio
- Auto-detects audio format
- Transcribes with Speech-to-Text
- Stores in Firestore
"""

import json
from google.cloud import storage
from google.cloud import speech_v1
from google.cloud import firestore
from datetime import datetime

def process_dialogflow_audio(event, context):
    """Main function triggered by Cloud Storage"""
    try:
        bucket_name = event['bucket']
        file_name = event['name']
        
        print(f"🎤 Processing audio: gs://{bucket_name}/{file_name}")
        
        # Skip non-audio files
        if not file_name.lower().endswith(('.wav', '.mp3', '.flac', '.ogg')):
            print(f"⏭️ Skipping non-audio file: {file_name}")
            return {"status": "skipped", "reason": "not an audio file"}
        
        # Extract session ID from filename
        session_id = file_name.replace('.wav', '').replace('.mp3', '').replace('.flac', '').replace('.ogg', '').split('/')[-1]
        
        # Initialize clients
        speech_client = speech_v1.SpeechClient()
        db = firestore.Client(project='chennai-geniai')
        
        # Audio URI
        audio_uri = f"gs://{bucket_name}/{file_name}"
        audio = speech_v1.RecognitionAudio(uri=audio_uri)
        
        # Try multiple audio configurations
        # Try multiple audio configurations
        configs_to_try = [
            # Config 1: LINEAR16 44100Hz (CD quality)
            {
                'encoding': speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
                'sample_rate_hertz': 44100,
                'language_code': 'en-US',
                'enable_automatic_punctuation': True,
                'diarization_config': speech_v1.SpeakerDiarizationConfig(
                    enable_speaker_diarization=True,
                    min_speaker_count=2,
                    max_speaker_count=2
                )
            },
            # Config 2: LINEAR16 16kHz
            {
                'encoding': speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
                'sample_rate_hertz': 16000,
                'language_code': 'en-US',
                'enable_automatic_punctuation': True,
                'diarization_config': speech_v1.SpeakerDiarizationConfig(
                    enable_speaker_diarization=True,
                    min_speaker_count=2,
                    max_speaker_count=2
                )
            },
            # Config 3: MULAW 8kHz (Dialogflow CX phone)
            {
                'encoding': speech_v1.RecognitionConfig.AudioEncoding.MULAW,
                'sample_rate_hertz': 8000,
                'language_code': 'en-US',
                'enable_automatic_punctuation': True,
                'model': 'phone_call',
                'diarization_config': speech_v1.SpeakerDiarizationConfig(
                    enable_speaker_diarization=True,
                    min_speaker_count=2,
                    max_speaker_count=2
                )
            },
            # Config 4: LINEAR16 8kHz
            {
                'encoding': speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
                'sample_rate_hertz': 8000,
                'language_code': 'en-US',
                'enable_automatic_punctuation': True,
                'model': 'phone_call',
                'diarization_config': speech_v1.SpeakerDiarizationConfig(
                    enable_speaker_diarization=True,
                    min_speaker_count=2,
                    max_speaker_count=2
                )
            }
        ]
        
        # Try each configuration
        response = None
        for i, config_dict in enumerate(configs_to_try, 1):
            try:
                print(f"🔊 Trying config {i}: {config_dict['encoding'].name} @ {config_dict['sample_rate_hertz']}Hz...")
                config = speech_v1.RecognitionConfig(**config_dict)
                operation = speech_client.long_running_recognize(config=config, audio=audio)
                response = operation.result(timeout=300)
                print(f"✅ Success with config {i}!")
                break
            except Exception as e:
                print(f"❌ Config {i} failed: {str(e)}")
                continue
        
        if not response:
            raise Exception("All audio configurations failed")
        
        # Parse transcript with speaker labels
        transcript_lines = []
        for result in response.results:
            alternative = result.alternatives[0]
            
            if hasattr(alternative, 'words') and alternative.words:
                words_info = alternative.words
                current_speaker = None
                current_text = []
                
                for word_info in words_info:
                    speaker = word_info.speaker_tag
                    
                    if speaker != current_speaker:
                        if current_text:
                            speaker_label = "Student" if current_speaker == 1 else "Instructor"
                            transcript_lines.append(f"{speaker_label}: {' '.join(current_text)}")
                        current_speaker = speaker
                        current_text = [word_info.word]
                    else:
                        current_text.append(word_info.word)
                
                if current_text:
                    speaker_label = "Student" if current_speaker == 1 else "Instructor"
                    transcript_lines.append(f"{speaker_label}: {' '.join(current_text)}")
            else:
                # No speaker diarization, just use the transcript
                transcript_lines.append(f"Speaker: {alternative.transcript}")
        
        transcript = "\n".join(transcript_lines)
        print(f"✓ Transcribed {len(transcript_lines)} lines")
        print(f"📝 Transcript preview: {transcript[:200]}...")
        
        # Update Firestore
     
        conversation_ref = db.collection('conversations').document(session_id)
        doc = conversation_ref.get()
        
        if doc.exists:
            conversation_ref.update({
                'audioFileUrl': audio_uri,
                'audioTranscript': transcript,
                'audioTranscribedAt': datetime.utcnow().isoformat(),
                'hasAudio': True
            })
            print(f"✓ Updated existing conversation: {session_id}")
        else:
            conversation_ref.set({
                'sessionId': session_id,
                'audioFileUrl': audio_uri,
                'audioTranscript': transcript,
                'audioTranscribedAt': datetime.utcnow().isoformat(),
                'hasAudio': True,
                'startTime': datetime.utcnow().isoformat(),
                'channel': 'Audio',
                'status': 'completed',
                'turns': []
            })
            print(f"✓ Created new conversation: {session_id}")
        
        return {"status": "success", "sessionId": session_id}
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}