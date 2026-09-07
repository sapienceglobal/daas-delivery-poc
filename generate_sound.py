import wave
import struct
import math

def generate_zhooop_sound(filename, sample_rate=44100, duration=1.0):
    num_samples = int(sample_rate * duration)
    amplitude = 32767

    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)

        for i in range(num_samples):
            t = float(i) / sample_rate
            
            # Zhooop effect: Frequency increases over time
            # Start around 300Hz and sweep up to 800Hz
            freq = 300 + (500 * (t / duration))
            
            # Add an envelope to make it fade out nicely
            envelope = math.exp(-3 * t)
            
            # Generate the sine wave sample
            value = int(amplitude * envelope * math.sin(2.0 * math.pi * freq * t))
            
            # Pack the sample into a binary string and write it
            data = struct.pack('<h', value)
            wav_file.writeframesraw(data)

if __name__ == "__main__":
    generate_zhooop_sound("merchant_mobile/android/app/src/main/res/raw/new_order_sound.wav", duration=0.8)
    print("Sound generated successfully.")
