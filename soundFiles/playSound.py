import pygame

#os.environ['SDL_AUDIODRIVER'] = 'dsp'

pygame.mixer.init()
pygame.mixer.music.load("./soundFiles/alarm.mp3")
pygame.mixer.music.play()
while pygame.mixer.music.get_busy() == True:
    continue

# amixer
# alsamixer
# delete the /etc/modprobe.d/alsa-base.conf
