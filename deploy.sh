#/bin/sh
# warmer app deploy script

sudo apt-get install -y git

sudo apt-get update
sudo apt-get install -y software-properties-common
sudo apt-get install -y python-software-properties python g++ make
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y nodejs

sudo apt-get install -y mongodb
sudo apt-get install -y redis-server

sudo npm -g install forever

sudo git clone http://github.com/mchambers/warmer /var/apps/warmer
cd /var/apps/warmer
sudo npm install
sudo cp upstart.conf /etc/init/warmer.conf
sudo start warmer
