import VoiceToText from '../components/VoiceToText';

export const useVoiceToText = (options = {}) => {
  const {
    onResults,
    onStart,
    onEnd,
    onError,
    language = 'en-US',
    continuous = true
  } = options;

  return VoiceToText({
    onTranscriptChange: onResults,
    onStart,
    onEnd,
    onError,
    language,
    continuous
  });
};

export default useVoiceToText;