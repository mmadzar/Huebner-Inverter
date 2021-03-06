#!/bin/bash

echo " > Flash Arduino (Sketch)? (y/n)"
read yn
if [ $yn = y ]; then
    echo " > Over The Air (OTA)? (y/n)"
    read yn
    if [ $yn = y ]; then
        python ./tools/espota.py -i 192.168.4.1 -p 8266 -f flash-sketch.bin
    else
        # MacOS - /Library/Python/2.7/site-packages/
        sudo easy_install pip

        # Linux - /usr/lib/python2.7/site-packages/
        sudo pip install pyserial
        sudo pip install esptool
        sudo pip install ptool

        sudo esptool.py --port /dev/cu.usbserial --baud 115200 write_flash 0x000000 flash-sketch.bin
    fi
fi